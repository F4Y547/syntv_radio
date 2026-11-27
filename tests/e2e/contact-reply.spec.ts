import { expect, test } from "@playwright/test";
import { escapeHtml, hasHeaderInjection, isValidEmail, renderReplyHtml, sendContactReply } from "../../src/lib/contact/reply";

test.describe("contact reply helpers", () => {
  test("escapeHtml escapes HTML-sensitive characters", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  });

  test("renderReplyHtml escapes body and preserves line breaks", () => {
    const html = renderReplyHtml("Hello\n<script>bad</script>");
    expect(html).toContain("Hello<br />");
    expect(html).toContain("&lt;script&gt;bad&lt;/script&gt;");
    expect(html).not.toContain("<script>bad");
  });

  test("hasHeaderInjection detects CR/LF", () => {
    expect(hasHeaderInjection("ok subject")).toBe(false);
    expect(hasHeaderInjection("bad\r\nsubject")).toBe(true);
  });

  test("isValidEmail validates basic email format", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("bad-email")).toBe(false);
  });

  test("sendContactReply rejects header injection before provider call", async () => {
    const prevKey = process.env.RESEND_API_KEY;
    const prevFrom = process.env.CONTACT_FROM_EMAIL;
    process.env.RESEND_API_KEY = "re_test";
    process.env.CONTACT_FROM_EMAIL = "test@example.com";
    try {
      await expect(sendContactReply({ toEmail: "user@example.com", subject: "ok\r\nbad", bodyText: "hello" }, "idempo-1")).rejects.toThrow(/Invalid subject/);
    } finally {
      if (prevKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = prevKey;
      if (prevFrom === undefined) delete process.env.CONTACT_FROM_EMAIL; else process.env.CONTACT_FROM_EMAIL = prevFrom;
    }
  });
});
