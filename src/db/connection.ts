/**
 * Turns DATABASE_URL (mysql://user:pass@host:port/db) into mysql2 options.
 * TLS is on for every host except localhost, which TiDB Cloud requires.
 */
export function connectionOptions(url: string) {
  const u = new URL(url);
  const local = ["localhost", "127.0.0.1", "::1"].includes(u.hostname);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, "") || undefined,
    ssl: local ? undefined : { minVersion: "TLSv1.2", rejectUnauthorized: true },
  };
}
