<div align="center">
  <img src="./public/syntv-radio-logo.svg" alt="SYNTV RADIO" width="320" />

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
tests/
  e2e/                 # Playwright smoke and SEO tests
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

## Environment Variables

Optional environment variables for search engine verification:

```env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_google_verification_token
NEXT_PUBLIC_BING_SITE_VERIFICATION=your_bing_verification_token
```

> Do not commit `.env` files or secrets. Public `NEXT_PUBLIC_*` variables must never contain private values.

## SEO & Indexing

SYNTV RADIO includes production-oriented SEO foundations:

- Canonical URLs and route-level metadata
- Open Graph and Twitter card metadata
- Structured data (JSON-LD) for website, organization, stations, and landing pages
- Dynamic `sitemap.xml` and `robots.txt`
- Indexable landing pages for `/stations`, `/country/[slug]`, and `/genre/[slug]`
- `noindex` handling for utility/user-specific pages such as `/stats` and `/collections`

After deployment, verify the live domain, submit the sitemap in Google Search Console / Bing Webmaster Tools, and validate structured data. Indexing and ranking improvements should only be claimed with observed data.

## Testing

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
```

Playwright E2E coverage includes smoke flows and SEO checks in `tests/e2e/`.

## Deployment

The app is configured for Vercel deployment.

1. Push to the main branch/repository.
2. Import or connect the repository in Vercel.
3. Configure the production domain (`syntv.online`).
4. Add optional verification environment variables.
5. Deploy and verify `/robots.txt`, `/sitemap.xml`, metadata, and core user flows.

## Data & Attribution

Station metadata and streams are sourced through the [Radio Browser](https://www.radio-browser.info/) public API. Availability, stream quality, and metadata accuracy depend on upstream station sources.

## License

No license file is currently included in this repository. Add a `LICENSE` file before distributing or open-sourcing under specific terms.
