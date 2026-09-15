import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const vite = await createServer({
  configFile: false,
  appType: "custom",
  root: fileURLToPath(new URL("..", import.meta.url)),
  cacheDir: "node_modules/.vite-tests-tags",
  server: { middlewareMode: true, hmr: false },
});
after(() => vite.close());

const { createSampleTagStore, sampleTags, SAMPLE_TAGS_KEY } =
  await vite.ssrLoadModule("/lib/eves/sample-tags.ts");
const { emptyTagFilters, filterTags } = await vite.ssrLoadModule(
  "/lib/eves/tag-filters.ts",
);

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("sample CRUD persists across reloads and deleting every tag does not reseed", () => {
  const storage = memoryStorage();
  const first = createSampleTagStore(storage);
  const existing = first.read();
  assert.equal(existing.length, 12);
  const created = first.save({ ...existing[0], name: "A new sample project" });
  const reloaded = createSampleTagStore(storage);
  assert.equal(reloaded.read().length, 13);
  const updated = reloaded.save(
    { ...created, name: "Edited sample", mappings: {} },
    created,
  );
  assert.equal(updated.version, 2);
  assert.equal(
    createSampleTagStore(storage)
      .read()
      .find((t) => t.id === updated.id).name,
    "Edited sample",
  );
  for (const tag of reloaded.read()) reloaded.remove(tag);
  assert.deepEqual(createSampleTagStore(storage).read(), []);
  assert.equal(sampleTags.length, 12);
});

test("stale edits and invalid mappings cannot overwrite saved samples", () => {
  const storage = memoryStorage();
  const store = createSampleTagStore(storage);
  const original = store.read()[0];
  store.save({ ...original, name: "Updated in another tab" }, original);
  const saved = storage.getItem(SAMPLE_TAGS_KEY);
  assert.throws(
    () => store.save({ ...original, name: "Stale edit" }, original),
    /changed/,
  );
  assert.throws(() => store.remove(original), /changed/);
  assert.throws(
    () => store.save({ ...original, mappings: { "Unknown site": ["1"] } }),
    /valid sites/,
  );
  assert.throws(
    () =>
      store.save({
        ...original,
        mappings: { "Downtown Transit Hub": ["1", "1"] },
      }),
    /valid sites/,
  );
  assert.equal(storage.getItem(SAMPLE_TAGS_KEY), saved);
});

test("storage failures do not pretend to save or replace corrupt data", () => {
  const store = createSampleTagStore({
    getItem: () => null,
    setItem: () => {
      throw new Error("Storage full");
    },
  });
  assert.throws(() => store.save(sampleTags[0]), /Storage full/);
  const storage = memoryStorage();
  storage.setItem(SAMPLE_TAGS_KEY, "invalid json");
  assert.throws(() => createSampleTagStore(storage).read());
  assert.equal(storage.getItem(SAMPLE_TAGS_KEY), "invalid json");
});

test("search, type, agency, and mapping filters compose without changing records", () => {
  const before = JSON.stringify(sampleTags);
  const result = filterTags(sampleTags, {
    ...emptyTagFilters,
    type: "Funding Agency",
    agency: "CEC",
    mapping: "unmapped",
    search: " SAMPLE-CEC-505 ",
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, "Community access pilot");
  assert.equal(
    filterTags(sampleTags, { ...emptyTagFilters, type: "Zone" }).length,
    4,
  );
  assert.equal(
    filterTags(sampleTags, { ...emptyTagFilters, mapping: "unmapped" }).length,
    3,
  );
  assert.equal(
    filterTags(sampleTags, { ...emptyTagFilters, search: "no such tag" })
      .length,
    0,
  );
  assert.equal(JSON.stringify(sampleTags), before);
});
