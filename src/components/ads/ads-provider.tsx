"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AdSlotKey } from "../../lib/ads/config";

export interface AdsContextValue {
  enabled: boolean;
  clientId: string | null;
  slots: Record<AdSlotKey, string | null>;
}

const disabledAds: AdsContextValue = {
  enabled: false,
  clientId: null,
  slots: { home: null, listing: null, detail: null },
};

const AdsContext = createContext<AdsContextValue>(disabledAds);

export function AdsProvider({ value, children }: { value: AdsContextValue; children: ReactNode }) {
  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds(): AdsContextValue {
  return useContext(AdsContext);
}
