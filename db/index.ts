import { drizzle } from "drizzle-orm/netlify-db";
import * as schema from "./schema";

/** Netlify Database (managed Postgres). The connection is configured automatically by the platform. */
export const db = drizzle({ schema });

export { schema };
