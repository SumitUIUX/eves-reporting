import type { ProjectTag, ReportDataset } from './types';
/** Assess site-level association only; snapshots do not provide device identities. */
export function unmappedFundingSites(sheets: ReportDataset[], tags: ProjectTag[]) {
  const sites = new Map<string, { id: string; name: string; mapped: boolean }>();
  const eligible = tags.filter(tag => tag.type === 'Funding Agency' && tag.awardId.trim());
  for (const sheet of sheets) {
    const normalized = sheet.headers.map(h => h.toLowerCase().replace(/[^a-z]/g, ''));
    const nameIndex = normalized.indexOf('sitename'), idIndex = normalized.indexOf('siteid');
    const tagIndex = normalized.findIndex(h => h === 'projecttag' || h === 'projecttags' || h === 'fundingtag' || h === 'tag');
    if (nameIndex < 0) continue;
    for (const row of sheet.rows) {
      const name = row[nameIndex], id = idIndex >= 0 ? row[idIndex] : name;
      const mapped = eligible.some(tag => Object.hasOwn(tag.mappings, name) || Object.hasOwn(tag.mappings, id) || (tagIndex >= 0 && tag.name === row[tagIndex]));
      sites.set(id, { id, name, mapped: mapped || !!sites.get(id)?.mapped });
    }
  }
  return [...sites.values()].filter(site => !site.mapped).sort((a,b) => a.name.localeCompare(b.name));
}
