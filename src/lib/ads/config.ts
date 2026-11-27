export const DEFAULT_ADSENSE_CLIENT_ID = "ca-pub-6652257842391620";
export const ADSENSE_CLIENT_ID_PATTERN = /^ca-pub-\d{16}$/;
export const AD_SLOT_ID_PATTERN = /^\d{6,20}$/;

export type AdSlotKey = "home" | "listing" | "detail";

export interface AdsConfig {
  enabled: boolean;
  clientId: string | null;
  slots: Record<AdSlotKey, string | null>;
  reasons: string[];
}

type Env = Record<string, string | undefined>;

export interface ConsentState {
  advertising?: boolean | null;
}

export function isValidAdSlotId(value: string | null | undefined): value is string {
  return typeof value === "string" && AD_SLOT_ID_PATTERN.test(value.trim());
}

/**
 * Centralized advertising gate. `ADS_ENABLED` and `ADS_CMP_VERIFIED` are
 * server-only owner attestations; no ad code is activated unless both are set,
 * the publisher ID is valid, and every configured slot ID is numeric.
 */
export function getAdsConfig(env: Env = process.env): AdsConfig {
  const reasons: string[] = [];
  const clientValue = env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() || DEFAULT_ADSENSE_CLIENT_ID;
  const clientId = ADSENSE_CLIENT_ID_PATTERN.test(clientValue) ? clientValue : null;
  if (!clientId) reasons.push("NEXT_PUBLIC_ADSENSE_CLIENT_ID is invalid.");

  const slots: Record<AdSlotKey, string | null> = {
    home: env.NEXT_PUBLIC_ADSENSE_SLOT_HOME?.trim() || null,
    listing: env.NEXT_PUBLIC_ADSENSE_SLOT_LISTING?.trim() || null,
    detail: env.NEXT_PUBLIC_ADSENSE_SLOT_DETAIL?.trim() || null,
  };

  for (const key of Object.keys(slots) as AdSlotKey[]) {
    if (!isValidAdSlotId(slots[key])) {
      reasons.push(`Slot ID for "${key}" is missing or invalid.`);
      slots[key] = null;
    } else {
      slots[key] = (slots[key] as string).trim();
    }
  }

  if (env.ADS_ENABLED !== "true") reasons.push("ADS_ENABLED is not true.");
  if (env.ADS_CMP_VERIFIED !== "true") {
    reasons.push("Certified CMP readiness has not been verified by the site owner.");
  }

  return {
    enabled: reasons.length === 0,
    clientId,
    slots,
    reasons,
  };
}

/** Final per-visitor gate used by both the script loader and ad containers. */
export function canShowAd(
  config: Pick<AdsConfig, "enabled" | "clientId">,
  consent: ConsentState | null | undefined,
): boolean {
  return config.enabled && config.clientId !== null && consent?.advertising === true;
}

export function getPublicAdSenseConfig(env: Env = process.env) {
  const cfg = getAdsConfig(env);
  return {
    enabled: cfg.enabled,
    cmpVerified: env.ADS_CMP_VERIFIED === "true",
    publisherId: cfg.clientId,
    slotIds: [cfg.slots.home, cfg.slots.listing, cfg.slots.detail],
    reasons: cfg.reasons,
  };
}
