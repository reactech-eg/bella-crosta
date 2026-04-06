import { Header } from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";

export function OrdersSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="mb-10">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-80" />
        </div>

        {/* Controls Section */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Sort Controls */}
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>

          {/* Filter Controls */}
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6">
          <Skeleton className="h-4 w-40" />
        </div>

        {/* Orders List Skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-6 space-y-4"
            >
              {/* Order Header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  {/* Status Icon */}
                  <Skeleton className="h-12 w-12 rounded-xl shrink-0" />

                  {/* Order Info */}
                  <div className="flex-1">
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>

                {/* Right Side */}
                <div className="hidden sm:block">
                  <Skeleton className="h-5 w-16 mb-2" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>

              {/* Mobile View */}
              <div className="sm:hidden flex justify-between items-center pt-3 border-t border-border/50">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
