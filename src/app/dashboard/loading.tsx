// Route-level loading skeleton for the citizen dashboard.
// Shown while the server-rendered dashboard streams in; keeps the header, hero,
// tab bar and request cards in place without layout shift.
import { Skeleton } from "@/components/ui/skeleton";

/** Renders a fixed-height loading shell for the citizen dashboard. */
export default function DashboardLoading() {
  return (
    <div role="status" aria-busy="true" className="space-y-5">
      <span className="sr-only">Loading</span>
      {/* Header space */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 min-h-16">
          <Skeleton className="w-32 h-11" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-24 h-11" />
            <Skeleton className="w-32 h-11" />
          </div>
        </div>
      </div>
      {/* Hero strip */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="mt-2 h-6 w-1/2" />
      </section>
      {/* Tab bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex gap-2">
          <Skeleton className="w-40 h-12" />
          <Skeleton className="w-48 h-12" />
        </div>
      </div>
      {/* Request cards / empty state area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        <section className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="rounded-xl border bg-background p-5">
              <Skeleton className="mt-4 h-4 w-1/3" />
              <Skeleton className="mt-2 h-8 w-full" />
              <Skeleton className="mt-4 h-16 w-full" />
              <Skeleton className="mt-4 h-4 w-1/2" />
              <Skeleton className="mt-2 h-4 w-1/3" />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
