import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const root = fileURLToPath(new URL('..', import.meta.url));
const vite = await createServer({ configFile: false, appType: 'custom', root, resolve: { alias: { '@': root } }, server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
const { unmappedFundingSites } = await vite.ssrLoadModule('/lib/eves/funding-coverage.ts');
const tag = { type: 'Funding Agency', awardId: 'AWARD-1', name: 'Project A', mappings: { 'SITE-1': [] } };
const sheet = { headers: ['Site Name','Site ID','Project Tag'], rows: [['One','SITE-1',''],['Two','SITE-2','Project A'],['Three','SITE-3',''],['Three','SITE-3','']] };
test('funding warning lists actual distinct sites, respecting IDs and snapshot tag associations', () => {
  assert.deepEqual(unmappedFundingSites([sheet, sheet], [tag]), [{ id: 'SITE-3', name: 'Three', mapped: false }]);
});
test('a tag without a funding ID cannot satisfy funding coverage', () => {
  assert.equal(unmappedFundingSites([sheet], [{ ...tag, awardId: '' }]).length, 3);
});
test('empty or unsupported data never invents affected sites', () => {
  assert.deepEqual(unmappedFundingSites([], [tag]), []);
  assert.deepEqual(unmappedFundingSites([{ headers: ['Other'], rows: [['x']] }], [tag]), []);
});

test('real session snapshot values serialize into Excel and CSV exports', async () => {
  const { default: snapshots } = await vite.ssrLoadModule('/data/reference-reports.json');
  const { createWorkbook } = await vite.ssrLoadModule('/lib/eves/xlsx.ts');
  const { csvText } = await vite.ssrLoadModule('/lib/eves/export.ts');
  const bytes = createWorkbook([{ name: 'Sessions', data: snapshots.sessions }]);
  assert.ok(bytes.length > 100);
  assert.equal(bytes[0], 0x50);
  assert.match(csvText(snapshots.sessions), /"false"/);
});
