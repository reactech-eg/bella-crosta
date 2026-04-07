import { Skeleton } from "@/components/ui/skeleton";

export default function OrderDetailSkeleton() {
  return (
    <>
      {/* Header */}
      <div className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-12 h-4" />
          <Skeleton className="w-20 h-4" />
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="flex-1 grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Order Summary */}
            <div className="bg-card border border-border rounded-xl p-5">
              <Skeleton className="w-32 h-5 mb-4" />
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="w-16 h-3 mb-2" />
                    <Skeleton className="w-24 h-4" />
                  </div>
                ))}
              </div>
            </div>

            {/* Items */}
            <div className="bg-card border border-border rounded-xl p-5">
              <Skeleton className="w-16 h-5 mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="pb-3 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <Skeleton className="w-40 h-4 mb-2" />
                        <Skeleton className="w-32 h-3" />
                      </div>
                      <Skeleton className="w-20 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery */}
            <div className="bg-card border border-border rounded-xl p-5">
              <Skeleton className="w-20 h-5 mb-3" />
              <Skeleton className="w-12 h-3 mb-2" />
              <Skeleton className="w-64 h-4 mb-3" />
              <Skeleton className="w-16 h-3 mb-2" />
              <Skeleton className="w-80 h-12" />
            </div>

            {/* Customer */}
            <div className="bg-card border border-border rounded-xl p-5">
              <Skeleton className="w-20 h-5 mb-3" />
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="w-14 h-4" />
                    <Skeleton className="w-40 h-4" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="col-span-1 space-y-5">
            {/* Order Status */}
            <div className="bg-card border border-border rounded-xl p-5">
              <Skeleton className="w-28 h-5 mb-3" />
              <Skeleton className="w-24 h-6 mb-3" />
              <Skeleton className="w-full h-10 mb-3" />
              <Skeleton className="w-full h-10" />
            </div>

            {/* Payment */}
            <div className="bg-card border border-border rounded-xl p-5">
              <Skeleton className="w-20 h-5 mb-3" />
              <div className="space-y-2 mb-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="w-16 h-3" />
                    <Skeleton className="w-20 h-3" />
                  </div>
                ))}
              </div>
              <Skeleton className="w-full h-10" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
