export default function StationDetailLoading() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading station">
      <div className="h-5 w-32 rounded skeleton" />
      <section className="rounded-[2rem] border border-border/70 bg-surface/30 p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="h-24 w-24 shrink-0 rounded-2xl skeleton sm:h-32 sm:w-32" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-28 rounded-full skeleton" />
            <div className="h-10 w-full max-w-lg rounded-xl skeleton" />
            <div className="h-5 w-full max-w-md rounded skeleton" />
            <div className="flex gap-3 pt-2">
              <div className="h-11 w-32 rounded-full skeleton" />
              <div className="h-11 w-11 rounded-full skeleton" />
            </div>
          </div>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-border bg-surface/50 p-4">
            <div className="h-4 w-20 rounded skeleton" />
            <div className="mt-3 h-6 w-28 rounded skeleton" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
