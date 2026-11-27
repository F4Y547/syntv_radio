# AdSense Readiness

This document describes the technical AdSense preparation in this repository and the manual steps that only the site owner can complete. It is not a guarantee of AdSense approval. Approval depends on Google's review of the live site, its content, its traffic quality, its policy compliance, and account history.

## What is implemented

- Google AdSense account verification meta tag in `src/app/layout.tsx`:
  `google-adsense-account: ca-pub-6652257842391620`
- `public/ads.txt` at the site root with exactly:
  `google.com, pub-6652257842391620, DIRECT, f08c47fec0942fa0`
- Public legal and information pages: `/privacy-policy`, `/terms`, `/disclaimer`, `/about`, `/faq`, `/contact`
- Public directory indexes: `/countries`, `/genres`, `/trending`
- Footer sections for Explore, Information, and Legal, plus a Cookie preferences control
- A first-party consent banner and preferences dialog
- Env-gated, consent-gated AdSense library loading
- Reusable `AdSlot` component that refuses to render without a real numeric slot ID
- Contact form with server-side validation, honeypot, IP rate limiting, and configuration-gated delivery
- Sitemap and robots updates, including `Disallow: /admin/`
- Playwright coverage for legal pages, footer links, metadata, `ads.txt`, sitemap/robots, contact validation, mobile navigation, canonical URLs, and consent

## What is deliberately not active

- No AdSense library is loaded by default.
- No ad unit is rendered by default.
- No ad-slot ID is invented or committed.
- No third-party analytics or advertising cookie is set by application code.
- No claim is made that the custom consent UI is a Google-certified CMP.

## Manual owner steps

### 1. Verify the live domain and ads.txt

1. Deploy the current code.
2. Confirm `https://syntv.online/ads.txt` returns HTTP 200 and exactly the publisher line above.
3. Confirm the homepage HTML contains exactly one `google-adsense-account` meta tag with `ca-pub-6652257842391620`.
4. In AdSense, open **Sites** and verify `syntv.online`.
5. In AdSense, check the **ads.txt** status for the site. Crawling can take time.

### 2. Configure consent for regulated regions

The first-party consent UI in `src/components/consent/consent-manager.tsx` records transparency and choice. It is **not** a Google-certified consent management platform (CMP).

For visitors in the EEA, the UK, and Switzerland, Google may require a certified CMP integrated with the AdSense account before ads are served. Configure the applicable message in the AdSense account:

1. Open AdSense → **Privacy & messaging**.
2. Configure the GDPR message / certified CMP option offered for the account.
3. Publish the message and confirm it appears on the live site before enabling ads.
4. Confirm the CMP choice is respected by any ad code you add.

Do not enable advertising in regulated regions until the required CMP is live and verified. The custom banner should remain as an additional transparency layer, not as a substitute for a required certified CMP.

### 3. Create real ad units

1. In AdSense, create the ad units you intend to use.
2. Copy each numeric slot ID from AdSense.
3. Import `AdSlot` from `@/components/ads/ad-slot` and pass the real `slotId`.
4. Place ad slots away from the player bar, navigation, play buttons, and other controls. Keep the `Advertisement` label visible.
5. Reserve space with the `minHeight` prop to avoid layout shift.
6. Verify the page in a browser with advertising consent granted and with it denied.

Example:

```tsx
import { AdSlot } from "@/components/ads/ad-slot";

<AdSlot slotId="1234567890" format="auto" minHeight={250} />
```

The component validates that the slot ID is numeric and has 6–20 digits. It returns `null` when advertising is disabled, consent is absent, or the ID is invalid.

### 4. Enable the AdSense library

Set these environment variables in the deployment platform:

```text
NEXT_PUBLIC_ADSENSE_ENABLED=true
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-6652257842391620
```

`NEXT_PUBLIC_ADSENSE_CLIENT` is optional because the verified publisher ID is the code default. Only set `NEXT_PUBLIC_ADSENSE_ENABLED=true` after the site, consent setup, and ad units are ready. The AdSense script loads only when this flag is true and the visitor has granted the optional advertising choice.

