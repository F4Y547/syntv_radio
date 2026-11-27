import { checkRateLimitAsync, rateLimitHeaders } from "../listeners/rate-limit";
import { getClientIp } from "../listeners/validation";
import { recordContactSubmission } from "../admin/store";
import { getContactDeliveryConfig, type ContactDeliveryConfig } from "./config";
import { createContactDedupeStore, type ContactDedupeStore } from "./dedupe";
import { ContactDeliveryError, deliverContact, type DeliveryDependencies } from "./delivery";
import { validateContactPayload, type ContactField } from "./validation";

const NO_STORE = { "Cache-Control": "no-store" } as const;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60_000;

export interface ContactHandlerOptions extends DeliveryDependencies {
  config?: ContactDeliveryConfig;
  dedupe?: ContactDedupeStore;
  rateLimiter?: (key: string, limit: number, windowMs: number) => ReturnType<typeof checkRateLimitAsync> | import("../listeners/rate-limit").RateLimitResult;
  now?: () => number;
}

type ErrorBody = {
  success: false;
  error: string;
  code: string;
  field?: ContactField;
};

function json(body: ErrorBody | { success: true }, status: number, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

async function contentHash(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Framework-neutral contact POST handler. Dependencies are injectable so
 * provider outcomes can be tested without real credentials or network calls.
 */
export function createContactHandler(options: ContactHandlerOptions = {}) {
  const config = options.config ?? getContactDeliveryConfig();
  const dedupe = options.dedupe ?? createContactDedupeStore();
  const rateLimiter = options.rateLimiter ?? checkRateLimitAsync;
  const now = options.now ?? Date.now;

  return async function POST(request: Request): Promise<Response> {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        if (new URL(origin).host !== host) {
          return json({ success: false, error: "Invalid request origin.", code: "invalid_origin" }, 403);
        }
      } catch {
        return json({ success: false, error: "Invalid request origin.", code: "invalid_origin" }, 403);
      }
    }

    const ip = getClientIp(request);
    const rate = await rateLimiter(`contact:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
    const rateHeaders = rateLimitHeaders(rate);

    if (!rate.allowed) {
      return json(
        { success: false, error: "Too many messages. Please try again later.", code: "rate_limited" },
        429,
        rateHeaders,
      );
    }

    let rawPayload: unknown;
    try {
      rawPayload = await request.json();
    } catch {
      return json({ success: false, error: "Invalid request body.", code: "invalid_body" }, 400, rateHeaders);
    }

    const validation = validateContactPayload(rawPayload);
    if (!validation.ok) {
      return json(
        {
          success: false,
          error: validation.message,
          code: validation.code,
          ...(validation.field ? { field: validation.field } : {}),
        },
        400,
        rateHeaders,
      );
    }

    if (config.mode === "unconfigured") {
      return json(
        {
          success: false,
          error: "The contact form is not configured to deliver messages yet.",
          code: "contact_not_configured",
        },
        503,
        rateHeaders,
      );
    }

    if (config.mode === "invalid") {
      return json(
        {
          success: false,
          error: config.problem ?? "The contact delivery configuration is invalid.",
          code: "contact_configuration_invalid",
        },
        503,
        rateHeaders,
      );
    }

    const contact = validation.value;
    const idempotencyKey = await contentHash(
      [ip, contact.email, contact.topic, contact.station, contact.message].join("\u0000"),
    );

    if (dedupe.has(idempotencyKey, now())) {
      return json(
        {
          success: false,
          error: "This message has already been submitted. Please wait before sending it again.",
          code: "duplicate_submission",
        },
        409,
        rateHeaders,
      );
    }

    try {
      await deliverContact(config, contact, idempotencyKey, {
        fetchImpl: options.fetchImpl,
        resendFactory: options.resendFactory,
        now: options.now,
      });
    } catch (error) {
      if (error instanceof ContactDeliveryError) {
        // Provider identity is intentionally omitted from the client response.
        console.warn("[contact] delivery failed:", error.provider);
      } else {
        console.warn("[contact] delivery failed: unknown error");
      }
      return json(
        {
          success: false,
          error: "The message could not be delivered. Please try again later.",
          code: "delivery_failed",
        },
        502,
        rateHeaders,
      );
    }

    dedupe.add(idempotencyKey, now());
    try {
      await recordContactSubmission({
        name: contact.name,
        email: contact.email,
        topic: contact.topic,
        station: contact.station,
        message: contact.message,
      });
    } catch (err) {
      console.error("[contact] submission accepted but failed to persist admin record", err);
    }
    return json({ success: true }, 200, rateHeaders);
  };
}
