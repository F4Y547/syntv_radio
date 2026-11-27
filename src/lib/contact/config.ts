export type ContactDeliveryMode = "webhook" | "resend" | "unconfigured" | "invalid";

export interface ContactDeliveryConfig {
  mode: ContactDeliveryMode;
  webhookUrl?: string;
  webhookSecret?: string;
  apiKey?: string;
  from?: string;
  to: string[];
  problem?: string;
}

export const CONTACT_WEBHOOK_TIMEOUT_MS = 10_000;

type Env = Record<string, string | undefined>;

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function emailAddress(value: string): string {
  const friendlyMatch = value.match(/<([^<>]+)>/);
  return (friendlyMatch?.[1] ?? value).trim();
}

function parseEmailList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host === "::1") return true;
  if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) return true;

  const octets = host.match(/^\d{1,3}(?:\.\d{1,3}){3}$/);
  if (!octets) return false;
  const [a, b] = octets[0].split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

export function validateWebhookUrl(
  raw: string,
  env: Env = process.env,
): { valid: true; url: string } | { valid: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { valid: false, reason: "CONTACT_WEBHOOK_URL must be a valid absolute URL." };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { valid: false, reason: "CONTACT_WEBHOOK_URL must use HTTP or HTTPS." };
  }
  if (parsed.username || parsed.password || parsed.hash) {
    return { valid: false, reason: "CONTACT_WEBHOOK_URL must not contain credentials or a fragment." };
  }
  if (!parsed.hostname || /\s/.test(raw)) {
    return { valid: false, reason: "CONTACT_WEBHOOK_URL must contain a valid host." };
  }
  if (env.NODE_ENV === "production" && isPrivateHost(parsed.hostname)) {
    return { valid: false, reason: "CONTACT_WEBHOOK_URL must be a public HTTPS endpoint in production." };
  }

  return { valid: true, url: parsed.toString() };
}

/**
 * Resolves the server-side delivery backend. Webhook has precedence; an
 * invalid or failing webhook must never silently fall back to email.
 */
export function getContactDeliveryConfig(env: Env = process.env): ContactDeliveryConfig {
  const webhookUrl = env.CONTACT_WEBHOOK_URL?.trim();
  if (webhookUrl) {
    const validation = validateWebhookUrl(webhookUrl, env);
    if (!validation.valid) {
      return { mode: "invalid", to: [], problem: validation.reason };
    }
    return {
      mode: "webhook",
      webhookUrl: validation.url,
      webhookSecret: env.CONTACT_WEBHOOK_SECRET?.trim() || undefined,
      to: [],
    };
  }

  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.CONTACT_FROM_EMAIL?.trim();
  const to = parseEmailList(env.CONTACT_TO_EMAIL ?? "");
  const hasAny = Boolean(apiKey || from || to.length);
  if (!hasAny) return { mode: "unconfigured", to: [] };

  if (!apiKey || !from || to.length === 0) {
    return {
      mode: "invalid",
      to: [],
      problem: "RESEND_API_KEY, CONTACT_FROM_EMAIL, and CONTACT_TO_EMAIL must all be configured.",
    };
  }
  if (!isValidEmail(emailAddress(from)) || to.some((item) => !isValidEmail(emailAddress(item)))) {
    return { mode: "invalid", to: [], problem: "Resend sender and recipient addresses must be valid emails." };
  }

  return { mode: "resend", apiKey, from, to };
}
