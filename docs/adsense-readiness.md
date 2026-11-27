# AdSense Readiness

This document describes the technical preparation in this repository and the manual steps that only the site owner can complete. It is **not** a guarantee of AdSense approval or regulatory compliance. Approval depends on Google's review of the live site, content, traffic quality, policy compliance, and account history.

## Current readiness status

| Area | Status |
|---|---|
| AdSense verification meta tag | Configured: `ca-pub-6652257842391620` |
| `ads.txt` | Configured with the required publisher record |
| Contact delivery code | Implemented; no webhook or Resend credentials configured in this repository |
| Google-certified CMP | **Not configured or verified**. The first-party banner is not a certified CMP. |
| Real ad unit slot IDs | **Not supplied**. No slot IDs are committed or invented. |
| Advertising | **Disabled by default**. No script, no containers, no placements render. |
| AdSense approval | Not claimed or verified |

## What is implemented

- One AdSense verification meta tag in `src/app/layout.tsx`
- `public/ads.txt` with exactly `google.com, pub-6652257842391620, DIRECT, f08c47fec0942fa0`
- Public legal and information pages: `/privacy-policy`, `/terms`, `/disclaimer`, `/about`, `/faq`, `/contact`
- Public directory indexes: `/countries`, `/genres`, `/trending`
- Footer sections for Explore, Information, and Legal, plus a Cookie preferences control
- A first-party consent banner and preferences dialog with withdrawal and preference changes
- Centralized ad activation in `src/lib/ads/config.ts`
- Server-only `ADS_ENABLED` and `ADS_CMP_VERIFIED` gates; `NEXT_PUBLIC_*` values are public by design
- Reusable placements for homepage, listing, country, genre, and detail pages in `src/components/ads/placements.tsx`
- Consent-gated `AdSlot` that renders only with a valid numeric slot ID
- A single `next/script` AdSense loader with a fixed id to avoid duplicate injection
- Contact delivery through a validated webhook (preferred) or the official Resend SDK
- Contact validation, honeypot, IP rate limiting, content-hash duplicate protection, provider idempotency keys, and safe-error responses
- Playwright coverage for legal pages, metadata, `ads.txt`, sitemap/robots, contact validation, consent, and ad configuration

## What is deliberately not active

- No AdSense library is loaded by default.
- No ad container or placeholder is rendered by default.
- No slot ID is invented or committed.
- No claim is made that the custom consent UI is a Google-certified CMP.
- No real email is claimed delivered unless the configured provider explicitly accepts it.
- No private API key, webhook secret, or `.env` file is committed.

## Contact delivery setup

### Option A: webhook (preferred when configured)

Set these in the hosting dashboard, never in source code:

```text
CONTACT_WEBHOOK_URL=https://your-endpoint.example/path
CONTACT_WEBHOOK_SECRET=replace-with-a-long-random-secret
```

Rules:

- The URL must be an absolute `http://` or `https://` URL without embedded credentials or a fragment.
- In production, loopback, private, link-local, and cloud metadata addresses are rejected.
- Requests are server-side `POST` JSON with a 10-second timeout.
- `CONTACT_WEBHOOK_SECRET`, when set, is sent as `Authorization: Bearer <secret>`.
- Headers include `X-Idempotency-Key`, and the body includes `source`, `submittedAt`, `topic`, `topicLabel`, `name`, `email`, `station`, `message`, and `idempotencyKey`.
- A non-2xx response, timeout, or connection error returns HTTP 502 `delivery_failed`. It does **not** fall back to Resend.
- Message bodies, submitted personal data, and secrets are never logged.

Configure the receiving endpoint to return 2xx only after it has accepted the payload.

### Option B: Resend

1. Create a Resend account and add/verify the domain used for `CONTACT_FROM_EMAIL` in **Domains**. Complete the DNS records Resend shows (SPF/DKIM and any provider-required records; add DMARC as recommended below).
2. Create an API key in **API Keys** with permission to send email.
3. Set these variables in the hosting dashboard after domain/sender verification:

```text
RESEND_API_KEY=re_...
CONTACT_FROM_EMAIL=SYNTV RADIO <hello@syntv.online>
CONTACT_TO_EMAIL=hello@syntv.online
```

`CONTACT_TO_EMAIL` accepts a comma-separated list. The visitor's validated email is passed as `replyTo`. The message is rendered as plain text and HTML-escaped HTML; user input is never inserted into raw HTML unescaped. Resend idempotency keys and the application's duplicate store prevent repeated submissions.

The `contact_not_configured` code is returned with HTTP 503 only when neither provider is configured. An invalid or failing configured provider returns `contact_configuration_invalid` or `delivery_failed` instead; it never reports false success.

## Certified CMP setup

The current consent implementation is first-party and is **not** a Google-certified CMP. Do not enable ads in the EEA, UK, or Switzerland based on it alone.

Owner steps:

1. Sign in to the AdSense account that owns `ca-pub-6652257842391620`.
2. Open **Privacy & messaging** (or the GDPR consent message section currently offered by AdSense).
3. Select a Google-certified CMP/partner compatible with AdSense and the regions you serve. Create the account with that CMP if required; no account/API credentials are included in this repository.
4. Configure the message for the EEA, UK, and Switzerland, including purposes for advertising and consent withdrawal/preference changes.
5. Publish the CMP on `syntv.online` and verify on a clean browser profile that the message appears and choices are saved.
6. Confirm in the AdSense privacy/messaging UI that the configuration is active for the site. Record the date and account evidence internally.
7. Only then set `ADS_CMP_VERIFIED=true`. This is an owner attestation, not proof created by this codebase.

