import { Suspense } from "react";
import { StationBrowser } from "@/components/station/station-browser";

export default function Home() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Loading radio…</div>}>
      <StationBrowser />
    </Suspense>
  );
}
