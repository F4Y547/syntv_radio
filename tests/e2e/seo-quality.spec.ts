import { expect, test } from "@playwright/test";
import { getPublicContactEmail } from "../../src/lib/contact/public-email";
import { getGenreEditorial, isIndexableGenre } from "../../src/lib/seo/genre-editorial";
import { jsonLd } from "../../src/lib/seo/json-ld";

test("JSON-LD serializer escapes script delimiters from external data", () => {
  const payload = { name: "</script><script>alert(1)</script>" };
  const serialized = jsonLd(payload);

  // Next.js escapes `<` in JSON-LD; `>` is valid and does not need escaping.
  expect(serialized).toContain("\\u003c/script>");
  expect(serialized).not.toContain("<script");
  expect(JSON.parse(serialized)).toEqual(payload);
});

test("official email is hidden unless verified and configured", () => {
  expect(getPublicContactEmail({})).toBeNull();
  expect(getPublicContactEmail({ CONTACT_EMAIL_VERIFIED: "true" })).toBeNull();
  expect(
    getPublicContactEmail({
      CONTACT_EMAIL_VERIFIED: "false",
      CONTACT_TO_EMAIL: "hello@syntv.online",
    }),
  ).toBeNull();

  // Verified mailbox reference is not enough when delivery config is invalid/unconfigured.
  expect(
    getPublicContactEmail({
      CONTACT_EMAIL_VERIFIED: "true",
      CONTACT_TO_EMAIL: "owner@example.com, hello@syntv.online",
    }),
  ).toBeNull();

  expect(
    getPublicContactEmail({
      CONTACT_EMAIL_VERIFIED: "true",
      CONTACT_TO_EMAIL: "owner@example.com, hello@syntv.online",
      CONTACT_FROM_EMAIL: "SYNTV RADIO <hello@syntv.online>",
      RESEND_API_KEY: "re_test_key",
    }),
  ).toBe("hello@syntv.online");

  expect(
    getPublicContactEmail({
      CONTACT_EMAIL_VERIFIED: "true",
      CONTACT_FROM_EMAIL: "SYNTV RADIO <hello@syntv.online>",
      CONTACT_TO_EMAIL: "hello@syntv.online",
      RESEND_API_KEY: "re_test_key",
    }),
  ).toBe("hello@syntv.online");
});

test("broad non-genre tags have editorial context and are not indexed", () => {
  expect(getGenreEditorial("music")?.summary).toMatch(/broad community tag/i);
  expect(isIndexableGenre("music")).toBe(true);
  expect(isIndexableGenre("fm")).toBe(false);
  expect(isIndexableGenre("moi-merino")).toBe(false);
  expect(isIndexableGenre("jazz")).toBe(true);
});
