/** Portable D1 query adapter. Sites uses its binding; Vercel uses D1's HTTPS API. */
export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("No workspace database is configured.");
    this.name = "DatabaseNotConfiguredError";
  }
}
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
        body: JSON.stringify({ batch: statements }),
        cache: "no-store",
      },
    );
    if (!res.ok) throw new Error("Database request failed");
    const payload = await res.json();
    if (
      !payload.success ||
      !Array.isArray(payload.result) ||
      payload.result.length !== statements.length ||
      payload.result.some(
        (result: { success?: boolean }) => result.success === false,
      )
    )
      throw new Error("Database query failed");
    return payload.result as {
      results: Record<string, unknown>[];
      meta: { changes: number };
    }[];
  }
  // A partial configuration is a real error, not an invitation to use a snapshot.
  if (account || database || token)
    throw new Error("Workspace database configuration is incomplete.");
  if (process.env.VERCEL === "1") throw new DatabaseNotConfiguredError();
  // The variable module name prevents Next's Vercel bundle from resolving a Cloudflare-only virtual module.
  const moduleName = "cloudflare:workers";
  let env: { DB?: D1Binding };
  try {
    ({ env } = (await import(
      /* @vite-ignore */ /* webpackIgnore: true */ moduleName
    )) as { env: { DB?: D1Binding } });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ERR_UNSUPPORTED_ESM_URL_SCHEME"
    )
      throw new DatabaseNotConfiguredError();
    throw error;
  }
  if (!env.DB) throw new DatabaseNotConfiguredError();
  return env.DB.batch(
    statements.map((s) => env.DB!.prepare(s.sql).bind(...s.params)),
  );
}
export async function query(sql: string, params: unknown[] = []) {
  return (await batch([{ sql, params }]))[0];
}
