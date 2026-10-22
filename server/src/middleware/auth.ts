import { AppError } from "./errors.js";
import { query } from "../db/pool.js";
export async function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId)
    return next(new AppError(401, "Authentication required"));
  try {
    const result = await query(
      "SELECT u.id,u.email,m.organization_id,m.role,o.name AS organization_name FROM users u JOIN memberships m ON m.user_id=u.id JOIN organizations o ON o.id=m.organization_id WHERE u.id=$1 LIMIT 1",
      [req.session.userId],
    );
    if (!result.rows[0])
      return next(new AppError(401, "Session is no longer valid"));
    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}
export function requireRole(...roles: string[]) {
  return (req: any, res: any, next: any) =>
    roles.includes(req.user.role)
      ? next()
      : next(new AppError(403, "You do not have permission for this action"));
}
