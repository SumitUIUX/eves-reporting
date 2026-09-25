import { Skeleton } from '@/components/ui/skeleton';
export function PerformanceLoading() {
  return <div role="status" aria-label="Loading report" className="space-y-6">
    <div className="flex justify-between gap-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-10 w-48" /></div>
    <div className="metrics">{[0,1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
    <Skeleton className="h-64 w-full rounded-lg" />
    <div className="panel p-5 space-y-4"><Skeleton className="h-10 w-56" />{[0,1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
  </div>;
}
