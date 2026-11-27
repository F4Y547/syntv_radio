/**
 * Serializes JSON-LD for a native <script> tag.
 *
 * Next.js recommends escaping `<` so external strings cannot terminate the
 * script element. Station names, tags, and URLs come from a third-party
 * directory, so they must never be interpolated into raw HTML unescaped.
 */
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
