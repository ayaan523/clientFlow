import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../db/pool.js";
import { AppError } from "../middleware/errors.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
const router = Router();
const credentials = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(72),
});
const clientInput = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  company: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
});
const dealInput = z.object({
  title: z.string().min(1).max(160),
  value: z.coerce.number().min(0),
  stage: z
    .enum(["lead", "qualified", "proposal", "negotiation", "won", "lost"])
    .default("lead"),
  clientId: z.string().uuid().optional(),
  closeDate: z.string().optional(),
});
router.get("/health", (req, res) =>
  res.json({ status: "ok", service: "clientflow-api" }),
);
router.post("/auth/register", async (req, res, next) => {
  try {
    const input = credentials.parse(req.body);
    const hash = await bcrypt.hash(input.password, 12);
    const result = await query(
      "INSERT INTO users(email,password_hash) VALUES($1,$2) RETURNING id,email",
      [input.email, hash],
    );
    const org = await query(
      "INSERT INTO organizations(name) VALUES($1) RETURNING id,name",
      ["My workspace"],
    );
    await query(
      "INSERT INTO memberships(user_id,organization_id,role) VALUES($1,$2,$3)",
      [result.rows[0].id, org.rows[0].id, "owner"],
    );
    req.session.userId = result.rows[0].id;
    res
      .status(201)
      .json({ data: { user: result.rows[0], organization: org.rows[0] } });
  } catch (error: any) {
    next(
      error.code === "23505"
        ? new AppError(409, "An account with that email already exists")
        : error,
    );
  }
});
router.post("/auth/login", async (req, res, next) => {
  try {
    const input = credentials.parse(req.body);
    const result = await query(
      "SELECT id,email,password_hash FROM users WHERE email=$1",
      [input.email],
    );
    if (
      !result.rows[0] ||
      !(await bcrypt.compare(input.password, result.rows[0].password_hash))
    )
      throw new AppError(401, "Invalid email or password");
    req.session.userId = result.rows[0].id;
    res.json({
      data: { user: { id: result.rows[0].id, email: result.rows[0].email } },
    });
  } catch (error) {
    next(error);
  }
});
router.post("/auth/logout", (req, res) =>
  req.session.destroy(() => res.status(204).send()),
);
router.get("/auth/me", requireAuth, (req, res) =>
  res.json({
    data: {
      user: { id: req.user.id, email: req.user.email },
      organization: {
        id: req.user.organization_id,
        name: req.user.organization_name,
        role: req.user.role,
      },
    },
  }),
);
router.use(requireAuth);
router.get("/clients", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1),
      limit = Math.min(50, Number(req.query.limit) || 10),
      search = String(req.query.search || "");
    const params = [
      req.user.organization_id,
      `%${search}%`,
      limit,
      (page - 1) * limit,
    ];
    const result = await query(
      "SELECT * FROM clients WHERE organization_id=$1 AND status='active' AND (name ILIKE $2 OR company ILIKE $2 OR email ILIKE $2) ORDER BY created_at DESC LIMIT $3 OFFSET $4",
      params,
    );
    const count = await query(
      "SELECT count(*)::int total FROM clients WHERE organization_id=$1 AND status='active' AND (name ILIKE $2 OR company ILIKE $2 OR email ILIKE $2)",
      params.slice(0, 2),
    );
    res.json({
      data: result.rows,
      pagination: { page, limit, total: count.rows[0].total },
    });
  } catch (error) {
    next(error);
  }
});
router.post("/clients", async (req, res, next) => {
  try {
    const input = clientInput.parse(req.body),
      result = await query(
        "INSERT INTO clients(organization_id,name,email,company,phone) VALUES($1,$2,$3,$4,$5) RETURNING *",
        [
          req.user.organization_id,
          input.name,
          input.email || null,
          input.company || null,
          input.phone || null,
        ],
      );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
router.patch("/clients/:id", async (req, res, next) => {
  try {
    const input = clientInput.partial().parse(req.body),
      keys = Object.keys(input);
    if (!keys.length) throw new AppError(400, "No changes supplied");
    const values = [
      req.params.id,
      req.user.organization_id,
      ...keys.map((key) => (input as any)[key]),
    ];
    const set = keys.map((key, index) => `${key}=$${index + 3}`).join(",");
    const result = await query(
      `UPDATE clients SET ${set},updated_at=now() WHERE id=$1 AND organization_id=$2 RETURNING *`,
      values,
    );
    if (!result.rows[0]) throw new AppError(404, "Client not found");
    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
router.delete("/clients/:id", async (req, res, next) => {
  try {
    const result = await query(
      "UPDATE clients SET status='archived' WHERE id=$1 AND organization_id=$2",
      [req.params.id, req.user.organization_id],
    );
    if (!result.rowCount) throw new AppError(404, "Client not found");
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
router.get("/deals", async (req, res, next) => {
  try {
    const result = await query(
      "SELECT d.*,c.name client_name FROM deals d LEFT JOIN clients c ON c.id=d.client_id WHERE d.organization_id=$1 ORDER BY d.updated_at DESC",
      [req.user.organization_id],
    );
    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});
router.post("/deals", async (req, res, next) => {
  try {
    const input = dealInput.parse(req.body),
      result = await query(
        "INSERT INTO deals(organization_id,client_id,owner_id,title,value,stage,close_date) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
        [
          req.user.organization_id,
          input.clientId || null,
          req.user.id,
          input.title,
          input.value,
          input.stage,
          input.closeDate || null,
        ],
      );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
router.patch("/deals/:id", async (req, res, next) => {
  try {
    const input = dealInput.partial().parse(req.body);
    const result = await query(
      "UPDATE deals SET title=COALESCE($3,title),value=COALESCE($4,value),stage=COALESCE($5,stage),close_date=COALESCE($6,close_date),updated_at=now() WHERE id=$1 AND organization_id=$2 RETURNING *",
      [
        req.params.id,
        req.user.organization_id,
        input.title,
        input.value,
        input.stage,
        input.closeDate || null,
      ],
    );
    if (!result.rows[0]) throw new AppError(404, "Deal not found");
    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
router.get("/activities", async (req, res, next) => {
  try {
    const result = await query(
      "SELECT a.*,c.name client_name FROM activities a LEFT JOIN clients c ON c.id=a.client_id WHERE a.organization_id=$1 ORDER BY a.due_at ASC LIMIT 30",
      [req.user.organization_id],
    );
    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});
router.post("/activities", async (req, res, next) => {
  try {
    const input = z
      .object({
        title: z.string().min(1),
        type: z.enum(["call", "meeting", "email", "follow_up"]),
        dueAt: z.string().datetime(),
        clientId: z.string().uuid().optional(),
      })
      .parse(req.body);
    const result = await query(
      "INSERT INTO activities(organization_id,client_id,user_id,type,title,due_at) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
      [
        req.user.organization_id,
        input.clientId || null,
        req.user.id,
        input.type,
        input.title,
        input.dueAt,
      ],
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
router.patch("/activities/:id/complete", async (req, res, next) => {
  try {
    const result = await query(
      "UPDATE activities SET completed=NOT completed WHERE id=$1 AND organization_id=$2 RETURNING *",
      [req.params.id, req.user.organization_id],
    );
    if (!result.rows[0]) throw new AppError(404, "Activity not found");
    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});
router.get("/analytics", async (req, res, next) => {
  try {
    const org = req.user.organization_id;
    const [clients, deals, revenue, stages, activities] = await Promise.all([
      query(
        "SELECT count(*)::int total FROM clients WHERE organization_id=$1 AND status='active'",
        [org],
      ),
      query(
        "SELECT count(*)::int total,COALESCE(sum(value),0)::numeric pipeline FROM deals WHERE organization_id=$1 AND stage NOT IN ('won','lost')",
        [org],
      ),
      query(
        "SELECT COALESCE(sum(value),0)::numeric revenue FROM deals WHERE organization_id=$1 AND stage='won'",
        [org],
      ),
      query(
        "SELECT stage,count(*)::int count,COALESCE(sum(value),0)::numeric value FROM deals WHERE organization_id=$1 GROUP BY stage",
        [org],
      ),
      query(
        "SELECT * FROM activities WHERE organization_id=$1 AND completed=false ORDER BY due_at ASC LIMIT 5",
        [org],
      ),
    ]);
    res.json({
      data: {
        activeClients: clients.rows[0].total,
        openDeals: deals.rows[0].total,
        pipelineValue: deals.rows[0].pipeline,
        wonRevenue: revenue.rows[0].revenue,
        stages: stages.rows,
        upcomingActivities: activities.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});
router.get(
  "/members",
  requireRole("owner", "admin"),
  async (req, res, next) => {
    try {
      const result = await query(
        "SELECT u.id,u.email,m.role FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.organization_id=$1",
        [req.user.organization_id],
      );
      res.json({ data: result.rows });
    } catch (error) {
      next(error);
    }
  },
);
export default router;
