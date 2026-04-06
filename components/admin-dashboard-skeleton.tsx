import { Skeleton } from "@/components/ui/skeleton";

export function DashboardKpiSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl p-5 space-y-3"
        >
          <div className="flex items-start justify-between mb-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-5" />
          </div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  );
}

export function DashboardTableSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="divide-y divide-border">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-5 py-4 flex gap-4">
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-4 w-32 shrink-0" />
            <Skeleton className="h-4 w-24 shrink-0" />
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-4 w-24 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductStatsCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <Skeleton className="h-4 w-40 mb-6" />
      <div className="space-y-4 h-64 flex items-center justify-center">
        <Skeleton className="w-full h-32" />
      </div>
    </div>
  );
}

export function ProductTableSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="overflow-x-auto">
        <div className="space-y-0 divide-y divide-border">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-4">
              <Skeleton className="h-4 w-24 shrink-0" />
              <Skeleton className="h-4 w-32 shrink-0" />
              <Skeleton className="h-4 w-20 shrink-0" />
              <Skeleton className="h-4 w-28 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
