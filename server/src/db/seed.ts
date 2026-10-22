import bcrypt from "bcryptjs";
import { query, pool } from "./pool.js";
const email = "demo@clientflow.local";
const password = await bcrypt.hash("demo-password", 12);
try {
  const user = await query(
    "INSERT INTO users(email,password_hash) VALUES($1,$2) ON CONFLICT(email) DO UPDATE SET email=EXCLUDED.email RETURNING id",
    [email, password],
  );
  const org = await query(
    "INSERT INTO organizations(name) VALUES($1) ON CONFLICT DO NOTHING RETURNING id",
    ["Northstar Studio"],
  );
  const orgId =
    org.rows[0]?.id ||
    (
      await query("SELECT id FROM organizations WHERE name=$1", [
        "Northstar Studio",
      ])
    ).rows[0].id;
  await query(
    "INSERT INTO memberships(user_id,organization_id,role) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
    [user.rows[0].id, orgId, "owner"],
  );
  await query(
    "INSERT INTO clients(organization_id,name,email,company) SELECT $1,x.email,x.email,x.company FROM (VALUES ('Acme Labs','hello@acme.test','Acme Labs'),('Brightside Co','team@brightside.test','Brightside Co'),('Northwind','ops@northwind.test','Northwind')) x(name,email,company) WHERE NOT EXISTS(SELECT 1 FROM clients WHERE organization_id=$1)",
    [orgId],
  );
  console.log(`Demo user: ${email} / demo-password`);
} finally {
  await pool.end();
}
