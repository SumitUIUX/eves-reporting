export const connectorTypes = [
  { value: 'J1772', label: 'J1772 (Type 1)' },
  { value: 'Type 2', label: 'Mennekes (Type 2)' },
  { value: 'CHAdeMO', label: 'CHAdeMO' },
  { value: 'CCS1', label: 'CCS Combo (Type 1)' },
  { value: 'CCS2', label: 'CCS Combo (Type 2)' },
  { value: 'GB/T', label: 'GB/T' },
  { value: 'NACS', label: 'NACS' },
];
export function normalizeConnector(value: string) {
  const key = value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const aliases: Record<string,string> = {
    j1772:'J1772', type1:'J1772', j1772type1:'J1772', saej1772:'J1772',
    type2:'Type 2', mennekes:'Type 2', mennekestype2:'Type 2',
    ccs1:'CCS1', ccscombo1:'CCS1', ccscombotype1:'CCS1',
    ccs2:'CCS2', ccscombo2:'CCS2', ccscombotype2:'CCS2',
    chademo:'CHAdeMO', gbt:'GB/T', nacs:'NACS', j3400:'NACS',
  };
  return aliases[key] ?? value;
}
