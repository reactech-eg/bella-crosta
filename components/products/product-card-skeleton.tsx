export default function ProductCardSkeleton() {
  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden animate-pulse">
      {/* Image Area Skeleton */}
      <div className="relative aspect-4/3 bg-muted" />

      {/* Content Area Skeleton */}
      <div className="p-5 space-y-4">
        <div>
          <div className="h-6 bg-muted rounded-md w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded-md w-full mb-1" />
          <div className="h-4 bg-muted rounded-md w-5/6" />
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          {/* Qty Toggle Skeleton */}
          <div className="h-10 w-24 bg-muted rounded-xl" />
          {/* Button Skeleton */}
          <div className="h-10 flex-1 bg-muted rounded-xl" />
        </div>
      </div>
    </div>
  );
}
