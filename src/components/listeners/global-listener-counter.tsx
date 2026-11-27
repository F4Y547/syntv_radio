"use client";

import { useEffect, useRef, useState } from "react";
import { Radio } from "lucide-react";
import { useListenerCounts } from "./listener-counts-provider";

function useAnimatedNumber(value: number | null, duration = 500) {
  const [display, setDisplay] = useState<number | null>(value);
  const fromRef = useRef<number | null>(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === null) {
      fromRef.current = null;
      return;
    }
    const from = fromRef.current ?? value;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (value - from) * eased);
      setDisplay(next);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, duration]);

  return value === null ? null : display;
}

export function GlobalListenerCounter() {
  const { totalListeners, status } = useListenerCounts();
  const animated = useAnimatedNumber(totalListeners);

  return (
    <div
      className="inline-flex min-w-[220px] flex-col rounded-2xl border border-primary/25 bg-background/45 px-4 py-3 backdrop-blur-sm shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-primary)_10%,transparent),0_12px_40px_color-mix(in_srgb,var(--color-primary)_10%,transparent)]"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
        <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-live shadow-[0_0_10px_color-mix(in_srgb,var(--color-live)_70%,transparent)]" />
        </span>
        <Radio size={13} aria-hidden="true" />
        Live listeners
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        {status === "unavailable" && totalListeners === null ? (
          <span className="font-display text-lg font-semibold text-muted-foreground">Listener count unavailable</span>
        ) : (
          <>
            <span className="font-display text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
              {animated === null ? "—" : animated.toLocaleString()}
            </span>
            <span className="text-sm text-foreground-muted">listening now</span>
          </>
        )}
      </div>

      <p className="mt-1 text-xs text-muted-foreground">Listening on SYNTV RADIO</p>
    </div>
  );
}
