import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/header";

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Skeleton className="h-4 w-32 mb-8" />

        <div className="grid gap-8 lg:grid-cols-12">
          {/* ── Left Column ── */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Card */}
            <div className="overflow-hidden rounded-3xl border border-border bg-card">
              <Skeleton className="h-24 w-full" />
              <div className="relative px-6 pb-6">
                <div className="absolute -top-12 left-6">
                  <Skeleton className="h-24 w-24 rounded-3xl border-4 border-card" />
                </div>
                <div className="pt-14 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-7 w-40 mt-4" />
                </div>
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-5 w-12" />
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="lg:col-span-8 space-y-6">
            {/* Account Details Card */}
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-10 w-10 rounded-2xl shrink-0" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <Skeleton className="h-8 w-16 rounded-xl" />
              </div>

              {/* Account Details Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={i === 4 ? "sm:col-span-2" : ""}>
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-10 w-full rounded-2xl" />
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-4 h-20">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 h-20">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
