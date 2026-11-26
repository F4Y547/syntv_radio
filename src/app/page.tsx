import { Suspense } from "react";
import { StationBrowser } from "@/components/station/station-browser";
import { StationGridSkeleton } from "@/components/station/station-card-skeleton";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="space-y-10" role="status" aria-label="Loading">
          <div className="h-[420px] rounded-[2rem] border border-border/70 bg-surface/25 skeleton" />
          <StationGridSkeleton count={6} />
        </div>
      }
    >
      <StationBrowser />
    </Suspense>
  );
}
