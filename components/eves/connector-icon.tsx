import { PlugZap } from 'lucide-react';

// Compact connector-face illustrations following the supplied reference.
export function ConnectorIcon({ type }: { type: string }) {
  const combo = type === 'CCS1' || type === 'CCS2';
  const type2 = type === 'Type 2' || type === 'CCS2';
  const pins = type2 ? [[11,10],[21,10],[8,17],[16,17],[24,17],[12,24],[20,24]]
    : type === 'GB/T' ? [[10,10],[16,9],[22,10],[8,18],[24,18],[11,25],[21,25]]
    : type === 'NACS' ? [[9,14],[23,14],[16,25],[9,25],[23,25]]
    : type === 'CHAdeMO' ? [[16,10],[8,19],[24,19],[16,26]]
    : [[10,12],[22,12],[8,21],[24,21],[16,26]];
  if (type === 'all') return <PlugZap className="size-7 shrink-0 text-primary" aria-hidden="true" />;
  return <svg viewBox={combo ? '0 0 32 46' : '0 0 32 36'} className="size-7 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    {type2 ? <path d="M8 4h16c5 5 7 10 7 15a15 15 0 0 1-30 0C1 14 3 9 8 4Z" /> : type === 'NACS' ? <path d="M3 6Q16 1 29 6Q33 16 27 27Q16 36 5 27Q-1 16 3 6Z" /> : <circle cx="16" cy="18" r="15" />}
    {pins.map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r={type === 'NACS' && i<2 ? 5 : type === 'CHAdeMO' && (i===0 || i===3) ? 3.8 : 2.6} />)}
    {combo && <><rect x="5" y="35" width="22" height="10" rx="5" /><circle cx="11" cy="40" r="2.7" /><circle cx="21" cy="40" r="2.7" /></>}
  </svg>;
}
