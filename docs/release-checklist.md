# SYNTV RADIO Release Checklist

This checklist is for staging/production release readiness. It does not authorize deployment, DNS changes, or AdSense enablement.

## Code / local verification (evidence required)

- [ ] `npm audit --omit=dev` — record result/date.
- [ ] `npx tsc --noEmit` — record result/date.
- [ ] `npm run lint` — record result/date.
- [ ] `npm run build` — record result/date.
- [ ] `npx playwright test` — record passed/skipped/failed counts/date.
- [ ] Prior evidence (2026-11-27, commit `58be2ff`): audit 0 vulns, tsc pass, lint pass, build pass, Playwright 120 passed/1 skipped/0 failed. Re-run after infrastructure changes.
- [ ] Confirm release commit deployed to staging/production; record deployed commit SHA.

## Infrastructure / database (Neon)

- [x] Neon project linked: `syntv_radio` (`cold-smoke-03358808`), branch `production` (`br-wandering-mouse-bdgaiwkk`), org `org-still-field-14757566` (2026-11-27).
- [x] Prisma migrations applied to Neon production DB; Prisma client generated (2026-11-27).
- [x] `DATABASE_URL` and `DATABASE_URL_UNPOOLED` configured locally (`.env.local`, gitignored) and added to Vercel Production/Preview/Development (names only; values not recorded).
- [ ] Bootstrap first owner with secure env vars: `npm run db:bootstrap-owner` (requires `DATABASE_URL`, `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`; no default credentials).
- [ ] Confirm DB connectivity and admin CRUD persistence on deployed/staging environment.

## Redis / shared runtime state

- [ ] Configure `REDIS_URL` in Vercel/deployment env (Upstash or compatible). **Currently not configured in accessible runtime.**
- [ ] Verify distributed contact rate limiting and duplicate submission protection across instances.
- [ ] Verify listener presence/heartbeat/expiry/stale cleanup and active counts across instances/restarts.
- [ ] Verify public station/country/genre directory cache TTL and invalidation after admin CRUD.
- [ ] Confirm graceful fallback behavior when Redis is unavailable (documented degraded mode, not multi-instance safe).

## Vercel environment readiness

Required variables (do not print secret values):

- [x] `DATABASE_URL` — added to Vercel prod/preview/dev (2026-11-27).
- [x] `DATABASE_URL_UNPOOLED` — added to Vercel prod/preview/dev (2026-11-27).
- [ ] `REDIS_URL` — missing; required for production multi-instance shared state.
- [x] `RESEND_API_KEY` — added to Vercel prod/preview/dev (2026-11-27).
- [x] `CONTACT_FROM_EMAIL` — added to Vercel prod/preview/dev (2026-11-27).
- [x] `CONTACT_TO_EMAIL` — added to Vercel prod/preview/dev (2026-11-27).
- [x] `CONTACT_EMAIL_VERIFIED=false` — set in Vercel prod/preview/dev (2026-11-27). **Do not set true without verified deployed email delivery.**
- [x] `ADS_ENABLED=false` — set in Vercel prod/preview/dev (2026-11-27).
- [x] `ADS_CMP_VERIFIED=false` — set in Vercel prod/preview/dev (2026-11-27).
- [ ] Review `LISTENER_ADMIN_TOKEN`, `PUBLIC_CACHE_TTL_SECONDS`, AdSense slot IDs, and verification vars as needed.

## Deployment parity / staging

- [ ] Deploy authorized commit to protected staging (no protection bypass).
- [ ] Verify `/admin` loads (live previously returned 404 before parity fix deployment).
- [ ] Verify admin login/logout/CSRF/RBAC/session expiry/revocation, CRUD persistence, audit logs.
- [ ] Verify contact form, listener tracking, and public directory caching on deployed environment.

## Email (hello@syntv.online)

- [x] Resend domain `syntv.online` reported verified by Resend API (2026-11-27, local check).
- [x] Public DNS records observed for Resend DKIM/send/hello tracking/MX; DMARC `p=none` present (2026-11-27).
- [x] Resend API test message accepted: HTTP 200, id `01a21dfa-e3e0-72f5-9216-5bbdc9ffbe5e` (2026-11-27).
- [ ] **Inbox receipt confirmed** in `hello@syntv.online` (human/evidence required).
- [ ] Real deployed `/contact` submission confirmed accepted and received.
- [ ] Only after deployed confirmation: set `CONTACT_EMAIL_VERIFIED=true` in secure env; redeploy; confirm public email display is intentional and correct.
- [ ] Rotate any API key exposed in chat/logs.

## SEO / content quality

- [ ] Rendered crawl/spot-check station, country, genre, and search/filter pages for thin/duplicate content.
- [ ] Confirm canonicals, robots, sitemap, structured data on deployed URL.
- [ ] Confirm Search Console ownership/verification and sitemap submission (dashboard access required).

## Accessibility / performance

- [ ] Run Lighthouse mobile+desktop on authorized deployed URL; record actual scores and LCP/CLS/INP.
- [ ] Manual WCAG 2.2 AA pass: keyboard, focus, screen reader, contrast, 200% zoom/reflow, reduced motion, mobile nav, player, forms, admin.

## Advertising / AdSense

- [ ] Keep `ADS_ENABLED=false` and `ADS_CMP_VERIFIED=false` until ready.
- [ ] Real numeric ad slot IDs configured (no placeholders).
- [ ] Google-certified CMP configured and verified for required regions.
- [ ] AdSense account/site review status confirmed in dashboard; no approval claim before evidence.
- [ ] Recheck ads.txt, AdSense meta, consent behavior after any ad enablement.
