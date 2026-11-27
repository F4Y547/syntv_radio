import { Resend } from "resend";
import { getContactDeliveryConfig } from "./config";

export interface ContactReplyInput {
  toEmail: string;
  subject: string;
  bodyText: string;
  replyTo?: string;
}

export interface ContactReplyResult {
  ok: true;
  providerMessageId: string;
}

export class ContactReplyError extends Error {
  constructor(message: string, public readonly code: "config" | "provider" | "invalid") {
    super(message);
    this.name = "ContactReplyError";
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderReplyHtml(bodyText: string): string {
  const escaped = escapeHtml(bodyText).replace(/\n/g, "<br />\n");
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#111;background:#fff;padding:24px;">
  <div style="max-width:680px;margin:0 auto">
    <h2 style="margin:0 0 16px;font-size:20px;">SYNTV RADIO Support</h2>
    <div style="font-size:14px;">${escaped}</div>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
    <p style="font-size:12px;color:#6b7280;margin:0;">This message was sent by SYNTV RADIO in response to your contact submission.</p>
  </div>
</body></html>`;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function hasHeaderInjection(value: string): boolean {
  return /[\r\n]/.test(value);
}

export async function sendContactReply(input: ContactReplyInput, idempotencyKey: string): Promise<ContactReplyResult> {
  const config = getContactDeliveryConfig();
  const apiKey = config.apiKey || process.env.RESEND_API_KEY?.trim();
  const from = config.from || process.env.CONTACT_FROM_EMAIL?.trim();
  const to = input.toEmail.trim();

  if (!apiKey || !from) {
    throw new ContactReplyError("Resend is not configured.", "config");
  }
  if (!isValidEmail(to) || hasHeaderInjection(to)) {
    throw new ContactReplyError("Invalid recipient email.", "invalid");
  }
  if (hasHeaderInjection(input.subject)) {
    throw new ContactReplyError("Invalid subject.", "invalid");
  }
  if (!input.subject.trim()) throw new ContactReplyError("Subject is required.", "invalid");
  if (!input.bodyText.trim()) throw new ContactReplyError("Message is required.", "invalid");

  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.emails.send(
      {
        from,
        to: [to],
        replyTo: input.replyTo && isValidEmail(input.replyTo) ? input.replyTo : undefined,
        subject: input.subject.trim().slice(0, 200),
        text: input.bodyText.trim(),
        html: renderReplyHtml(input.bodyText.trim()),
      },
      { idempotencyKey },
    );
    if (error || !data?.id) {
      console.warn("[contact-reply] Resend did not confirm delivery");
      throw new ContactReplyError("The email provider did not accept the message.", "provider");
    }
    return { ok: true, providerMessageId: data.id };
  } catch (err) {
    if (err instanceof ContactReplyError) throw err;
    console.warn("[contact-reply] Resend request failed");
    throw new ContactReplyError("The email provider could not be reached.", "provider");
  }
}
