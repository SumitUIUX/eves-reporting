"use client";
import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
export function FundingMappingAlert({ sites, agency, canManage }: { sites: { id: string; name: string }[]; agency: string; canManage: boolean }) {
  const [open, setOpen] = useState(false);
  if (!sites.length) return null;
  return <>
    <section className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5" aria-label="Funding mapping incomplete">
      <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" /><div><h2 className="font-semibold">Funding mapping incomplete</h2><p className="mt-1 text-sm text-muted-foreground">{sites.length} {sites.length === 1 ? 'site has' : 'sites have'} no funding ID association for {agency} in the selected reports and period. Review the affected sites before exporting a funding-scoped report.</p><ul className="mt-3 space-y-1 text-sm">{sites.slice(0,3).map(site => <li key={site.id}>{site.id} · {site.name}</li>)}</ul>{sites.length > 3 && <p className="mt-1 text-xs text-muted-foreground">+{sites.length-3} more sites</p>}<div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" onClick={() => setOpen(true)}>View sites ({sites.length})</Button>{canManage ? <Button asChild><Link href="/reports/project-tags">Manage project tags</Link></Button> : <p className="text-sm text-muted-foreground">Ask your administrator to update project tag mappings.</p>}</div></div></div>
    </section>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Affected sites</DialogTitle><DialogDescription>Associate these sites with a {agency} funding tag, then return to generate the report.</DialogDescription></DialogHeader><ul className="divide-y">{sites.map(site => <li key={site.id} className="py-3"><p className="text-sm font-medium">{site.name}</p><p className="text-xs text-muted-foreground">{site.id}</p></li>)}</ul>{canManage && <Button asChild><Link href="/reports/project-tags">Manage project tags</Link></Button>}</DialogContent></Dialog>
  </>;
}
