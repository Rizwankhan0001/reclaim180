import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { mysqlSettings } from "./src/db/connection";

config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: mysqlSettings(),
  strict: true,
  verbose: true,
});
