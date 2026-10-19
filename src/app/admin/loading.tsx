// Route-level loading skeleton for the administrator dashboard.
// Shown while the server-rendered admin page streams in; keeps the header, hero,
// stat cards, charts and request table in place without layout shift.
import { Skeleton } from "@/components/ui/skeleton";

/** Renders a fixed-height loading shell for the administrator dashboard. */
export default function AdminLoading() {
  return (
    <div role="status" aria-busy="true" className="space-y-5">
      <span className="sr-only">Loading</span>
      {/* Header space */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 min-h-16">
          <Skeleton className="w-32 h-11" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-40 h-11" />
            <Skeleton className="w-48 h-11" />
          </div>
        </div>
      </div>
      {/* Hero strip */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="mt-2 h-6 w-1/2" />
      </section>
      {/* Stat cards */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="rounded-2xl border bg-card p-5 shadow-sm">
              <Skeleton className="mt-2 h-4 w-1/2" />
              <Skeleton className="mt-4 h-12 w-1/3" />
            </div>
          ))}
        </div>
      </div>
      {/* Charts area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid gap-5 xl:grid-cols-2">
          {[1, 2, 3].map((index) => (
            <div key={index} className="rounded-2xl border bg-card p-4 shadow-sm">
              <Skeleton className="mt-4 h-4 w-1/3" />
              <Skeleton className="mt-4 h-[260px] w-full" />
            </div>
          ))}
        </div>
      </div>
      {/* Requests table area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="divide-y">
            {[1, 2, 3].map((index) => (
              <div key={index} className="grid w-full gap-3 p-5 text-left">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
