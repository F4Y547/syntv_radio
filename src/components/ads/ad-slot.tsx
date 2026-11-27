"use client";

import { useEffect } from "react";
import { useConsent } from "@/lib/consent";
import { canShowAd, isValidAdSlotId, type AdSlotKey } from "@/lib/ads/config";
import { useAds } from "./ads-provider";

export type AdFormat = "auto" | "fluid" | "horizontal" | "rectangle" | "vertical";

export interface AdSlotProps {
  /** Env-backed placement. Country and genre pages share the listing slot. */
  placement?: AdSlotKey;
  /**
   * Optional explicit numeric slot ID from the publisher's AdSense account.
   * There is deliberately no default or invented ID.
   */
  slotId?: string;
  format?: AdFormat;
  className?: string;
  minHeight?: number;
  label?: string;
}

/**
 * Responsive, consent-gated AdSense container. It reserves vertical space to
 * avoid layout shift, is visually labelled as an advertisement, and returns
 * nothing until activation checks and visitor consent pass.
 *
 * Do not place an AdSlot over the player, navigation, or any playback control.
 */
export function AdSlot({
  placement,
  slotId,
  format = "auto",
  className = "",
  minHeight = 250,
  label = "Advertisement",
}: AdSlotProps) {
  const ads = useAds();
  const { consent } = useConsent();
  const resolvedSlot = placement ? ads.slots[placement] : slotId?.trim() ?? null;
  const canRender = canShowAd(ads, consent) && isValidAdSlotId(resolvedSlot);

  useEffect(() => {
    if (!canRender) return;
    try {
      const adsWindow = window as Window & { adsbygoogle?: unknown[] };
      adsWindow.adsbygoogle = adsWindow.adsbygoogle || [];
      adsWindow.adsbygoogle.push({});
    } catch {
      // The AdSense library may be blocked; the labelled container remains empty.
    }
  }, [canRender, resolvedSlot]);

  if (!canRender || !ads.clientId || !isValidAdSlotId(resolvedSlot)) return null;

  return (
    <aside aria-label={label} className={className} data-testid="ad-slot">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <div
        className="overflow-hidden rounded-xl border border-border/60 bg-surface/30"
        style={{ minHeight: `${Math.max(100, minHeight)}px` }}
      >
        <ins
          className="adsbygoogle block"
          style={{ display: "block", minHeight: `${Math.max(100, minHeight)}px` }}
          data-ad-client={ads.clientId}
          data-ad-slot={resolvedSlot.trim()}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
