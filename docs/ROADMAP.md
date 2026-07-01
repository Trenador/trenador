# Trenador — Roadmap & Launch Checklist

**Version:** 1.0 · **Date:** July 2026 · Companion to PRD v2.0 / Architecture v2.0

This is the **living task tracker** for Trenador: what's left before launch, the infrastructure and CI/CD work, and the post-MVP backlog. Check items off as they're done, and add newly discovered work here rather than in the PRD (the PRD holds requirements and acceptance criteria; this doc holds status). Keep it updated per `CLAUDE.md` §10.

Tiers: 🔴 blocks launch · 🟠 should fix before launch · 🟡 nice to have · 🔵 post-MVP (do not block launch).

---

## 🔴 Must Have Before Launch

**Product**
- [ ] **Privacy + Terms pages** — owned by product/legal; must be live before any real users sign up. The login page links to them and they currently 404.
- [ ] **Stripe live mode** — blocked by the business EIN; flip to live as soon as the EIN clears. Add webhook idempotency at the same time (see Architecture §7).
- [ ] **Verify email confirmation flow end-to-end** — does Resend actually send, does the callback work, and can a brand-new user complete signup → onboarding → chat?
- [ ] **Verify password reset flow end-to-end** — same question.
- [ ] **Verify the Stripe webhook** — does a completed payment actually flip `subscription_status` to `active` in the database?

**Infrastructure**
- [ ] **Branch protection on `main`** — direct pushes to `main` are happening today; enable protection so all changes go through a reviewed PR (see CI/CD & Environments below).
- [ ] **CI pipeline** — run lint, type-check, and build on every PR before merge (see below). Not set up yet.
- [ ] **Staging environment** — a dedicated Supabase project plus a Vercel staging environment (started). Verify changes on staging before promoting to production.
- [ ] **Leaked-password protection** — enable in Supabase → Auth (roughly a 30-second toggle).

**Security**
- [ ] **Verify admin routes are properly gated** — confirm the `is_admin` check on the `(admin)` surface can't be bypassed.
- [ ] **Audit `/admin` access for non-admins** — confirm what happens when a non-admin hits `/admin` (should redirect/deny cleanly, never render).

---

## 🟠 Should Fix Before Launch

**Missing pages / states**
- [ ] **`error.tsx`** — without it, a crash shows a raw Next.js error instead of a branded page.
- [ ] **Empty states** on every list page (no workouts, no threads, no coaches).
- [ ] **Loading skeletons** on all data-fetched pages.

**Code / config**
- [ ] **Replace the default `README.md`** — it still says "bootstrapped with create-next-app." Give it real setup, env-var, run, and migrate instructions.
- [x] **Project docs** — `CLAUDE.md`, PRD, Architecture, Design System, and this Roadmap are drafted. Keep them current per `CLAUDE.md` §10.
- [ ] **`NEXT_PUBLIC_APP_URL`** — verify it's set correctly in Vercel production env vars (used in the Stripe checkout redirect).

**Auth edge cases**
- [ ] **Google OAuth without completed onboarding** — if a user signs in via Google but never finishes onboarding, are they routed correctly or stuck?
- [ ] **Trial expires mid-session** — is the member gracefully redirected to `/subscribe`, or does it error?

---

## 🟡 Nice to Have Before Launch

**SEO / discoverability**
- [ ] **`robots.txt`** — currently none; crawlers can reach everything, including `/admin`.
- [ ] **`sitemap.xml`** — not critical, but good practice.
- [ ] **Per-page `<title>` tags** — everything currently just says "Trenador."

**Performance**
- [ ] **Swap `<img>` for `next/image`** on coach photos and workout banners (~28 instances; the workout library is the biggest win).

**UX**
- [ ] **Mobile-test the full signup → onboarding → first chat flow** on a real phone.
- [ ] **Test on iOS Safari specifically** — `dvh` units behave differently there.

---

## CI/CD & Environments (detail for the 🔴 infrastructure items)

Nothing here is set up yet; this is the target.

**CI pipeline (GitHub Actions, on every PR to `main`)**
- Install dependencies, then run: `npm run lint`, a type-check (`tsc --noEmit`), and `npm run build`.
- All three must pass for the PR to be mergeable.

**Branch protection on `main`**
- Require the CI checks above to pass.
- Require at least one review approval.
- Disallow direct pushes and force-pushes to `main`.
- Require branches to be up to date before merge.

**Environments**
- **Staging:** a separate Supabase project (its own database, auth, and storage) and a Vercel staging environment, each with their own env vars (test-mode Stripe, a separate `NEXT_PUBLIC_TENANT_ID`, etc.). Verify changes here before production.
- **Preview deploys:** Vercel builds a preview for every PR — use it for review.
- **Secrets:** keep all env vars in Vercel per-environment; never commit a `.env` file. Keep `.env.example` in sync with the variables listed in Architecture §6.
- **Migrations:** applied manually and reviewed as SQL — run them against staging first, then production, as part of the release.

---

## 🔵 Post-MVP Backlog (do not block launch)

- [ ] **Progress tracking & analytics on workout logs** — note: the logging + history UI is already built but hidden from the nav; the decision to *surface* it is tracked in PRD §5.7. Progress charts and analytics on top of the logs are the post-MVP part.
- [ ] **Push notifications.**
- [ ] **Full coach-facing portal.**
- [ ] **Multi-tenant support** (onboarding other gyms) — the schema is already tenant-scoped.
- [ ] **Product analytics** (who uses what, retention) — admin-facing metrics can be direct DB queries; anonymous pre-signup funnel needs PostHog.
- [ ] **Error monitoring** (Sentry or similar).
- [ ] **Coach voice in chat** — inject `coaches.system_prompt` (PRD §5.8).

---

## Biggest Risks Right Now (in order)

1. **Stripe isn't live** — no revenue is possible until it is.
2. **Email flow unverified** — if confirmation/reset is broken, users can't actually complete their accounts.
3. **Direct pushes to `main` without review** — one bad push breaks production for everyone. Branch protection + CI is the fix.
4. **Privacy/Terms 404 on the login screen** — a legal and trust problem the moment real users arrive.