Do not set the flag to true just to test the AdSense review. Ads must not appear on pages that lack sufficient original content, and they must not be placed to encourage accidental clicks.

### 5. Contact form delivery

The contact form is functional in the UI and API, but message delivery requires one of the following configurations.

**Option A: webhook**

```text
CONTACT_WEBHOOK_URL=https://example.com/your-contact-endpoint
CONTACT_WEBHOOK_SECRET=optional-bearer-secret
```

The API sends a JSON `POST` with `source`, `submittedAt`, `topic`, `topicLabel`, `name`, `email`, `station`, and `message`. It expects a 2xx response within 10 seconds. If `CONTACT_WEBHOOK_SECRET` is set, it is sent as `Authorization: Bearer <secret>`.

**Option B: Resend**

```text
RESEND_API_KEY=...
CONTACT_FROM_EMAIL=contact@your-verified-domain.example
CONTACT_TO_EMAIL=owner@your-verified-domain.example
```

`CONTACT_TO_EMAIL` accepts a comma-separated list. The from address must be on a domain verified by the email provider. The visitor's address is used as `reply_to`.

With neither option configured, `POST /api/contact` returns HTTP 503 with `code: "contact_not_configured"` and the UI shows a clear fallback message. No message is stored by the application in that case.

Do not publish an email address, phone number, postal address, or registration number unless the owner has explicitly confirmed it is accurate and intended to be public.

### 6. Review the live site before requesting review

- Open every legal page and check the content is accurate for the current deployment.
- Confirm the contact form either delivers or clearly reports that delivery is not configured.
- Confirm no placeholder text, invented reviews, fake ratings, or unverified claims are visible.
- Confirm the site has substantial original content beyond station listings.
- Confirm navigation works on mobile and desktop, in light and dark themes.
- Confirm `robots.txt` allows public pages and `sitemap.xml` includes them.
- Confirm `/admin/` and `/api/` are disallowed and admin pages are `noindex`.
- Confirm `https://syntv.online/ads.txt` is reachable without authentication.
- Confirm the consent banner appears for a first-time visitor and that “Essential only” prevents ad scripts.
- Confirm no ad overlaps the player, navigation, or playback controls.

## Verification commands

Run locally:

```bash
npx tsc --noEmit
npm run lint
npm run build
npx playwright test
```

Check the built site:

```bash
curl -s https://syntv.online/ads.txt
curl -s https://syntv.online/robots.txt
curl -s https://syntv.online/sitemap.xml
```

Check the meta tag count in a browser console:

```js
document.querySelectorAll('meta[name="google-adsense-account"]').length; // 1
```

## Files to review

| File | Purpose |
|---|---|
| `src/app/layout.tsx` | Root metadata and AdSense verification tag |
| `public/ads.txt` | Authorized digital sellers record |
| `src/lib/consent/index.tsx` | Consent state, storage key, GPC/DNT handling |
| `src/components/consent/consent-manager.tsx` | Banner and preferences dialog |
| `src/components/ads/adsense-script.tsx` | Env/consent-gated library loading |
| `src/components/ads/ad-slot.tsx` | Reusable labelled ad container |
| `src/app/api/contact/route.ts` | Contact validation, rate limiting, delivery |
| `src/app/contact/contact-form.tsx` | Contact form UI and error states |
| `src/lib/content/faq.ts` | Shared FAQ content and JSON-LD source |
| `src/app/sitemap.ts` | Public page and directory sitemap |
| `src/app/robots.ts` | Crawl rules |
| `tests/e2e/adsense-readiness.spec.ts` | Automated readiness checks |

## What this repository cannot guarantee

- AdSense approval or a specific review timeline
- That the live deployment matches this commit
- That a custom consent banner satisfies every regional certification requirement
- That the contact form delivers messages without owner configuration
- That station metadata or third-party streams remain available
- Search indexing, ranking, or traffic outcomes
