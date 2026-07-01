# Trenador — Product Requirements Document

**Version:** 2.0 (repo-synced) · **Status:** In build, pre-launch (Stripe test mode) · **Date:** July 2026
**Synced to:** repo HEAD, migrations through `0014`. This supersedes the earlier v1.4/v1.5 drafts, several of whose assumptions are now out of date (the trial is 7 days, not 14; coach assignment is back; content is managed in the admin dashboard).

---

## 1. Summary

Trenador is a members-only AI fitness coaching web app for **PowerhouseSoFlo** (Powerhouse Gym, Miami & Fort Lauderdale). Members get an always-available AI fitness guide (Claude), the gym's published workout library, a personal workout builder, and direct messaging with a human coach — all behind a subscription with a 7-day free trial. It runs as a single production tenant on a multi-tenant-ready schema.

**Positioning:** an AI coach that knows the member and the gym's own programming, backed by real Powerhouse coaches, at a fraction of the cost of human-only coaching.

---

## 2. Goals & Non-Goals

**MVP goals**
- Convert PowerhouseSoFlo members into paying subscribers through a low-friction trial.
- Make the AI chat genuinely useful and safe — real fitness guidance, not medical or clinical prescription.
- Give the gym one admin surface to manage members, coaches, and workouts, and to answer member messages.

**Non-goals (for MVP)**
- A coach-facing portal (coaches are managed by admins).
- RAG or gym-specific knowledge retrieval.
- Native mobile apps or push notifications.
- Nutrition tracking, wearables, or body-composition integration.

---

## 3. Personas

- **Member** — a PowerhouseSoFlo client on `app.trenador.com`. Wants quick answers, the gym's workouts, and a human when it matters.
- **Admin** — gym staff who manage content and members from the admin dashboard and answer member messages as a coach.
- **Coach** — a named identity a member is assigned to and can message. Represented as data and actioned by admins.

---

## 4. Current Feature Scope (as built)

| Area | Status | Notes |
|---|---|---|
| Auth (email/password, Google, magic link, reset) | Shipped | Self-serve signup plus admin invite (`adminInviteUser`) |
| Onboarding (5-step, with coach picker) | Shipped | Name, birth year, gender, weight, coach → sets `assigned_coach_id` |
| AI chat (streaming, rate-limited, pinning) | Shipped | Sonnet 4.6, 30 msgs/day, Haiku titling, prompt caching |
| Workout library (browse, filter, search) | Shipped | Managed and published from the admin dashboard |
| Workout detail | Shipped | Weeks/days/blocks, coach bio, Remix |
| My Workouts (personal builder) | Shipped | Create/edit/delete; Save/Remix from the library |
| Workout logging + history | Built, hidden | Routes live under `/log`; not yet linked in the nav |
| Coach messaging | Shipped | Member ↔ coaching team; admin inbox with reply/edit/delete |
| Coaches directory (`/coaches`) | Shipped | Member-facing browse page |
| Profile (avatar, personal info) | Shipped | Signed-URL avatars |
| Subscribe / paywall | Shipped (test mode) | Stripe Checkout plus webhook |
| Admin dashboard | Shipped | Members, coach CRUD, workout CRUD + publish, messaging |

---

## 5. Remaining Work for Launch (prioritized)

### P0 — Launch blockers

**5.1 Stripe live mode**
- *Blocked on:* the business EIN (in progress).
- *Acceptance:* live keys configured; production webhook endpoint registered; the correct price(s) purchasable from the paywall; a real card completes checkout and flips `subscription_status` to `active`.
- *Before going live:* confirm the paywall shows the agreed price (not a placeholder), add a monthly/annual selector if annual is offered, and **add webhook idempotency** — store processed `event.id`s and skip duplicates so Stripe retries don't double-apply.

**5.2 Privacy Policy and Terms of Service**
- *Owner:* product/legal owner.
- *Acceptance:* both pages are reachable and linked from signup/footer, and the `terms_acceptances` write is wired at signup (version, timestamp, IP, user agent) so acceptance is actually recorded.

**5.3 Membership eligibility gate (decision needed)**
- The member-code verification flow was removed, so `member_codes` is now unused. We need to decide how we ensure only gym members get in: admin-invite-only signup, reviving member codes, or manual admin verification after signup (`member_verified_at`).
- *Acceptance:* a documented, enforced answer, reflected in the signup path.

### P1 — Strongly wanted for a good launch

**5.4 Read-only mode for lapsed members**
- Today a lapsed member is redirected to `/subscribe` and loses sight of their own history.
- *Acceptance:* gated surfaces render read-only (writes already assert an active subscription) with an inline reactivation CTA. Trial-active members are unaffected.

**5.5 Onboarding intake vs. AI personalization (decision + fix)**
- The AI prompt assumes it knows the member's goals, injuries, and experience, but onboarding no longer collects them.
- *Acceptance:* either restore the richer intake so the AI context is real, or soften the system prompt to match what's actually captured. The prompt and the data must agree.

**5.6 Admin analytics view**
- *Acceptance:* a dashboard panel showing counts over time — signups, active vs. trialing members, remixes (`member_workouts` where `source_workout_id` is set), coach messages (by role, plus unread), AI messages and token spend, and workouts logged. These are direct database queries; no third-party analytics tool is needed for this.

### P2 — Post-launch fast-follows

- **5.7 Surface workout logging** — link `/log` in the nav once product signs off; add a plate calculator and rest timer (both client-side).
- **5.8 Coach voice in chat** — optionally let the AI speak in the assigned coach's voice using the existing `coaches.system_prompt` column.
- **5.9 Drag-and-drop builder** — reordering and cross-day moves in the personal builder.
- **5.10 Observability** — Sentry for errors, and PostHog for the marketing funnel (anonymous visitors the database never sees).

---

## 6. Out of Scope (MVP)

Coach portal · RAG / knowledge base · push and SMS · nutrition and wearables · body-composition tracking · sharing member workouts back to the library · social and community features.

---

## 7. Open Questions (need product decisions)

1. **Membership gate** — is invite-only the intended model now, or should member codes come back? (drives 5.3)
2. **Intake depth** — is the thin onboarding intentional, or is the full health intake returning? (drives 5.5)
3. **Logging** — ship `/log` to members at launch, or keep it hidden?
4. **Pricing** — final monthly and annual figures, and whether annual is offered at launch (drives the paywall and Stripe setup).
5. **Coach voice** — is per-coach `system_prompt` a real roadmap item, or leftover scaffolding to remove?

---

## 8. Success Metrics (suggested)

Trial-to-paid conversion rate; 7-day and 30-day retention; weekly active members; the share of members who log at least one workout; AI messages per active member; and coach-message response time. All of these are derivable from the database, except the pre-signup marketing funnel, which needs PostHog.
