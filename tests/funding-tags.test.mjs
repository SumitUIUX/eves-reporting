import assert from "node:assert/strict";
import test, { after, afterEach, beforeEach } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  configFile: false,
  appType: "custom",
  root,
  resolve: { alias: { "@": root } },
  cacheDir: "node_modules/.vite-tests-funding",
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());
const { batch, query, DatabaseNotConfiguredError } = await vite.ssrLoadModule("/lib/eves/database.ts");
const { GET } = await vite.ssrLoadModule("/app/api/tags/route.ts");
const { resolveFundingTags } = await vite.ssrLoadModule("/lib/eves/funding-tags.ts");
const { referenceTags } = await vite.ssrLoadModule("/lib/eves/seed.ts");
const originalFetch = globalThis.fetch;
const keys = ["VERCEL", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_D1_DATABASE_ID", "CLOUDFLARE_D1_API_TOKEN"];
const originalEnv = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
beforeEach(() => {
  keys.forEach((key) => delete process.env[key]);
  process.env.VERCEL = "1";
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of keys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});
function configured() {
  process.env.CLOUDFLARE_ACCOUNT_ID = "test-account";
  process.env.CLOUDFLARE_D1_DATABASE_ID = "test-database";
  process.env.CLOUDFLARE_D1_API_TOKEN = "test-token";
}

test("unconfigured storage supplies original funding IDs without fictional samples", async () => {
  globalThis.fetch = async () => { throw new Error("Unexpected network request"); };
  await assert.rejects(() => query("SELECT 1"), DatabaseNotConfiguredError);
  const response = await GET();
  const payload = await response.json();
  assert.equal(response.status, 503);
  assert.equal(payload.code, "TAG_STORAGE_NOT_CONFIGURED");
  const result = resolveFundingTags({ tags: [], error: payload.error, errorCode: payload.code });
  assert.equal(result.error, "");
  assert.deepEqual(result.tags.map((tag) => tag.awardId), ["CEC-FND-110", "CIC-FND-204"]);
  assert.ok(result.tags.every((tag) => !tag.id.startsWith("sample")));
  assert.equal(result.tags.find((tag) => tag.agency === "CEC").mappings["Downtown Transit Hub"].length, 4);
});

test("connected empty workspaces and service failures are never replaced by reference tags", () => {
  assert.deepEqual(resolveFundingTags({ tags: [], error: "", errorCode: "" }), { tags: [], error: "" });
  const failed = resolveFundingTags({ tags: [], error: "Connection failed", errorCode: "" });
  assert.equal(failed.error, "Connection failed");
  assert.deepEqual(failed.tags, []);
  const custom = { ...referenceTags[0], id: "workspace-custom", awardId: "CEC-AWARD-NEW" };
  const result = resolveFundingTags({ tags: [custom, referenceTags[2]], error: "", errorCode: "" });
  assert.deepEqual(result.tags.map((tag) => tag.awardId), ["CEC-AWARD-NEW"]);
});

test("D1 HTTPS requests use the batch envelope and preserve bound values and results", async () => {
  configured();
  const statements = [
    { sql: "SELECT ? AS award", params: ["CEC-FND-110"] },
    { sql: "UPDATE project_tags SET version=? WHERE id=?", params: [2, "tag-1"] },
  ];
  globalThis.fetch = async (url, options) => {
    assert.match(url, /\/d1\/database\/test-database\/query$/);
    assert.deepEqual(JSON.parse(options.body), { batch: statements });
    assert.equal(options.cache, "no-store");
    return Response.json({ success: true, result: [
      { success: true, results: [{ award: "CEC-FND-110" }], meta: { changes: 0 } },
      { success: true, results: [], meta: { changes: 1 } },
    ] });
  };
  const result = await batch(statements);
  assert.equal(result[0].results[0].award, "CEC-FND-110");
  assert.equal(result[1].meta.changes, 1);
});

test("partial configuration, denied requests and failed statements remain real errors", async () => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "test-account";
  await assert.rejects(() => query("SELECT 1"), (error) => !(error instanceof DatabaseNotConfiguredError));
  configured();
  globalThis.fetch = async () => Response.json({ success: false }, { status: 403 });
  await assert.rejects(() => query("SELECT 1"), /Database request failed/);
  globalThis.fetch = async () => Response.json({ success: true, result: [{ success: false }] });
  await assert.rejects(() => query("SELECT 1"), /Database query failed/);
});

test("configured tag GET initializes then returns saved records using the HTTPS contract", async () => {
  configured();
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.ok(Array.isArray(body.batch));
    calls += 1;
    return Response.json({ success: true, result: body.batch.map(() => ({
      success: true,
      results: calls === 1 ? [] : [{ data: JSON.stringify(referenceTags[0]), version: 3 }],
      meta: { changes: calls === 1 ? 1 : 0 },
    })) });
  };
  const response = await GET();
  assert.equal(response.status, 200);
  const tags = await response.json();
  assert.equal(tags.length, 1);
  assert.equal(tags[0].version, 3);
  assert.equal(tags[0].awardId, "CEC-FND-110");
  assert.equal(calls, 2);
});
