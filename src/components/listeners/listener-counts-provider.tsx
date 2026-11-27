"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

export interface LiveListenerCounts {
  totalListeners: number | null;
  stationCounts: Record<string, number>;
  updatedAt: string | null;
  status: "loading" | "live" | "unavailable";
}

const ListenerCountsContext = createContext<LiveListenerCounts>({
  totalListeners: null,
  stationCounts: {},
  updatedAt: null,
  status: "loading",
});

const POLL_INTERVAL_MS = 10_000;

export function ListenerCountsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LiveListenerCounts>({
    totalListeners: null,
    stationCounts: {},
    updatedAt: null,
    status: "loading",
  });
  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;

    const applyPayload = (data: unknown) => {
      if (!data || typeof data !== "object") return;
      const d = data as Record<string, unknown>;
      if (d.success !== true) {
        setState((prev) => ({ ...prev, status: prev.totalListeners === null ? "unavailable" : prev.status }));
        return;
      }
      setState({
        totalListeners: typeof d.totalListeners === "number" ? d.totalListeners : null,
        stationCounts:
          d.stationCounts && typeof d.stationCounts === "object" && !Array.isArray(d.stationCounts)
            ? (d.stationCounts as Record<string, number>)
            : {},
        updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : new Date().toISOString(),
        status: "live",
      });
    };

    const fetchSnapshot = async () => {
      try {
        const res = await fetch("/api/listeners/live", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        applyPayload(await res.json());
      } catch {
        if (stoppedRef.current) return;
        setState((prev) => ({ ...prev, status: prev.totalListeners === null ? "unavailable" : prev.status }));
      }
    };

    const startPolling = () => {
      if (pollRef.current) return;
      void fetchSnapshot();
      pollRef.current = setInterval(() => { void fetchSnapshot(); }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const closeSse = () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };

    const startSse = () => {
      if (stoppedRef.current) return;
      if (typeof window === "undefined" || !("EventSource" in window)) {
        startPolling();
        return;
      }
      closeSse();
      stopPolling();
      try {
        const es = new EventSource("/api/listeners/stream");
        esRef.current = es;
        es.onmessage = (event) => {
          try {
            applyPayload(JSON.parse(event.data));
          } catch {
            // ignore malformed event
          }
        };
        es.onerror = () => {
          if (stoppedRef.current) return;
          closeSse();
          startPolling();
          if (reconnectRef.current) clearTimeout(reconnectRef.current);
          reconnectRef.current = setTimeout(() => {
            if (stoppedRef.current) return;
            stopPolling();
            startSse();
          }, 15_000);
        };
      } catch {
        startPolling();
      }
    };

    startSse();

    return () => {
      stoppedRef.current = true;
      closeSse();
      stopPolling();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <ListenerCountsContext.Provider value={value}>{children}</ListenerCountsContext.Provider>;
}

export function useListenerCounts() {
  return useContext(ListenerCountsContext);
}
