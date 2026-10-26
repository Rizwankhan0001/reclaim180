/**
 * Turns DATABASE_URL into mysql2 connection settings.
 *
 * Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
 *
 * SSL is on for every host except localhost, because cloud MySQL providers
 * (TiDB Cloud, PlanetScale, Aiven, AWS RDS...) require it.
 * Set DATABASE_SSL="false" to turn it off, e.g. for a server on a private network.
 */
export type MySqlSettings = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: { minVersion: "TLSv1.2"; rejectUnauthorized: boolean };
};

export function mysqlSettings(url = process.env.DATABASE_URL): MySqlSettings {
  if (!url) {
    throw new Error("DATABASE_URL is not set. Add your MySQL connection string to .env.local.");
  }
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new Error("DATABASE_URL isn't a valid URL. Expected mysql://USER:PASSWORD@HOST:PORT/DATABASE");
  }
  if (u.protocol !== "mysql:") {
    throw new Error(`DATABASE_URL must start with mysql:// (got ${u.protocol}//).`);
  }
  const database = decodeURIComponent(u.pathname.replace(/^\//, ""));
  if (!database) throw new Error("DATABASE_URL is missing the database name at the end, e.g. .../reclaim180");

  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(u.hostname);
  const sslFlag = process.env.DATABASE_SSL?.toLowerCase();
  const useSsl = sslFlag ? sslFlag !== "false" : !isLocal;

  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database,
    ...(useSsl ? { ssl: { minVersion: "TLSv1.2" as const, rejectUnauthorized: true } } : {}),
  };
}
