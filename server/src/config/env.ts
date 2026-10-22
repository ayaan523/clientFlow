import "dotenv/config";
import { z } from "zod";
const parsed = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().default(4300),
    DATABASE_URL: z
      .string()
      .min(1)
      .default("postgres://clientflow:clientflow@localhost:5434/clientflow"),
    SESSION_SECRET: z
      .string()
      .min(16)
      .default("local-development-secret-change-me"),
    CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  })
  .parse(process.env);
export const env = {
  port: parsed.PORT,
  databaseUrl: parsed.DATABASE_URL,
  sessionSecret: parsed.SESSION_SECRET,
  clientOrigin: parsed.CLIENT_ORIGIN,
  nodeEnv: parsed.NODE_ENV,
};
