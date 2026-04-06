import { Header } from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";

export function OrderSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Header card */}
        <div className="bg-card border border-border rounded-xl p-6 mb-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full ml-4" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <Skeleton className="h-3 w-12 mb-2" />
              <Skeleton className="h-7 w-24" />
            </div>
            <div>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </div>

        {/* Payment status banner */}
        <div className="flex items-start gap-3 p-4 bg-muted rounded-xl mb-5">
          <Skeleton className="h-5 w-5 rounded-full shrink-0 mt-0.5" />
          <div className="flex-1">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>

        {/* Order status timeline */}
        <div className="bg-card border border-border rounded-xl p-5 mb-5">
          <Skeleton className="h-5 w-32 mb-5" />
          <div className="flex items-center gap-0">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="flex items-center flex-1 last:flex-none"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-3 w-12" />
                </div>
                {idx < 3 && <div className="h-0.5 flex-1 mx-1 bg-border" />}
              </div>
            ))}
          </div>
        </div>

        {/* Order items */}
        <div className="bg-card border border-border rounded-xl p-5 mb-5">
          <Skeleton className="h-5 w-24 mb-4" />
          <div className="space-y-3">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="flex justify-between items-start pb-3 border-b border-border last:pb-0 last:border-0"
              >
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
            <div className="flex justify-between items-center pt-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </div>

        {/* Delivery info */}
        <div className="bg-card border border-border rounded-xl p-5 mb-8">
          <Skeleton className="h-5 w-40 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Skeleton className="flex-1 h-11 rounded-xl" />
          <Skeleton className="flex-1 h-11 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
