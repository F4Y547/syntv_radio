# SYNTV RADIO Release Checklist

This checklist is for staging/production release readiness. It does not authorize deployment, DNS changes, or AdSense enablement.

## Code / local verification (evidence required)

- [x] `npm audit --omit=dev` — 0 vulnerabilities (2026-11-27)
- [x] `npx tsc --noEmit` — pass (2026-11-27)
- [x] `npm run lint` — pass (2026-11-27)
- [x] `npm run build` — pass (2026-11-27)
- [x] `npx playwright test` — 120 passed, 1 skipped, 0 failed (2026-11-27, workers:1)
- [ ] Confirm release commit deployed to staging/production; record deployed commit SHA.

## Deployment parity / staging

- [ ] Deploy authorized commit to protected staging (no protection bypass).
- [ ] Verify `/admin` loads (live previously returned 404 before parity fix deployment).
- [ ] Confirm `DATABASE_URL` configured; run Prisma migrations; bootstrap first owner with secure env vars.
- [ ] Confirm `REDIS_URL` if shared listener/rate-limit production behavior is required; test concurrent listeners/disconnect/recovery.
- [ ] Verify admin login/logout/CSRF/RBAC/session expiry/revocation, CRUD persistence, audit logs.

## Email (hello@syntv.online)

- [x] Resend domain `syntv.online` reported verified by Resend API (2026-11-27, local check).
- [x] Public DNS records observed for Resend DKIM/send/hello tracking/MX; DMARC `p=none` present (2026-11-27).
- [x] Resend API test message accepted: HTTP 200, id `01a21dfa-e3e0-72f5-9216-5bbdc9ffbe5e` (2026-11-27).
- [ ] **Inbox receipt confirmed** in `hello@syntv.online` (human/evidence required).
- [ ] Deployment env vars set securely: `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`.
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