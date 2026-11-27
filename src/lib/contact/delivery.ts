import { Resend } from "resend";
import { CONTACT_WEBHOOK_TIMEOUT_MS, type ContactDeliveryConfig } from "./config";
import type { ValidContact } from "./validation";

export type ContactDeliveryErrorCode = "provider_error" | "configuration_error";

export class ContactDeliveryError extends Error {
  constructor(
    readonly code: ContactDeliveryErrorCode,
    readonly provider: "webhook" | "resend" | "configuration",
    message: string,
  ) {
    super(message);
    this.name = "ContactDeliveryError";
  }
}

interface ResendEmailPayload {
  from: string;
  to: string[];
  replyTo: string;
  subject: string;
  text: string;
  html: string;
}

export interface ResendSendResponse {
  data?: { id?: string } | null;
  error?: unknown;
}

export interface ResendClientLike {
  emails: {
    send(payload: ResendEmailPayload, options?: { idempotencyKey?: string }): Promise<ResendSendResponse>;
  };
}

export interface DeliveryDependencies {
  fetchImpl?: typeof fetch;
  resendFactory?: (apiKey: string) => ResendClientLike;
  now?: () => number;
}

const defaultResendFactory = (apiKey: string): ResendClientLike =>
  new Resend(apiKey) as unknown as ResendClientLike;

async function deliverViaWebhook(
  config: ContactDeliveryConfig,
  contact: ValidContact,
  idempotencyKey: string,
  deps: Required<Pick<DeliveryDependencies, "fetchImpl" | "now">>,
): Promise<void> {
  if (!config.webhookUrl) {
    throw new ContactDeliveryError("configuration_error", "configuration", "Webhook URL is missing.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Idempotency-Key": idempotencyKey,
  };
  if (config.webhookSecret) headers.Authorization = `Bearer ${config.webhookSecret}`;

  const body = JSON.stringify({
    ...contact.webhookPayload,
    submittedAt: new Date(deps.now()).toISOString(),
    idempotencyKey,
  });

  let response: Response;
  try {
    response = await deps.fetchImpl(config.webhookUrl, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(CONTACT_WEBHOOK_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new ContactDeliveryError("provider_error", "webhook", "The contact webhook could not be reached.");
  }

  if (!response.ok) {
    // Log only the status code. Never log the request body, headers, or secrets.
    console.warn("[contact] webhook rejected submission with a non-2xx response");
    throw new ContactDeliveryError("provider_error", "webhook", "The contact webhook rejected the message.");
  }
}

async function deliverViaResend(
  config: ContactDeliveryConfig,
  contact: ValidContact,
  idempotencyKey: string,
  deps: Required<Pick<DeliveryDependencies, "resendFactory">>,
): Promise<void> {
  if (!config.apiKey || !config.from || config.to.length === 0) {
    throw new ContactDeliveryError("configuration_error", "configuration", "Resend configuration is incomplete.");
  }

  try {
    const resend = deps.resendFactory(config.apiKey);
    const { data, error } = await resend.emails.send(
      {
        from: config.from,
        to: config.to,
        replyTo: contact.email,
        subject: contact.subject,
        text: contact.text,
        html: contact.html,
      },
      { idempotencyKey },
    );

    if (error || !data?.id) {
      // Do not log provider error details: they may contain recipient data.
      console.warn("[contact] Resend did not confirm delivery");
      throw new ContactDeliveryError("provider_error", "resend", "The email provider did not accept the message.");
    }
  } catch (error) {
    if (error instanceof ContactDeliveryError) throw error;
    console.warn("[contact] Resend request failed");
    throw new ContactDeliveryError("provider_error", "resend", "The email provider could not be reached.");
  }
}

/** Delivers only through the configured backend and only after explicit acceptance. */
export async function deliverContact(
  config: ContactDeliveryConfig,
  contact: ValidContact,
  idempotencyKey: string,
  deps: DeliveryDependencies = {},
): Promise<void> {
  const fetchImpl = deps.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const resendFactory = deps.resendFactory ?? defaultResendFactory;
  const now = deps.now ?? Date.now;

  if (config.mode === "webhook") {
    await deliverViaWebhook(config, contact, idempotencyKey, { fetchImpl, now });
    return;
  }
  if (config.mode === "resend") {
    await deliverViaResend(config, contact, idempotencyKey, { resendFactory });
    return;
  }

  throw new ContactDeliveryError("configuration_error", "configuration", "No delivery backend is configured.");
}
