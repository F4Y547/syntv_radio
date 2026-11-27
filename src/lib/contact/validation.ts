import { isValidEmail } from "./config";

export const TOPICS = [
  "general",
  "technical",
  "station-owner",
  "copyright",
  "privacy",
  "advertising",
  "other",
] as const;

export type Topic = (typeof TOPICS)[number];
export type ContactField = "email" | "topic" | "message" | "privacyAccepted";

const TOPIC_LABELS: Record<Topic, string> = {
  general: "General question",
  technical: "Technical support",
  "station-owner": "Station owner request",
  copyright: "Copyright or content removal",
  privacy: "Privacy request",
  advertising: "Advertising or partnership",
  other: "Other",
};

export interface ValidContact {
  name: string;
  email: string;
  topic: Topic;
  topicLabel: string;
  station: string;
  message: string;
  subject: string;
  text: string;
  html: string;
  webhookPayload: Record<string, string>;
}

export type ValidationResult =
  | { ok: true; value: ValidContact }
  | { ok: false; code: string; message: string; field?: ContactField };

function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isTopic(value: string): value is Topic {
  return (TOPICS as readonly string[]).includes(value);
}

function buildMessage(contact: Pick<ValidContact, "name" | "email" | "topic" | "topicLabel" | "station" | "message">) {
  const subject = `[SYNTV RADIO] ${contact.topicLabel} — ${contact.name || contact.email}`
    .replace(/[\r\n]+/g, " ")
    .slice(0, 160);

  const text = [
    "New SYNTV RADIO contact message",
    "",
    `Topic: ${contact.topicLabel}`,
    `Name: ${contact.name || "(not provided)"}`,
    `Email: ${contact.email}`,
    `Station: ${contact.station || "(not provided)"}`,
    "",
    "Message:",
    contact.message,
  ].join("\n");

  const html = [
    "<h2>New SYNTV RADIO contact message</h2>",
    `<p><strong>Topic:</strong> ${escapeHtml(contact.topicLabel)}</p>`,
    `<p><strong>Name:</strong> ${escapeHtml(contact.name || "(not provided)")}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(contact.email)}</p>`,
    `<p><strong>Station:</strong> ${escapeHtml(contact.station || "(not provided)")}</p>`,
    "<p><strong>Message:</strong></p>",
    `<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(contact.message)}</pre>`,
  ].join("");

  return { subject, text, html };
}

export function validateContactPayload(payload: unknown): ValidationResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, code: "invalid_body", message: "Invalid request body." };
  }

  const input = payload as Record<string, unknown>;
  // Honeypot: bots often fill hidden "website/company" fields. Keep the check
  // but return a clear, user-recoverable message because browser autofill can
  // occasionally populate hidden fields on aggressive password managers.
  const honeypot = clean(input.website, 200) || clean(input.companyWebsite, 200);
  if (honeypot) {
    return {
      ok: false,
      code: "invalid_submission",
      message: "Submission could not be verified. Please refresh the page and try again.",
    };
  }

  const name = clean(input.name, 100);
  const email = clean(input.email, 254);
  const topicValue = clean(input.topic, 40);
  const station = clean(input.station, 200);
  const message = clean(input.message, 5_000);

  if (!isValidEmail(email)) {
    return { ok: false, code: "validation_failed", field: "email", message: "Enter a valid email address." };
  }
  if (!isTopic(topicValue)) {
    return { ok: false, code: "validation_failed", field: "topic", message: "Choose a valid topic." };
  }
  if (message.length < 20) {
    return {
      ok: false,
      code: "validation_failed",
      field: "message",
      message: "Message must be at least 20 characters.",
    };
  }
  if (input.privacyAccepted !== true) {
    return {
      ok: false,
      code: "validation_failed",
      field: "privacyAccepted",
      message: "Please acknowledge the privacy notice.",
    };
  }

  const topic = topicValue as Topic;
  const topicLabel = TOPIC_LABELS[topic];
  const rendered = buildMessage({ name, email, topic, topicLabel, station, message });

  return {
    ok: true,
    value: {
      name,
      email,
      topic,
      topicLabel,
      station,
      message,
      ...rendered,
      webhookPayload: {
        source: "syntv-radio-contact",
        topic,
        topicLabel,
        name,
        email,
        station,
        message,
      },
    },
  };
}
