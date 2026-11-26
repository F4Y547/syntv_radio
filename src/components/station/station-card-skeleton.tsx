export function StationCardSkeleton() {
  return (
    <div
      className="flex h-full min-h-[188px] flex-col overflow-hidden rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[image:var(--card-bg)] p-4"
      aria-hidden="true"
    >
      <div className="flex items-start gap-3 pr-20">
        <div className="h-16 w-16 shrink-0 rounded-xl skeleton" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded-md skeleton" />
          <div className="h-3.5 w-1/2 rounded-md skeleton" />
          <div className="flex gap-1.5 pt-1">
            <div className="h-6 w-16 rounded-full skeleton" />
            <div className="h-6 w-14 rounded-full skeleton" />
          </div>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <div className="h-11 w-28 rounded-full skeleton" />
        <div className="h-11 w-11 rounded-full skeleton" />
      </div>
    </div>
  );
}

export function StationGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading stations" role="status">
      {Array.from({ length: count }).map((_, i) => (
        <StationCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading stations...</span>
    </div>
  );
}
