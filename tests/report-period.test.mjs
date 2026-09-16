import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const vite = await createServer({
  configFile: false,
  appType: "custom",
  root: fileURLToPath(new URL("..", import.meta.url)),
  cacheDir: "node_modules/.vite-tests-period",
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());
const { getReportRanges, evaluateReportDelivery } = await vite.ssrLoadModule(
  "/lib/eves/report-period.ts",
);
const custom = (from, to) =>
  evaluateReportDelivery([{ from, to }], "Custom range");

test("downloads are limited to one calendar month and 31 inclusive days", () => {
  assert.deepEqual(custom("2026-01-01", "2026-01-31"), {
    valid: true,
    days: 31,
    spanDays: 31,
    delivery: "download",
  });
  assert.equal(custom("2026-09-16", "2026-09-16").days, 1);
  assert.equal(custom("2026-09-01", "2026-09-16").days, 16);
  assert.equal(custom("2026-01-31", "2026-02-01").delivery, "email");
  assert.equal(custom("2026-12-31", "2027-01-01").delivery, "email");
});

test("calendar quarters and multiple months require email, using actual day counts", () => {
  const q3 = getReportRanges({
    period: "Quarter",
    quarters: ["2026-Q3"],
    months: [],
    from: "",
    to: "",
  });
  assert.deepEqual(q3, [{ from: "2026-07-01", to: "2026-09-30" }]);
  assert.deepEqual(evaluateReportDelivery(q3, "Quarter"), {
    valid: true,
    days: 92,
    spanDays: 92,
    delivery: "email",
  });
  const months = getReportRanges({
    period: "Months",
    quarters: [],
    months: ["2026-09", "2026-08"],
    from: "",
    to: "",
  });
  assert.equal(evaluateReportDelivery(months, "Months").days, 61);
  assert.equal(evaluateReportDelivery(months, "Months").delivery, "email");
});

test("93-day inclusive limit also prevents disjoint selections from bypassing the cap", () => {
  assert.deepEqual(custom("2026-07-01", "2026-10-01"), {
    valid: true,
    days: 93,
    spanDays: 93,
    delivery: "email",
  });
  assert.equal(custom("2026-07-01", "2026-10-02").valid, false);
  const disjoint = evaluateReportDelivery(
    [
      { from: "2026-01-01", to: "2026-01-02" },
      { from: "2026-09-01", to: "2026-09-02" },
    ],
    "Months",
  );
  assert.equal(disjoint.valid, false);
  const quarters = getReportRanges({
    period: "Quarter",
    quarters: ["2026-Q2", "2026-Q3"],
    months: [],
    from: "",
    to: "",
  });
  assert.equal(evaluateReportDelivery(quarters, "Quarter").valid, false);
});

test("dates reject empty, reversed and impossible ranges and account for leap years", () => {
  for (const [from, to] of [
    ["", "2026-09-01"],
    ["2026-09-07", "2026-09-01"],
    ["2026-02-29", "2026-03-01"],
    ["2026-01-01", "2026-04-31"],
  ])
    assert.equal(custom(from, to).valid, false);
  assert.equal(evaluateReportDelivery([], "Months").valid, false);
  assert.equal(custom("2024-02-01", "2024-02-29").days, 29);
  assert.equal(custom("2026-02-01", "2026-02-28").days, 28);
  assert.equal(custom("2026-03-01", "2026-03-31").days, 31);
});

test("overlaps count once without mutating the selected ranges", () => {
  const ranges = [
    { from: "2026-09-04", to: "2026-09-10" },
    { from: "2026-09-01", to: "2026-09-07" },
  ];
  const before = JSON.stringify(ranges);
  assert.deepEqual(evaluateReportDelivery(ranges, "Custom range"), {
    valid: true,
    days: 10,
    spanDays: 10,
    delivery: "download",
  });
  assert.equal(JSON.stringify(ranges), before);
});
