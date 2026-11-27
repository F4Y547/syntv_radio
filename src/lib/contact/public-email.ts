export const OFFICIAL_CONTACT_EMAIL = "hello@syntv.online";

type Env = Record<string, string | undefined>;

function addressOnly(value: string): string {
  const friendlyMatch = value.match(/<([^<>]+)>/);
  return (friendlyMatch?.[1] ?? value).trim().toLowerCase();
}

/**
 * The official address is published only after the owner has explicitly
 * attested that the mailbox is configured and verified, and at least one
 * delivery setting actually references that mailbox. Without both checks the
 * site must present the contact form as the only official channel.
 */
export function getPublicContactEmail(env: Env = process.env): string | null {
  if (env.CONTACT_EMAIL_VERIFIED !== "true") return null;

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
