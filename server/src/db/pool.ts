import pg from "pg";
import { env } from "../config/env.js";
export const pool = new pg.Pool({ connectionString: env.databaseUrl, max: 10 });
export const query = (text: string, params?: unknown[]) =>
  pool.query(text, params);
