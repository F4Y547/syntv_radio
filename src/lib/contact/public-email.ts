import { getContactDeliveryConfig } from "./config";

export const OFFICIAL_CONTACT_EMAIL = "hello@syntv.online";

type Env = Record<string, string | undefined>;

function addressOnly(value: string): string {
  const friendlyMatch = value.match(/<([^<>]+)>/);
  return (friendlyMatch?.[1] ?? value).trim().toLowerCase();
}

/**
 * The official address is published only after the owner has explicitly
 * attested that the mailbox is configured and verified, at least one delivery
 * setting references that mailbox, and the contact delivery configuration is valid.
 * Without these checks the site must present the contact form as the only official channel.
 */
export function getPublicContactEmail(env: Env = process.env): string | null {
  if (env.CONTACT_EMAIL_VERIFIED !== "true") return null;

  const delivery = getContactDeliveryConfig(env);
  if (delivery.mode === "unconfigured" || delivery.mode === "invalid") return null;

  const configuredAddresses = [
    ...(env.CONTACT_TO_EMAIL ?? "").split(","),
    env.CONTACT_FROM_EMAIL ?? "",
  ]
    .map((value) => addressOnly(value.trim()))
    .filter(Boolean);

  return configuredAddresses.includes(OFFICIAL_CONTACT_EMAIL)
    ? OFFICIAL_CONTACT_EMAIL
    : null;
}
