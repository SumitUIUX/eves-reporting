"use client";

import { useId, useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterPanel } from './filter-panel';
import { ReportEntitySelector } from './report-entity-selector';
import { ReportDatePicker } from './report-date-picker';
import { Choice } from './shared';
import type { ReportDataset, ReportKind } from '@/lib/eves/types';
import type { ReportConfig, ReportFilters } from '@/lib/eves/report-config';
import { changeFilter, dateChanged, datePresets, dateRangeError, dependentOptions, filterCount, periodLabel, presetRange } from '@/lib/eves/performance-filters';
import styles from './report-filter-drawer.module.css';

export function DateRangeFilter({ value, onChange, unavailable }: { value: ReportFilters; onChange: (value: ReportFilters) => void; unavailable?: boolean }) {
  const id = useId();
  const error = !unavailable ? dateRangeError(value) : '';
  return <div className={styles.dateRange}>
    <label htmlFor={`${id}-preset`}>Date Range</label>
    <Choice id={`${id}-preset`} label="Date Range" value={unavailable ? 'unavailable' : value.preset ?? 'custom'} disabled={unavailable}
      options={unavailable ? [{ value: 'unavailable', label: 'Reporting period unavailable' }] : datePresets}
      onChange={preset => onChange({ ...value, preset, ...(preset !== 'custom' ? presetRange(preset) : {}) })} className="w-full" />
    {unavailable ? <p className={styles.help}>This snapshot has no reporting dates. Date filtering requires dated records.</p> : <>
      <p className={styles.help}>{periodLabel(value)}</p>
      {value.preset === 'custom' && <div className={styles.dates}>
        <div><label htmlFor={`${id}-from`}>From</label><ReportDatePicker id={`${id}-from`} label="From date" value={value.from} onChange={from => onChange({ ...value, from })} /></div>
        <div><label htmlFor={`${id}-to`}>To</label><ReportDatePicker id={`${id}-to`} label="To date" value={value.to} onChange={to => onChange({ ...value, to })} /></div>
      </div>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </>}
  </div>;
}

export function ReportFilterDrawer({ kind, config, data, applied, defaults, onApply, open, onOpenChange }: {
  kind: ReportKind; config: ReportConfig; data: ReportDataset; applied: ReportFilters; defaults: ReportFilters;
  onApply: (filters: ReportFilters) => void; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const [draft, setDraft] = useState(applied);
  const id = useId();
  const valid = config.dateColumn === undefined || !dateRangeError(draft);
  const updateOpen = (next: boolean) => { if (next) setDraft(applied); onOpenChange(next); };
  // Mount anew when opened externally (e.g. the empty-state action).
  const fields = config.filters;
  const availableDates = config.dateColumn === undefined ? [] : data.rows.map(row => row[config.dateColumn!]?.slice(0, 10)).filter(Boolean).sort();
  function field(filter: typeof fields[number]) {
    const value = draft.values[filter.column] ?? 'all';
    const entity = ['Site', 'EVSE', 'Port'].includes(filter.label);
    const options = dependentOptions(data, config, filter.column, draft);
    return <div className={styles.field} key={filter.column}>
      <label htmlFor={`${id}-${filter.column}`}>{filter.label}</label>
      {filter.unavailable ? <><Choice id={`${id}-${filter.column}`} label={filter.label} value="unavailable" disabled options={[{ value: 'unavailable', label: 'Unavailable in this data source' }]} onChange={() => {}} className="w-full" /><p className={styles.help}>{filter.unavailable}</p></> : entity ?
        <ReportEntitySelector id={`${id}-${filter.column}`} label={filter.label} options={options} selected={Array.isArray(value) ? value : value === 'all' ? [] : [value]} onChange={selected => setDraft(previous => changeFilter(data, config, previous, filter.column, selected))} /> :
        <Choice id={`${id}-${filter.column}`} label={filter.label} value={Array.isArray(value) ? 'all' : value} onChange={selected => setDraft(previous => changeFilter(data, config, previous, filter.column, selected))}
          options={[{ value: 'all', label: `All ${filter.label.toLowerCase()}` }, ...options.map(option => ({ value: option, label: filter.label.toLowerCase() === 'error status' ? option === 'Yes' ? 'Errored' : 'No errors' : option }))]} className="w-full" />}
    </div>;
  }
  return <FilterPanel title="Report filters" presentation="drawer" open={open} onOpenChange={updateOpen} activeCount={filterCount(applied, defaults)} drawerClassName={styles.drawer}>
    <form className={styles.form} onSubmit={event => { event.preventDefault(); if (!valid) return; onApply(draft); onOpenChange(false); }}>
      <div className={styles.fields}>
        {fields.filter(f => f.label === 'Site').map(field)}
        <DateRangeFilter value={draft} onChange={setDraft} unavailable={config.dateColumn === undefined} />
        {availableDates.length > 0 && <p className={`${styles.help} col-span-full`}>Available records: {availableDates[0]} – {availableDates[availableDates.length - 1]} (UTC).</p>}
        {fields.filter(f => f.label !== 'Site').map(field)}
        {kind === 'energyDemand' && <>
          <div className={styles.field}><label htmlFor={`${id}-time`}>Time of Day</label><Choice id={`${id}-time`} label="Time of Day" value={draft.timeOfDay ?? 'all'} options={[{ value: 'all', label: 'All day' }, 'Morning', 'Afternoon', 'Evening', 'Night']} onChange={timeOfDay => setDraft(v => ({ ...v, timeOfDay }))} className="w-full" /><p className={styles.help}>UTC · Morning 06–12, afternoon 12–18, evening 18–22, night 22–06.</p></div>
          <div className={styles.field}><label htmlFor={`${id}-day`}>Day of Week</label><Choice id={`${id}-day`} label="Day of Week" value={draft.dayOfWeek ?? 'all'} options={[{ value: 'all', label: 'All' }, ...['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((label, i) => ({ value: String((i + 1) % 7), label }))]} onChange={dayOfWeek => setDraft(v => ({ ...v, dayOfWeek }))} className="w-full" /></div>
        </>}
      </div>
      <div className={styles.footer}>
        <Button variant="ghost" type="button" onClick={() => { setDraft(defaults); onApply(defaults); }}><RotateCcw size={14} />Reset filters</Button>
        <Button type="submit" disabled={!valid}>Apply filters</Button>
      </div>
    </form>
  </FilterPanel>;
}

export function ActiveFilterChips({ applied, defaults, config, onChange }: { applied: ReportFilters; defaults: ReportFilters; config: ReportConfig; onChange: (value: ReportFilters) => void }) {
  const chips: { key: string; label: string; remove: () => void }[] = [];
  for (const field of config.filters) {
    const value = applied.values[field.column];
    if (!value || value === 'all' || field.unavailable) continue;
    for (const v of Array.isArray(value) ? value : [value]) chips.push({ key: `${field.column}-${v}`, label: `${field.label}: ${field.label.toLowerCase() === 'error status' ? v === 'Yes' ? 'Errored' : 'No errors' : v}`, remove: () => onChange({ ...applied, values: { ...applied.values, [field.column]: Array.isArray(value) ? value.filter(x => x !== v) : 'all' } }) });
  }
  if (dateChanged(applied, defaults)) chips.push({ key: 'date', label: `${datePresets.find(p => p.value === applied.preset)?.label ?? 'Date Range'} · ${periodLabel(applied)}`, remove: () => onChange({ ...applied, from: defaults.from, to: defaults.to, preset: defaults.preset }) });
  for (const key of ['timeOfDay', 'dayOfWeek'] as const) if (applied[key] && applied[key] !== 'all') chips.push({ key, label: key === 'dayOfWeek' ? ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][Number(applied[key])] : applied[key]!, remove: () => onChange({ ...applied, [key]: 'all' }) });
  if (!chips.length) return null;
  return <div className={styles.chips} aria-label="Active filters">{chips.map(chip => <Button variant="outline" size="sm" key={chip.key} onClick={chip.remove} aria-label={`Remove ${chip.label}`}>{chip.label}<X size={12} /></Button>)}<Button variant="ghost" size="sm" onClick={() => onChange(defaults)}>Clear all</Button></div>;
}
