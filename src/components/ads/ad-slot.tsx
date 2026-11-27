"use client";

import { useEffect } from "react";
import { useConsent } from "@/lib/consent";
import { getAdSenseClient, isAdvertisingEnabled } from "./adsense-script";

export type AdFormat = "auto" | "fluid" | "horizontal" | "rectangle" | "vertical";

interface AdSlotProps {
  /**
   * Ad unit slot ID from the publisher's AdSense account. There is deliberately
   * no default: arbitrary or invented slot IDs must never be used.
   */
  slotId: string;
  format?: AdFormat;
  className?: string;
  minHeight?: number;
  label?: string;
}

/**
 * Responsive, consent-gated AdSense container. It reserves vertical space to
 * avoid layout shift, is visually labelled as an advertisement, and returns
 * nothing until advertising is enabled and the visitor has opted in.
 *
 * Do not place an AdSlot over the player, navigation, or any playback control.
 */
export function AdSlot({
  slotId,
  format = "auto",
  className = "",
  minHeight = 250,
  label = "Advertisement",
}: AdSlotProps) {
  const { consent } = useConsent();
  const canRender =
    isAdvertisingEnabled() &&
    consent?.advertising === true &&
    /^\d{6,20}$/.test(slotId.trim());

  useEffect(() => {
    if (!canRender) return;
    try {
      const adsWindow = window as Window & { adsbygoogle?: unknown[] };
      adsWindow.adsbygoogle = adsWindow.adsbygoogle || [];
      adsWindow.adsbygoogle.push({});
    } catch {
      // The AdSense library may be blocked; the labelled container remains empty.
    }
  }, [canRender, slotId]);

  if (!canRender) return null;

  const client = getAdSenseClient();
  if (!client) return null;

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
          data-ad-client={client}
          data-ad-slot={slotId.trim()}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
