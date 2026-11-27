import { expect, test } from "@playwright/test";
import { getContactDeliveryConfig } from "../../src/lib/contact/config";
import { createTestDedupeStore } from "../../src/lib/contact/dedupe";
import { createContactHandler } from "../../src/lib/contact/handler";
import type { ResendClientLike, ResendSendResponse } from "../../src/lib/contact/delivery";

const validBody = {
  name: "Test Listener",
  email: "listener@example.com",
  topic: "general",
  station: "Example Radio",
  message: "This is a valid contact message long enough for server validation.",
  privacyAccepted: true,
};

function makeRequest(body: unknown = validBody, ip = "203.0.113.10") {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

const allowAll = () => ({ allowed: true, remaining: 4, resetAt: Date.now() + 600_000 });
const fixedNow = () => 1_800_000_000_000;

function successFetch(status = 204) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return new Response(null, { status });
  };
  return { fetchImpl, calls };
}

function fakeResend(response: ResendSendResponse) {
  const calls: Array<{ payload: Parameters<ResendClientLike["emails"]["send"]>[0]; options?: { idempotencyKey?: string } }> = [];
  const resendFactory: (apiKey: string) => ResendClientLike = () => ({
    emails: {
      send: async (payload, options) => {
        calls.push({ payload, options });
        return response;
      },
    },
  });
  return { resendFactory, calls };
}

