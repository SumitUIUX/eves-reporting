/** Portable D1 query adapter. Sites uses its binding; Vercel uses D1's HTTPS API. */
export interface Statement {
  sql: string;
  params: unknown[];
}
interface D1Binding {
  prepare: (sql: string) => { bind: (...values: unknown[]) => unknown };
  batch: (
    statements: unknown[],
  ) => Promise<
    { results: Record<string, unknown>[]; meta: { changes: number } }[]
  >;
}
export async function batch(statements: Statement[]) {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID,
    database = process.env.CLOUDFLARE_D1_DATABASE_ID,
    token = process.env.CLOUDFLARE_D1_API_TOKEN;
  if (account && database && token) {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(statements),
        cache: "no-store",
      },
    );
    if (!res.ok) throw new Error("Database request failed");
    const payload = await res.json();
    if (!payload.success) throw new Error("Database query failed");
    return payload.result as {
      results: Record<string, unknown>[];
      meta: { changes: number };
    }[];
  }
  // The variable module name prevents Next's Vercel bundle from resolving a Cloudflare-only virtual module.
  const moduleName = "cloudflare:workers";
  const { env } = (await import(
    /* @vite-ignore */ /* webpackIgnore: true */ moduleName
  )) as {
    env: { DB?: D1Binding };
  };
  if (!env.DB) throw new Error("Database unavailable");
  return env.DB.batch(
    statements.map((s) => env.DB!.prepare(s.sql).bind(...s.params)),
  );
}
export async function query(sql: string, params: unknown[] = []) {
  return (await batch([{ sql, params }]))[0];
}
