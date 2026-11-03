// Applies pending Drizzle migrations before `next build`.
// Skips (without failing the build) when DATABASE_URL isn't available.
import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.warn("[migrate] DATABASE_URL is not set; skipping database migrations.");
  process.exit(0);
}

const result = spawnSync("npx", ["drizzle-kit", "migrate"], { stdio: "inherit", shell: process.platform === "win32" });
process.exit(result.status ?? 1);
