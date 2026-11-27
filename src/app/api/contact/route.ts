import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/listeners/rate-limit";
import { getClientIp } from "@/lib/listeners/validation";

const TOPICS = [
  "general",
  "technical",
  "station-owner",
  "copyright",
  "privacy",
  "advertising",
  "other",
] as const;

type Topic = (typeof TOPICS)[number];

const TOPIC_LABELS: Record<Topic, string> = {
  general: "General question",
  technical: "Technical support",
  "station-owner": "Station owner request",
  copyright: "Copyright or content removal",
  privacy: "Privacy request",
  advertising: "Advertising or partnership",
  other: "Other",
};

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  topic?: unknown;
  station?: unknown;
  message?: unknown;
  privacyAccepted?: unknown;
  website?: unknown;
}

function clean(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);
}

function isTopic(value: string): value is Topic {
  return (TOPICS as readonly string[]).includes(value);
}

function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function destinationList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function deliverViaWebhook(payload: Record<string, unknown>) {
  const url = process.env.CONTACT_WEBHOOK_URL?.trim();
  if (!url) return false;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = process.env.CONTACT_WEBHOOK_SECRET?.trim();
  if (secret) headers.Authorization = `Bearer ${secret}`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Contact webhook returned ${response.status}`);
  return true;
}

async function deliverViaResend(subject: string, text: string, replyTo: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.CONTACT_FROM_EMAIL?.trim();
  const to = destinationList(process.env.CONTACT_TO_EMAIL ?? "");
  if (!apiKey || !from || to.length === 0) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: replyTo,
      subject,
      text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Contact email provider returned ${response.status}`);
  return true;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`contact:${ip}`, 5, 10 * 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many messages. Please try again later." },
      { status: 429, headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rate) } },
    );
  }

  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rate) } },
    );
  }

  if (clean(payload.website, 200)) {
    return NextResponse.json(
      { success: false, error: "Invalid submission." },
      { status: 400, headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rate) } },
    );
  }

  const name = clean(payload.name, 100);
  const email = clean(payload.email, 254);
  const topicValue = clean(payload.topic, 40);
  const station = clean(payload.station, 200);
  const message = clean(payload.message, 5_000);

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, error: "Enter a valid email address.", field: "email" },
      { status: 400, headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rate) } },
    );
  }
  if (!isTopic(topicValue)) {
    return NextResponse.json(
      { success: false, error: "Choose a valid topic.", field: "topic" },
      { status: 400, headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rate) } },
    );
  }
  if (message.length < 20) {
    return NextResponse.json(
      { success: false, error: "Message must be at least 20 characters.", field: "message" },
      { status: 400, headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rate) } },
    );
  }
  if (payload.privacyAccepted !== true) {
    return NextResponse.json(
      { success: false, error: "Please acknowledge the privacy notice.", field: "privacyAccepted" },
      { status: 400, headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rate) } },
    );
  }

  const topic = topicValue as Topic;
  const subject = `[SYNTV RADIO] ${TOPIC_LABELS[topic]} — ${name || email}`.replace(/[\r\n]+/g, " ").slice(0, 160);
  const text = [
    "New SYNTV RADIO contact message",
    "",
    `Topic: ${TOPIC_LABELS[topic]}`,
    `Name: ${name || "(not provided)"}`,
    `Email: ${email}`,
    `Station: ${station || "(not provided)"}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const webhookPayload = {
    source: "syntv-radio-contact",
    submittedAt: new Date().toISOString(),
    topic,
    topicLabel: TOPIC_LABELS[topic],
    name,
    email,
    station,
    message,
  };

  try {
    const delivered =
      (await deliverViaWebhook(webhookPayload)) ||
      (await deliverViaResend(subject, text, email));

    if (!delivered) {
      return NextResponse.json(
        {
          success: false,
          code: "contact_not_configured",
          error: "The contact form is not configured to deliver messages yet.",
        },
        { status: 503, headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rate) } },
      );
    }

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rate) } },
    );
  } catch (error) {
    console.error("[contact]", error instanceof Error ? error.message : "delivery failed");
    return NextResponse.json(
      { success: false, error: "The message could not be delivered. Please try again later." },
      { status: 502, headers: { "Cache-Control": "no-store", ...rateLimitHeaders(rate) } },
    );
  }
}
