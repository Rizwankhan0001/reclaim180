import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { connectionOptions } from "./connection";
import * as schema from "./schema";

type DB = MySql2Database<typeof schema>;

let instance: DB | undefined;

/**
 * Connects on first use rather than at import time, so `next build` can
 * load modules that import the database without DATABASE_URL being set.
 */
function getDb(): DB {
  if (instance) return instance;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add your MySQL / TiDB connection string to the environment.");
  }
  const pool = mysql.createPool({
    ...connectionOptions(url),
    connectionLimit: 5,
    waitForConnections: true,
    enableKeepAlive: true,
    timezone: "Z",
  });
  instance = drizzle({ client: pool, schema, mode: "default" });
  return instance;
}

export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
