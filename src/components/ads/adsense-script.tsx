"use client";

import Script from "next/script";
import { useConsent } from "@/lib/consent";
import { canShowAd } from "@/lib/ads/config";
import { useAds } from "./ads-provider";

/**
 * Loads the AdSense library only after server-side activation checks pass and
 * the visitor has granted the optional advertising choice. The fixed Script id
 * prevents duplicate injection during client-side navigation.
 */
export function AdSenseScript() {
  const ads = useAds();
  const { consent } = useConsent();

  if (!canShowAd(ads, consent) || !ads.clientId) return null;

  return (
    <Script
      id="syntv-adsense-library"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.clientId}`}
    />
  );
}
