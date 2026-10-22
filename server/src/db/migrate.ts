import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";
const dir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../migrations",
);
const files = (await fs.readdir(dir))
  .filter((file) => file.endsWith(".sql") && !file.endsWith(".down.sql"))
  .sort();
try {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  for (const file of files) {
    const exists = await pool.query(
      "SELECT 1 FROM schema_migrations WHERE name=$1",
      [file],
    );
    if (exists.rowCount) continue;
    await pool.query("BEGIN");
    try {
      await pool.query(await fs.readFile(path.join(dir, file), "utf8"));
      await pool.query("INSERT INTO schema_migrations(name) VALUES($1)", [
        file,
      ]);
      await pool.query("COMMIT");
      console.log(`Applied ${file}`);
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }
} catch (error) {
  console.error(
    `Migration failed: ${error instanceof Error ? error.message : error}`,
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
