import { StationGridSkeleton } from "@/components/station/station-card-skeleton";

export default function Loading() {
  return (
    <div className="space-y-10" role="status" aria-label="Loading content">
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-surface/25 p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
          <div className="space-y-4">
            <div className="h-7 w-44 rounded-full skeleton" />
            <div className="h-12 w-full max-w-2xl rounded-xl skeleton" />
            <div className="h-12 w-4/5 max-w-xl rounded-xl skeleton" />
            <div className="h-20 w-full max-w-2xl rounded-xl skeleton" />
            <div className="h-14 w-full max-w-2xl rounded-xl skeleton" />
          </div>
          <div className="min-h-[320px] rounded-2xl skeleton" />
        </div>
      </section>
      <section className="space-y-4">
        <div className="h-4 w-24 rounded skeleton" />
        <div className="h-8 w-64 rounded-lg skeleton" />
        <StationGridSkeleton count={6} />
      </section>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
