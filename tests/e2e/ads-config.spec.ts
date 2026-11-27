import { expect, test } from "@playwright/test";
import { canShowAd, getAdsConfig, type AdsConfig } from "../../src/lib/ads/config";

const clientId = "ca-pub-6652257842391620";

function enabledEnv() {
  return {
    ADS_ENABLED: "true",
    ADS_CMP_VERIFIED: "true",
    NEXT_PUBLIC_ADSENSE_CLIENT_ID: clientId,
    NEXT_PUBLIC_ADSENSE_SLOT_HOME: "1111111111",
    NEXT_PUBLIC_ADSENSE_SLOT_LISTING: "2222222222",
    NEXT_PUBLIC_ADSENSE_SLOT_DETAIL: "3333333333",
  };
}

function fullyEnabledConfig(): AdsConfig {
  return getAdsConfig(enabledEnv());
}

test.describe("advertising activation configuration", () => {
  test("ads remain disabled by default", () => {
    const config = getAdsConfig({});
    expect(config.enabled).toBe(false);
    expect(config.clientId).toBe(clientId);
    expect(config.slots).toEqual({ home: null, listing: null, detail: null });
    expect(config.reasons.join(" ")).toContain("ADS_ENABLED is not true");
  });

  test("missing slot IDs keep advertising disabled", () => {
    const config = getAdsConfig({
      ADS_ENABLED: "true",
      ADS_CMP_VERIFIED: "true",
      NEXT_PUBLIC_ADSENSE_CLIENT_ID: clientId,
    });
    expect(config.enabled).toBe(false);
    expect(config.reasons.join(" ")).toContain('Slot ID for "home" is missing or invalid');
  });

  test("valid slot IDs and verified flags are recognized", () => {
    const config = fullyEnabledConfig();
    expect(config.enabled).toBe(true);
    expect(config.reasons).toEqual([]);
    expect(config.clientId).toBe(clientId);
    expect(config.slots).toEqual({ home: "1111111111", listing: "2222222222", detail: "3333333333" });
  });

  test("invalid slot IDs are never accepted", () => {
    const config = getAdsConfig({
      ...enabledEnv(),
      NEXT_PUBLIC_ADSENSE_SLOT_DETAIL: "not-a-real-slot",
    });
    expect(config.enabled).toBe(false);
    expect(config.slots.detail).toBeNull();
  });

  test("invalid publisher ID keeps advertising disabled", () => {
    const config = getAdsConfig({ ...enabledEnv(), NEXT_PUBLIC_ADSENSE_CLIENT_ID: "ca-pub-invalid" });
    expect(config.enabled).toBe(false);
    expect(config.clientId).toBeNull();
  });

  test("CMP not configured keeps advertising disabled", () => {
    const config = getAdsConfig({ ...enabledEnv(), ADS_CMP_VERIFIED: "false" });
    expect(config.enabled).toBe(false);
    expect(config.reasons.join(" ")).toContain("Certified CMP readiness has not been verified");
  });

  test("consent denied blocks ads even with valid configuration", () => {
    const config = fullyEnabledConfig();
    expect(canShowAd(config, null)).toBe(false);
    expect(canShowAd(config, { advertising: false })).toBe(false);
  });

  test("consent granted allows the script gate only", () => {
    const config = fullyEnabledConfig();
    expect(canShowAd(config, { advertising: true })).toBe(true);
    expect(canShowAd(getAdsConfig({ ...enabledEnv(), ADS_ENABLED: "false" }), { advertising: true })).toBe(false);
  });
});
