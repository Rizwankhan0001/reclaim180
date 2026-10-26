import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { mysqlSettings } from "./connection";
import * as schema from "./schema";

/*
 * One small pool per server instance. On Vercel, warm functions reuse it;
 * in development the global keeps hot reloads from opening new pools.
 */
const globalForDb = globalThis as unknown as { mysqlPool?: mysql.Pool };

const pool =
  globalForDb.mysqlPool ??
  mysql.createPool({
    ...mysqlSettings(),
    timezone: "Z",
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60_000,
    enableKeepAlive: true,
    waitForConnections: true,
  });

if (process.env.NODE_ENV !== "production") globalForDb.mysqlPool = pool;

export const db = drizzle({ client: pool, schema, mode: "default" });
export { schema };
