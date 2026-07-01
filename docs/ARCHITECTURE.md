# Trenador — Architecture Overview

**Version:** 2.0 (repo-synced) · **Date:** July 2026 · Companion to PRD v2.0
**Synced to:** repo HEAD, migrations through `0014`.

---

## 1. System Shape

Trenador is a single Next.js 16 (App Router) application on Vercel, backed by Supabase (Postgres, Auth, and Storage), with four external service dependencies: Anthropic (AI), Stripe (payments), Upstash Redis (rate limiting), and Resend (email).

```
                        ┌───────────────────────────────────────────┐
   Browser  ──────────► │  Next.js 16 on Vercel                      │
   (member / admin)     │  • (member) / (admin) / (marketing) groups │
                        │  • server actions   • /api routes          │
                        │  • proxy.ts (session refresh)              │
                        └───┬───────┬───────┬───────┬───────┬────────┘
                            │       │       │       │       │
                   ┌────────▼─┐ ┌───▼───┐ ┌─▼────┐ ┌▼──────┐ ┌▼───────┐
                   │ Supabase │ │Anthro-│ │Stripe│ │Upstash│ │ Resend │
                   │ PG+Auth+ │ │ pic   │ │      │ │ Redis │ │(email) │
                   │ Storage  │ │Claude │ │      │ │(rate) │ │        │
                   └──────────┘ └───────┘ └──────┘ └───────┘ └────────┘
```

**Two paths reach the database, and they have different security models:**
1. **App server → Postgres**, directly via `postgres-js` (using `DATABASE_URL`). This path **bypasses RLS**; authorization is enforced by the server-action guard layer.
2. **Browser / Supabase client → Postgres**, via PostgREST, Realtime, and Storage. This path **is** governed by RLS — 30+ policies, rewritten in migration 0010 to evaluate auth once per query rather than once per row.

RLS is therefore defense in depth; the primary authorization boundary is the server actions.

---

## 2. Request & Data Flow

**Auth → onboarding → app**
1. A user signs up through Supabase Auth (email/password, Google, or magic link), or an admin invites them.
2. The `handle_new_user` trigger (a `SECURITY DEFINER` function pinned to `search_path=public` and revoked from PUBLIC/REST) inserts a `members` row keyed to `auth.users.id`.
3. `proxy.ts` refreshes the session cookie on navigation.
4. Onboarding (5 steps) collects name, birth year, gender, weight, and a coach choice. `completeOnboarding()` sets `members.assigned_coach_id` and writes an `intake_submissions` row.
5. `(member)` layouts call `requireActiveSubscription()`, which uses `getAuthenticatedMember()` and `isMemberActive()`.

**Subscription gate** (`src/actions/_auth.ts`)
- `isMemberActive` returns true for admins, for members with `subscription_status === 'active'`, or for anyone within 7 days of `created_at`.
- State lives on the `members` row (`subscription_status`, `stripe_customer_id`). There's no subscriptions table and no cron.
- Stripe Checkout leads to `POST /api/stripe/webhook` (`checkout.session.completed`, `customer.subscription.updated|deleted`), which writes status onto `members`. **There's no idempotency guard yet** — a launch blocker.

**AI chat** (`POST /api/chat/stream`)
1. Parse the body (Zod), authenticate, and resolve the member row.
2. Enforce the rate limit: Upstash `INCR chat:rate:{memberId}:{UTC-date}`, capped at 30/day.
3. Load the latest intake and the last 20 messages in parallel.
4. After the second user message, schedule Haiku titling in the background via `after()`.
5. Save the user message, build the system blocks (a cached static persona plus per-member context) and the message array, and stream the response from Sonnet 4.6.
6. On completion, persist the assistant message with `model_used` and `tokens_input/output` (for cost observability), and bump `threads.last_message_at`.

**Content management** — coaches and workouts are created, edited, and published from the **admin dashboard** (`adminCreateCoach` / `adminCreateWorkout` / `adminPublishWorkout`, etc.). The initial workout library was seeded via SQL. There is no external content feed.

---

## 3. Data Model (overview)

Every table carries `tenant_id`. The core groups:

