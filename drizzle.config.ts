import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { connectionOptions } from "./src/db/connection";

config({ path: [".env.local", ".env"], quiet: true });

const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  // Only needed for migrate/studio; `generate` works without a database.
  ...(url ? { dbCredentials: connectionOptions(url) } : {}),
  strict: true,
  verbose: true,
});
