import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ configFile: false, appType: 'custom', root, resolve: { alias: { '@': root } }, server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
test('real session snapshot values serialize into Excel and CSV exports', async () => {
  const { default: snapshots } = await vite.ssrLoadModule('/data/reference-reports.json');
  const { createWorkbook } = await vite.ssrLoadModule('/lib/eves/xlsx.ts');
  const { csvText } = await vite.ssrLoadModule('/lib/eves/export.ts');
  const bytes = createWorkbook([{ name: 'Sessions', data: snapshots.sessions }]);
  assert.ok(bytes.length > 100);
  assert.equal(bytes[0], 0x50);
  assert.match(csvText(snapshots.sessions), /"false"/);
});


test('empty exports preserve column headers in CSV and Excel', async () => {
  const { createWorkbook } = await vite.ssrLoadModule('/lib/eves/xlsx.ts');
  const { csvText } = await vite.ssrLoadModule('/lib/eves/export.ts');
  const data = { headers: ['Site ID', 'Energy (kWh)'], rows: [] };
  assert.match(csvText(data), /Site ID/);
  assert.match(csvText(data), /Energy \(kWh\)/);
  const bytes = createWorkbook([{ name: 'Empty report', data }]);
  assert.equal(bytes[0], 0x50);
  assert.ok(bytes.length > 100);
});
