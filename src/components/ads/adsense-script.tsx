"use client";

import Script from "next/script";
import { useConsent } from "@/lib/consent";

export const ADSENSE_CLIENT = "ca-pub-6652257842391620";

export function getAdSenseClient() {
  const configured = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  const client = configured || ADSENSE_CLIENT;
  return /^ca-pub-\d{16}$/.test(client) ? client : null;
}

export function isAdvertisingEnabled() {
  return process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true" && getAdSenseClient() !== null;
}

/**
 * Loads the AdSense library only when the owner has enabled advertising and the
 * visitor has granted the optional advertising choice. No ad units are created
 * here; ad slots must be configured separately.
 */
export function AdSenseScript() {
  const { consent } = useConsent();
  const client = getAdSenseClient();

  if (!isAdvertisingEnabled() || !client || consent?.advertising !== true) return null;

  return (
    <Script
      id="syntv-adsense-library"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
    />
  );
}