Keep the first-party banner as an additional transparency layer. Advertising code is gated on both verified CMP readiness and the visitor's explicit optional advertising consent. Do not load ad scripts or personalized advertising in regulated regions before step 6 is verified.

## Real AdSense ad unit setup

1. Deploy the site and confirm `https://syntv.online/ads.txt` and the verification meta tag.
2. In AdSense, create the actual ad units you intend to use. Use responsive/auto formats where appropriate.
3. Copy each numeric slot ID from the AdSense dashboard. Slot IDs are long numeric strings, not account IDs or unit names.
4. Set these variables in the hosting dashboard:

```text
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-6652257842391620
NEXT_PUBLIC_ADSENSE_SLOT_HOME=real-numeric-home-slot
NEXT_PUBLIC_ADSENSE_SLOT_LISTING=real-numeric-listing-slot
NEXT_PUBLIC_ADSENSE_SLOT_DETAIL=real-numeric-detail-slot
```

Country and genre landing pages reuse the listing slot. Components are available in `src/components/ads/placements.tsx`:

- `HomeAd`
- `ListingAd`
- `CountryAd`
- `GenreAd`
- `DetailAd`

The component rejects non-numeric IDs and returns `null` when any required slot is missing. Reserve space with `minHeight`, keep the `Advertisement` label visible, and never place an ad over the player bar, play buttons, navigation, or other interactive controls.

## Safe activation order

```text
ADS_ENABLED=false
ADS_CMP_VERIFIED=false
```

Keep both false until all manual steps above are complete. Then:

```text
ADS_ENABLED=true
ADS_CMP_VERIFIED=true
```

`ADS_ENABLED` and `ADS_CMP_VERIFIED` are server-only. `NEXT_PUBLIC_ADSENSE_CLIENT_ID` and the three slot IDs are public identifiers and safe to expose. Ads activate only when all of the following are true:

- `ADS_ENABLED=true`
- `ADS_CMP_VERIFIED=true`
- The publisher ID matches `ca-pub-\d{16}`
- All three slot IDs are valid numeric strings
- The visitor has granted advertising consent in the current consent state

A configuration flag alone is never treated as regulatory compliance.

## Hosting dashboard and redeploy

For Vercel (project `syntv-radio`):

1. Open the project → **Settings** → **Environment Variables**.
2. Add only the variables needed for the current phase, with no secrets committed to Git.
3. Apply them to **Production** (and Preview if you want to test there).
4. Redeploy: push to `master`, or use **Deployments** → **Redeploy** after an environment-only change.
5. Vercel injects environment variables at build/runtime; a redeploy is required after changing them.
6. Verify the deployment status and live site before considering the change complete.

Do not set production contact credentials or ad activation flags in Preview unless you intend to send real messages or serve ads there.

## Verification commands

```bash
npx tsc --noEmit
npm run lint
npm run build
npx playwright test
```

Live checks:

```bash
curl -s https://syntv.online/ads.txt
curl -s https://syntv.online/robots.txt
curl -s https://syntv.online/sitemap.xml
```

Browser checks:

- Exactly one `meta[name="google-adsense-account"]` with `ca-pub-6652257842391620`
- With ads disabled: zero `script[src*="pagead2.googlesyndication.com"]` and zero `ins.adsbygoogle`
- With consent denied: no ad containers
- With consent granted and full configuration: ads appear only in safe placements
- Contact success is shown only after the configured provider accepts the request

## Files to review

| File | Purpose |
|---|---|
| `src/app/layout.tsx` | Root metadata, verification tag, server-side ad config handoff |
| `public/ads.txt` | Authorized digital sellers record |
| `src/lib/ads/config.ts` | Central activation and slot validation |
| `src/components/ads/ads-provider.tsx` | Safe client-side ad configuration context |
| `src/components/ads/adsense-script.tsx` | Single consent-gated script loader |
| `src/components/ads/ad-slot.tsx` | Reusable labelled ad container |
| `src/components/ads/placements.tsx` | Homepage/listing/country/genre/detail wrappers |
| `src/lib/consent/index.tsx` | First-party consent state, storage key, GPC/DNT handling |
| `src/components/consent/consent-manager.tsx` | Banner and preferences dialog |
| `src/lib/contact/config.ts` | Server-only provider detection and URL validation |
| `src/lib/contact/validation.ts` | Input validation and safe message rendering |
| `src/lib/contact/delivery.ts` | Webhook and official Resend SDK delivery |
| `src/lib/contact/handler.ts` | Rate limit, dedupe, and response envelope |
| `src/app/api/contact/route.ts` | Route handler entry point |
| `src/app/contact/contact-form.tsx` | Loading, success, and error states |
| `tests/e2e/` | Automated readiness, contact, consent, and ad configuration tests |

## What this repository cannot guarantee

- AdSense approval or a specific review timeline
- That a Google-certified CMP is configured or that this repository is itself certified
- That real ad units/slot IDs exist without owner dashboard configuration
- That the live deployment matches a given commit
- That the contact form delivers messages without owner configuration
- That station metadata or third-party streams remain available
- Search indexing, ranking, or traffic outcomes