- **Tenancy & identity:** `tenants`, `members`, `member_codes` (now unused), `terms_acceptances`, `intake_submissions`.
  - `members` key fields: `auth_user_id` (unique), `is_admin`, `subscription_status`, `stripe_customer_id` (unique), `assigned_coach_id` → coaches, `member_verified_at`, and profile fields (`year_of_birth`, `gender`, `weight_lbs`).
- **Coaches:** `coaches` — `slug` (unique), `display_name`, `headline`, `bio`, `gym`, `location`, `specialties[]`, `certifications[]`, `system_prompt` (present but unused), `is_author`, `photo_url`, `active`.
- **Chat:** `threads` (`title`, `last_message_at`, `pinned_at`, `deleted_at`) and `messages` (`role`, `content`, `model_used`, `tokens_input/output`).
- **Coach messaging:** `coach_messages` (`sender_role` = member | coach, `read_at`) — a separate, strictly AI-free table.
- **Workouts (org library):** `workouts` (`category`, `level`, `muscle_groups[]`, a `structure` JSONB of weeks→days→blocks, `summary`, `length_label`, `saves_count`, `banner_url`, `published_at`, `deleted_at`), plus `workout_blocks` (the legacy flat-block path) and `exercise_catalog`.
- **Personal library:** `member_workouts` (with `source_workout_id`) and `member_workout_exercises` (targets stored in **kg**).
- **Logging:** `workout_logs`, `workout_log_exercises`, and `workout_log_sets` (weights in **lbs**).

Indexing: FK indexes were added in 0011; `members.assigned_coach_id` was indexed in 0013; `threads.pinned_at` was added in 0014.

---

## 4. AI Layer

- **Model split:** Sonnet 4.6 for chat; Haiku 4.5 for the 24-token thread titles, generated in the background via `after()`.
- **Prompt:** a single system persona (`TRENADOR_AI_SYSTEM_PROMPT`) that carries the safety boundaries — no clinical prescription, no macro targets, defer to a human coach, and specific handling for medical, eating-disorder, and crisis situations. `buildSystemBlocks()` emits a **cached** static block (`cache_control: ephemeral`, shared across all members) followed by an **uncached** per-member context block.
- **Caveat:** the per-member context is currently thin (weight, birth year, gender, coach), because onboarding dropped the richer intake. The prompt's "knows your goals, history, and body" claim currently outruns the data it actually receives. The `coaches.system_prompt` column is **not** injected into chat yet — it's schema-ready only.

---

## 5. Key Decisions & Why

| Decision | Why |
|---|---|
| Subscription state on `members`, no subscriptions table | Keeps the gate a single-row, millisecond read; the trial is computed from `created_at` with no cron. |
| App path uses `postgres-js` directly (bypassing RLS) | The app-layer guards are the real authorization boundary; RLS covers the Supabase client surface as defense in depth. |
| Content authored in the admin dashboard | Non-technical staff manage coaches and workouts in one place; the member app stays read-optimized. |
| Sonnet for chat, Haiku for titling | Titling doesn't justify a frontier model, which keeps costs down. |
| Prompt caching on the static persona block | A shared prefix across all members yields large token savings at scale. |
| Coach messaging in its own AI-free table | A hard guarantee that human messaging never routes through the model. |
| `proxy.ts` refreshes sessions only (not auth) | The Next 16 pattern; auth is enforced at the layout level for clearer boundaries. |

---

## 6. Environments & Config

- **Environment variables (non-exhaustive):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL` / `_TOKEN`, `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_ID`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_TENANT_ID`, and the Resend key. Keep `.env.example` in sync with this list.
- **Migrations** are generated by Drizzle but **applied manually** — review the SQL before running it.
- **Staging** is in progress, and **Stripe** stays in test mode until the EIN clears.

---

## 7. Known Architectural Risks (carry into the launch review)

1. The Stripe webhook has no idempotency or replay guard.
2. The AI prompt assumes intake data it no longer receives.
3. Lapsed-member UX is a hard redirect rather than a read-only view.
4. `member_codes` is dead schema, and the membership gate is currently undefined.
5. There's no error tracking or product analytics wired.
6. The kg (targets) vs. lbs (logs) unit split needs careful conversion wherever the two meet.
