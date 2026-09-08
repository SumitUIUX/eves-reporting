import assert from "node:assert/strict";
import test from "node:test";

test("renders all EVES routes with product metadata and the shared navigation", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  for (const [route, title] of [
    ["/", "Uptime &amp; reliability"],
    ["/reports/project-tags", "Project tagging"],
    ["/reports/regulatory", "Generate reports"],
    ["/reports/charging-sessions", "Charging sessions"],
    ["/reports/interval-load-profile", "Interval load profile"],
    ["/reports/throughput", "Infrastructure &amp; throughput"],
  ]) {
    const response = await worker.fetch(
      new Request(`http://localhost${route}`, {
        headers: { accept: "text/html" },
      }),
      {
        ASSETS: {
          fetch: async () => new Response("Not found", { status: 404 }),
        },
      },
      {
        waitUntil() {},
        passThroughOnException() {},
      },
    );

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    const html = await response.text();
    assert.ok(
      html.includes(`<title>${title} · EVES</title>`),
      `Expected product title for ${route}`,
    );
    assert.ok(
      html.includes('id="main-content"'),
      `Expected main landmark for ${route}`,
    );
    assert.ok(
      html.includes('href="/reports/project-tags"'),
      `Expected shared navigation for ${route}`,
    );
    assert.ok(
      !html.includes('name="codex-preview"'),
      "Starter preview metadata must not ship",
    );
  }
});