test.describe("contact API delivery", () => {
  test("webhook configured and successful", async () => {
    const config = getContactDeliveryConfig({
      NODE_ENV: "production",
      CONTACT_WEBHOOK_URL: "https://hooks.example.com/syntv-contact",
      CONTACT_WEBHOOK_SECRET: "test-secret",
    });
    const { fetchImpl, calls } = successFetch();
    const handler = createContactHandler({ config, fetchImpl, now: fixedNow, rateLimiter: allowAll, dedupe: createTestDedupeStore() });

    const response = await handler(makeRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://hooks.example.com/syntv-contact");
    const headers = new Headers(calls[0]?.init?.headers);
    expect(headers.get("authorization")).toBe("Bearer test-secret");
    expect(headers.get("x-idempotency-key")).toMatch(/^[a-f0-9]{64}$/);
  });

  test("webhook error returns 502 and does not fall back to Resend", async () => {
    const config = getContactDeliveryConfig({
      NODE_ENV: "production",
      CONTACT_WEBHOOK_URL: "https://hooks.example.com/syntv-contact",
      RESEND_API_KEY: "re_test",
      CONTACT_FROM_EMAIL: "contact@example.com",
      CONTACT_TO_EMAIL: "owner@example.com",
    });
    const { fetchImpl } = successFetch(500);
    const resend = fakeResend({ data: { id: "should-not-be-used" } });
    const handler = createContactHandler({
      config,
      fetchImpl,
      resendFactory: resend.resendFactory,
      rateLimiter: allowAll,
      dedupe: createTestDedupeStore(),
    });

    const response = await handler(makeRequest());
    expect(response.status).toBe(502);
    expect((await response.json() as { code: string }).code).toBe("delivery_failed");
    expect(resend.calls).toHaveLength(0);
  });

  test("webhook connection failure returns 502", async () => {
    const config = getContactDeliveryConfig({
      NODE_ENV: "production",
      CONTACT_WEBHOOK_URL: "https://hooks.example.com/syntv-contact",
    });
    const fetchImpl: typeof fetch = async () => {
      throw new Error("network unavailable");
    };
    const handler = createContactHandler({ config, fetchImpl, rateLimiter: allowAll, dedupe: createTestDedupeStore() });

    const response = await handler(makeRequest());
    expect(response.status).toBe(502);
    expect((await response.json() as { code: string }).code).toBe("delivery_failed");
  });

  test("Resend configured and successful", async () => {
    const config = getContactDeliveryConfig({
      RESEND_API_KEY: "re_test",
      CONTACT_FROM_EMAIL: "SYNTV RADIO <contact@example.com>",
      CONTACT_TO_EMAIL: "owner@example.com,backup@example.com",
    });
    const resend = fakeResend({ data: { id: "email_123" } });
    const handler = createContactHandler({
      config,
      resendFactory: resend.resendFactory,
      rateLimiter: allowAll,
      dedupe: createTestDedupeStore(),
    });
    const body = {
      ...validBody,
      message: "Please remove <script>alert(1)</script> from the listing, thank you.",
    };

    const response = await handler(makeRequest(body));
    expect(response.status).toBe(200);
    expect(resend.calls).toHaveLength(1);
    const payload = resend.calls[0]?.payload as {
      from: string;
      to: string[];
      replyTo: string;
      subject: string;
      text: string;
      html: string;
    };
    expect(payload.from).toBe("SYNTV RADIO <contact@example.com>");
    expect(payload.to).toEqual(["owner@example.com", "backup@example.com"]);
    expect(payload.replyTo).toBe("listener@example.com");
    expect(payload.subject).toContain("General question");
    expect(payload.text).toContain("Test Listener");
    expect(payload.text).toContain("Please remove <script>alert(1)</script>");
    expect(payload.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(payload.html).not.toContain("<script>");
    expect(resend.calls[0]?.options?.idempotencyKey).toMatch(/^[a-f0-9]{64}$/);
  });

  test("Resend error returns 502", async () => {
    const config = getContactDeliveryConfig({
      RESEND_API_KEY: "re_test",
      CONTACT_FROM_EMAIL: "contact@example.com",
      CONTACT_TO_EMAIL: "owner@example.com",
    });
    const resend = fakeResend({ data: null, error: { message: "provider rejected" } });
    const handler = createContactHandler({
      config,
      resendFactory: resend.resendFactory,
      rateLimiter: allowAll,
      dedupe: createTestDedupeStore(),
    });

    const response = await handler(makeRequest());
    expect(response.status).toBe(502);
    expect((await response.json() as { code: string }).code).toBe("delivery_failed");
  });

  test("neither provider configured returns contact_not_configured", async () => {
    const handler = createContactHandler({
      config: getContactDeliveryConfig({}),
      rateLimiter: allowAll,
      dedupe: createTestDedupeStore(),
    });

    const response = await handler(makeRequest());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ success: false, code: "contact_not_configured" });
  });

  test("invalid provider configuration returns contact_configuration_invalid", async () => {
    const handler = createContactHandler({
      config: getContactDeliveryConfig({ CONTACT_WEBHOOK_URL: "file:///tmp/contact" }),
      rateLimiter: allowAll,
      dedupe: createTestDedupeStore(),
    });

    const response = await handler(makeRequest());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ success: false, code: "contact_configuration_invalid" });
  });

  test("invalid email and missing fields are rejected before delivery", async () => {
    const { fetchImpl, calls } = successFetch();
    const handler = createContactHandler({
      config: getContactDeliveryConfig({ CONTACT_WEBHOOK_URL: "https://hooks.example.com/contact" }),
      fetchImpl,
      rateLimiter: allowAll,
      dedupe: createTestDedupeStore(),
    });

    const response = await handler(makeRequest({ ...validBody, email: "not-an-email", message: "short" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, code: "validation_failed", field: "email" });
    expect(calls).toHaveLength(0);
  });

  test("rate limiting returns 429 with rate-limit headers", async () => {
    const handler = createContactHandler({
      config: getContactDeliveryConfig({ CONTACT_WEBHOOK_URL: "https://hooks.example.com/contact" }),
      rateLimiter: () => ({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 }),
      dedupe: createTestDedupeStore(),
    });

    const response = await handler(makeRequest());
    expect(response.status).toBe(429);
    expect((await response.json() as { code: string }).code).toBe("rate_limited");
    expect(response.headers.get("x-ratelimit-remaining")).toBe("0");
  });

  test("duplicate submissions are rejected after a confirmed delivery", async () => {
    const { fetchImpl, calls } = successFetch();
    const dedupe = createTestDedupeStore();
    const handler = createContactHandler({
      config: getContactDeliveryConfig({ CONTACT_WEBHOOK_URL: "https://hooks.example.com/contact" }),
      fetchImpl,
      now: fixedNow,
      rateLimiter: allowAll,
      dedupe,
    });

    const first = await handler(makeRequest());
    const second = await handler(makeRequest());
    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect((await second.json() as { code: string }).code).toBe("duplicate_submission");
    expect(calls).toHaveLength(1);
  });

  test("failed delivery releases the claim so the same message can be retried", async () => {
    let attempts = 0;
    const fetchImpl: typeof fetch = async () => {
      attempts += 1;
      return new Response(null, { status: attempts === 1 ? 500 : 204 });
    };
    const handler = createContactHandler({
      config: getContactDeliveryConfig({ CONTACT_WEBHOOK_URL: "https://hooks.example.com/contact" }),
      fetchImpl,
      now: fixedNow,
      rateLimiter: allowAll,
      dedupe: createTestDedupeStore(),
    });

    const failed = await handler(makeRequest());
    const retried = await handler(makeRequest());

    expect(failed.status).toBe(502);
    expect(retried.status).toBe(200);
    expect(attempts).toBe(2);
  });

  test("honeypot submissions are rejected", async () => {
    const { fetchImpl, calls } = successFetch();
    const handler = createContactHandler({
      config: getContactDeliveryConfig({ CONTACT_WEBHOOK_URL: "https://hooks.example.com/contact" }),
      fetchImpl,
      rateLimiter: allowAll,
      dedupe: createTestDedupeStore(),
    });

    const response = await handler(makeRequest({ ...validBody, website: "https://spam.example.com" }));
    expect(response.status).toBe(400);
    expect((await response.json() as { code: string }).code).toBe("invalid_submission");
    expect(calls).toHaveLength(0);
  });
});
