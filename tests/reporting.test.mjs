import assert from "node:assert/strict";
import test, { after } from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  configFile: false,
  appType: "custom",
  root,
  cacheDir: "node_modules/.vite-tests-reporting",
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());
const {
  filterRows,
  emptyFilters,
  reportConfig,
  metricsFor,
  isoDate,
  timestampKey,
  displayDuration,
} = await vite.ssrLoadModule("/lib/eves/report-config.ts");
const { csvCell, csvText } = await vite.ssrLoadModule("/lib/eves/export.ts");
const data = JSON.parse(
  await readFile(
    new URL("../data/reference-reports.json", import.meta.url),
    "utf8",
  ),
);

test("all reference records preserve their complete report schema", () => {
  const counts = {
    sessions: 25,
    intervals: 42,
    throughput: 48,
    uptime: 48,
    events: 21,
  };
  for (const [kind, count] of Object.entries(counts)) {
    assert.equal(data[kind].rows.length, count);
    assert.ok(
      data[kind].rows.every((row) => row.length === data[kind].headers.length),
    );
  }
});

test("date, site and error filters compose without modifying the reference rows", () => {
  const before = JSON.stringify(data.sessions);
  const result = filterRows(data.sessions, reportConfig.sessions, {
    ...emptyFilters,
    values: { 1: "Downtown Transit Hub" },
    from: "2026-09-07",
    to: "2026-09-07",
    errors: true,
  });
  assert.deepEqual(
    result.map((row) => row[0]),
    ["SES-10000"],
  );
  assert.equal(JSON.stringify(data.sessions), before);
  assert.equal(
    filterRows(
      data.sessions,
      reportConfig.sessions,
      emptyFilters,
      "no-such-session",
    ).length,
    0,
  );
});

test("timestamp sorting retains time and the reference year", () => {
  assert.equal(isoDate("07/09/2026 02:08:30", "dmy"), "2026-09-07");
  assert.equal(timestampKey("Sep 07, 14:30", "month"), "2026-09-07T14:30:00");
  assert.ok(
    timestampKey("06/09/2026 20:08:30", "dmy") >
      timestampKey("06/09/2026 08:08:30", "dmy"),
  );
  assert.equal(isoDate("unavailable", "month"), "");
  assert.equal(displayDuration(59.8), "1h 0m");
});

test("metrics reflect actual filtered session totals and handle empty selections", () => {
  assert.equal(
    metricsFor("sessions", data.sessions.rows)[1].value,
    "561.41 kWh",
  );
  const errors = filterRows(data.sessions, reportConfig.sessions, {
    ...emptyFilters,
    errors: true,
  });
  assert.equal(errors.length, 4);
  assert.equal(metricsFor("sessions", errors)[1].value, "75.21 kWh");
  for (const kind of Object.keys(reportConfig)) {
    assert.doesNotMatch(JSON.stringify(metricsFor(kind, [])), /NaN|Infinity/);
  }
});

test("CSV preserves delimiters and line breaks while neutralizing formulas", () => {
  assert.equal(csvCell('North, "A"'), '"North, ""A"""');
  assert.equal(csvCell("line one\nline two"), '"line one\nline two"');
  for (const value of ["=1+1", " +SUM(A1)", "-1+1", "@SUM(A1)", "\t=1"]) {
    assert.ok(csvCell(value).startsWith("\"'"));
  }
  assert.equal(csvCell("-2.5"), '"-2.5"');
  assert.ok(csvText({ headers: ["Name"], rows: [["A"]] }).startsWith("\uFEFF"));
});
