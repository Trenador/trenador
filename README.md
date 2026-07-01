# Trenador

AI fitness coaching web app for PowerhouseSoFlo (Powerhouse Gym — Miami & Fort Lauderdale). Members get an AI coach, the gym's workout library, a personal builder, and direct messaging with human coaches — all behind a 7-day free trial subscription.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| UI | React 19, Tailwind CSS v4, shadcn |
| Database | Supabase (Postgres + Auth + Storage) |
| ORM | Drizzle |
| AI | Anthropic Claude (Sonnet 4.6 for chat, Haiku 4.5 for titles) |
| Payments | Stripe |
| Rate limiting | Upstash Redis |
| Email | Resend |
| Hosting | Vercel |

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Trenador/trenador.git
cd trenador
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`. See `.env.example` for descriptions and where to get each one.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Migrations are managed with Drizzle and applied manually.

```bash
# Generate a migration after schema changes
npm run db:generate

# Inspect the database in a browser UI
npm run db:studio
```

After generating a migration, review the SQL in `src/db/migrations/`, then apply it to your Supabase project via the SQL editor.

## Project docs

| Doc | File |
|---|---|
| Product requirements | `docs/PRD.md` |
| Architecture & data model | `docs/ARCHITECTURE.md` |
| Design system | `docs/DESIGN_SYSTEM.md` |
| Launch checklist | `docs/ROADMAP.md` |

See `CLAUDE.md` for development conventions, the auth/subscription flow, and git workflow rules.

## Git workflow

All changes go through a PR — never commit directly to `main`. See `CLAUDE.md` §8 for the full rules.
