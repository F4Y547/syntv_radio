<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/syntv-radio-logo.svg" />
    <img src="./public/syntv-radio-logo-light.svg" alt="SYNTV RADIO" width="320" />
  </picture>

  <p><strong>Premium world radio, tuned for the modern web.</strong></p>

  <p>
    Discover, explore, and stream live radio stations from around the world with a fast, polished, and SEO-ready Next.js experience.
  </p>

  <p>
    <a href="https://syntv.online">Live Site</a>
    ·
    <a href="https://github.com/F4Y547/syntv_radio">Repository</a>
  </p>
</div>

---

## Overview

**SYNTV RADIO** is a free, premium web radio app built with Next.js App Router. It combines real-time station discovery from the [Radio Browser](https://www.radio-browser.info/) ecosystem with a refined listening experience, an interactive 3D globe, local listening tools, and production-focused SEO.

## Highlights

- **Live Radio Discovery** — Browse, search, and filter stations by name, country, genre/tag, language, and sorting options.
- **Premium Listening Experience** — Persistent player with volume, mute, reconnect/error handling, sleep timer, keyboard shortcuts, and command palette (`Ctrl+K`).
- **Interactive 3D Globe** — Explore stations on a `react-globe.gl` / Three.js globe with country focus and SVG fallback when WebGL is unavailable.
- **Personal Library** — Favorites, recents, collections, import/export/share flows, and listening stats stored locally in the browser.
- **Responsive & Accessible UI** — Mobile-first layouts, theme toggle, skeleton states, subtle motion, and accessibility-minded controls.
- **PWA-Ready** — Web app manifest, service worker registration, and installable app foundation.
- **Advanced SEO** — Route metadata, canonicals, Open Graph/Twitter cards, JSON-LD, sitemap, robots, and real-data landing pages for stations, countries, and genres.
- **Trust & Legal Pages** — Privacy Policy, Terms, Disclaimer, About, FAQ, and a validated contact form.
- **AdSense-Ready Architecture** — `ads.txt`, a single verification meta tag, consent-gated library loading, and reusable labelled ad slots that stay inactive until configured.
- **Internationalization Foundation** — EN/ES locale support with persisted preference.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, TypeScript) |
| UI | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/) |
| 3D / Visualization | [react-globe.gl](https://github.com/vasturiano/react-globe.gl), [Three.js](https://threejs.org/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Data | [Radio Browser API](https://api.radio-browser.info/) via proxied app routes |
| Testing | [Playwright](https://playwright.dev/), ESLint, TypeScript |
| Deployment | [Vercel](https://vercel.com/) |

## Project Structure

```text
src/
  app/                 # App Router pages, layouts, metadata routes, API proxies
  components/          # UI, layout, player, globe, station, and provider components
  lib/                 # API clients, SEO helpers, storage, i18n, utilities
  styles/tokens/       # Design tokens (primitive, semantic, component)
public/
  data/                # GeoJSON and static data assets
  textures/            # Globe textures
  ads.txt              # AdSense authorized digital sellers record
docs/
  adsense-readiness.md # Owner checklist and deployment configuration
tests/
  e2e/                 # Playwright smoke, SEO, and AdSense-readiness tests
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install

```bash
npm install --ignore-scripts
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production server |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Apply Prisma migrations in production |
| `npm run db:migrate:dev` | Create/apply migrations in development |

## Admin Platform & Database

Production admin features require a persistent PostgreSQL database. **Do not use JSON files or in-memory state as production multi-instance admin storage.**

1. Set `DATABASE_URL`.
2. Run `npm run db:generate` and `npm run db:migrate`.
3. Create the first owner user securely (scrypt hash via `src/lib/admin/password.ts`); do not commit credentials.
4. Sign in at `/admin`.

Admin features: session login/logout (HttpOnly cookie, scrypt, revocable DB sessions), RBAC (`owner`, `administrator`, `editor`), station/country/genre CRUD, station approval/verification workflow, contact submission management, stream health history, SEO metadata management, ad configuration, audit logs. Mutating admin APIs enforce same-origin checks, rate limiting, RBAC, and no-store responses.

## Environment Variables

Create a local `.env.local` from [`.env.example`](./.env.example). Never commit real secrets.

| Variable | Required | Purpose |
|---|---|---|
| `REDIS_URL` | Production multi-instance | Shared Redis-compatible store for real-time listener sessions/counts |
| `LISTENER_SESSION_TTL` | Optional | Active session TTL in seconds (default `90`) |
| `LISTENER_HEARTBEAT_INTERVAL` | Optional | Client heartbeat interval in seconds (default `25`) |
| `LISTENER_UPDATE_INTERVAL` | Optional | Live SSE/poll update interval in seconds (default `5`) |
| `DATABASE_URL` | Admin features | PostgreSQL connection string for Prisma-backed admin/DB features |
| `LISTENER_ADMIN_TOKEN` | For admin analytics | Protects `/admin/listeners` and `/api/listeners/admin` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional | Google Search Console verification |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Optional | Bing Webmaster Tools verification |
| `CONTACT_WEBHOOK_URL` | One contact option | Absolute HTTP(S) webhook that receives validated contact messages; takes precedence over Resend |
| `CONTACT_WEBHOOK_SECRET` | Optional | Bearer token sent to the contact webhook over HTTPS |
| `RESEND_API_KEY` | One contact option | Official Resend SDK API key for contact email delivery |
| `CONTACT_FROM_EMAIL` | With Resend | Verified Resend sender address (official: `SYNTV RADIO <hello@syntv.online>` after domain verification) |
| `CONTACT_TO_EMAIL` | With Resend | Recipient address or comma-separated list (official: `hello@syntv.online`) |
| `CONTACT_EMAIL_VERIFIED` | Server-only, default `false` | Publishes `hello@syntv.online` only after provider/DNS verification and a received test message; also requires a delivery setting that references that mailbox |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Default publisher ID | Public AdSense publisher ID (`ca-pub-6652257842391620`) |
| `NEXT_PUBLIC_ADSENSE_SLOT_HOME` | With ads | Real numeric homepage ad unit slot ID |
| `NEXT_PUBLIC_ADSENSE_SLOT_LISTING` | With ads | Real numeric listing/country/genre ad unit slot ID |
| `NEXT_PUBLIC_ADSENSE_SLOT_DETAIL` | With ads | Real numeric station detail ad unit slot ID |
| `ADS_ENABLED` | Server-only, default `false` | Master advertising switch |
| `ADS_CMP_VERIFIED` | Server-only, default `false` | Owner attestation that a Google-certified CMP is live and verified |

> Public `NEXT_PUBLIC_*` variables must never contain private values.

## Real-Time Listener Tracking

SYNTV RADIO tracks **active playback sessions on SYNTV RADIO** (not global external station audience). Counts update in real time via SSE with polling fallback.

- **Session lifecycle**: listener becomes active only after audio playback starts; heartbeat keeps session alive; pause/stop/error/pagehide removes or expires it.
- **Storage**: Redis-compatible shared store when `REDIS_URL` is configured; documented in-memory fallback for development/single-instance only.
- **Privacy**: anonymous random session IDs, no unnecessary personal data, rate-limited endpoints.
- **Admin analytics**: protected by `LISTENER_ADMIN_TOKEN` at `/admin/listeners`.

## Trust, Contact, and Consent

- Public pages: `/privacy-policy`, `/terms`, `/disclaimer`, `/about`, `/faq`, and `/contact`.
- The contact form validates input in the browser and on the server, uses a honeypot, IP rate limiting, and content-hash duplicate protection, and delivers through a validated webhook (preferred) or the official Resend SDK. Without delivery configuration it returns a clear `503 contact_not_configured` response and does not store messages.
- Optional analytics and advertising choices are off by default. Global Privacy Control / Do Not Track signals force them off.
- The first-party consent banner is a transparency and choice UI, **not** a Google-certified CMP. For regulated regions, the site owner must configure the certified CMP through the AdSense account before enabling ads.
- No phone number, postal address, or company registration number is published. `hello@syntv.online` appears on public pages only when `CONTACT_EMAIL_VERIFIED=true` and a delivery setting references that mailbox; until then the contact form is the only published official channel.

## AdSense Readiness

The site includes one AdSense verification meta tag, a root `ads.txt` file, and consent-gated ad architecture. Advertising, ad scripts, and ad slots are **not active by default**, and no slot IDs are invented.

1. Deploy, then verify `https://syntv.online/ads.txt` and the verification meta tag.
2. Configure and verify a Google-certified CMP in the AdSense account for regulated regions. The first-party banner is not a certified CMP.
3. Create real ad units in AdSense and copy their numeric slot IDs into `NEXT_PUBLIC_ADSENSE_SLOT_HOME`, `NEXT_PUBLIC_ADSENSE_SLOT_LISTING`, and `NEXT_PUBLIC_ADSENSE_SLOT_DETAIL`.
4. Set `ADS_CMP_VERIFIED=true` only after the CMP is live and verified, then set `ADS_ENABLED=true` only after the site and ad units are ready.
5. Redeploy after changing environment variables, then verify ads only appear with valid consent and never overlap the player, navigation, or playback controls.

See [`docs/adsense-readiness.md`](./docs/adsense-readiness.md) for the full owner checklist, webhook/email setup, and verification commands. AdSense approval cannot be guaranteed by this repository.

## SEO & Indexing

SYNTV RADIO includes production-oriented SEO foundations:

- Canonical URLs and route-level metadata
- Open Graph and Twitter card metadata
- Structured data (JSON-LD) for website, organization, FAQ, about, contact, collection, and station pages
- Dynamic `sitemap.xml` and `robots.txt`, including public legal/info pages and `Disallow: /admin/`
- Indexable landing pages for `/stations`, `/countries`, `/genres`, `/trending`, and the legal/info pages
- `noindex` handling for utility/user-specific pages such as `/stats`, `/collections`, and `/offline`

After deployment, verify the live domain, submit the sitemap in Google Search Console / Bing Webmaster Tools, and validate structured data. Indexing and ranking improvements should only be claimed with observed data.

## Testing

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
```

Playwright E2E coverage includes smoke flows, SEO checks, and AdSense-readiness checks in `tests/e2e/` (legal pages, footer links, exactly one verification meta tag, `ads.txt`, sitemap/robots, indexability, contact validation, mobile navigation, duplicate canonicals, and consent).

## Deployment

The app is configured for Vercel deployment.

1. Push to the main branch/repository.
2. Import or connect the repository in Vercel.
3. Configure the production domain (`syntv.online`).
4. Add optional verification environment variables, plus contact delivery variables if messages should be delivered.
5. Deploy and verify `/robots.txt`, `/sitemap.xml`, `/ads.txt`, metadata, and core user flows.
6. Follow [`docs/adsense-readiness.md`](./docs/adsense-readiness.md) before enabling ads or requesting review.

## Data & Attribution

Station metadata and streams are sourced through the [Radio Browser](https://www.radio-browser.info/) public API. Availability, stream quality, and metadata accuracy depend on upstream station sources.

## License

No license file is currently included in this repository. Add a `LICENSE` file before distributing or open-sourcing under specific terms.
