# Trenador — Design System

**Version:** 1.0 · **Date:** July 2026 · Synced to `src/app/globals.css` at repo HEAD.

This documents the design language as it's actually implemented in the app — the tokens, type, shape, and component conventions Claude Code and designers should build against so the UI stays consistent. It's the product counterpart to the marketing-site UI/UX reference (the Future.co teardown), which covers the landing page specifically.

---

## 1. Design Principles

- **Editorial, not clinical.** A serif italic display voice and quiet neutral surfaces make the app feel considered rather than techy. Chrome stays quiet; content and product UI are the loudest things on screen.
- **Warm-neutral, not cold.** Surfaces are white and stone-gray, but the ink and near-blacks carry a faint warm cast (`oklch(0.18 0.012 60)`), and a single burnt-orange accent does all the pointing.
- **One accent, used sparingly.** `#D17A3A` (the logo dot) is the only brand color. Everything else is neutral. Don't introduce secondary accent colors.
- **Restraint in motion.** Fast, standard transitions and gentle reveals — nothing flashy.

---

## 2. Color Tokens

All colors are CSS custom properties in `globals.css`, exposed to Tailwind v4 through the `@theme inline` block (so `bg-background`, `text-foreground`, `border-border`, etc. all resolve to these). A `.dark` theme is defined but the app ships light.

### Surfaces & neutrals (light theme)

| Token | Value | Role |
|---|---|---|
| `--background` | `oklch(1 0 0)` (white) | Page background |
| `--card` / `--popover` | `#FFFFFF` | Card and popover surfaces |
| `--secondary` / `--muted` | `#F5F5F5` (stone-100) | Subtle fills, chips, table headers |
| `--border` | `#E5E5E5` (stone-200) | Hairline borders |
| `--input` | `#D4D4D4` (stone-300) | Form field borders |
| `--sidebar` | `#FFFFFF` | Sidebar surface |

### Ink & accent

| Token | Value | Role |
|---|---|---|
| `--foreground` / `--primary` | `oklch(0.18 0.012 60)` | Warm near-black — text, primary buttons, dark UI |
| `--primary-foreground` | `#FFFFFF` | Text/icons on primary |
| `--muted-foreground` | `oklch(0.48 0.018 60)` | Secondary text, mono labels |
| `--accent` | `#D17A3A` | Brand orange — logo dot, small highlights, icons |
| `--accent-foreground` | `#FFFFFF` | Text/icons on accent |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Errors, destructive actions |
| `--ring` | `oklch(0.6 0.04 60)` | Focus rings |

### Category gradients

Four deep 135° gradients identify workout categories on library cards, banners, and thumbnails. They're the one place the UI goes rich and dark, and they map to real `category` values — treat them as a fixed set.

| Category | Gradient |
|---|---|
| Strength | `#4A2A1C → #2A1610` (rust iron) |
| Hypertrophy | `#4A1F2A → #2A1018` (wine) |
| Cardio | `#1E3A2A → #0F1F17` (forest) |
| Mobility | `#2E2A4A → #171528` (indigo) |

---

## 3. Typography

Three faces, loaded via `next/font` and exposed as `--font-sans`, `--font-serif`, `--font-mono`.

| Role | Face | Usage |
|---|---|---|
| Body / UI | **Inter** | Default. `font-feature-settings: "ss01", "cv11"` is set globally. |
| Display | **Instrument Serif**, *italic* | Headlines and hero text, via the `.font-serif` utility (which forces italic + `0.02em` letter-spacing). Used roughly 28–44px. |
| Labels | **JetBrains Mono** | The `.label-mono` utility: 10.5px, `0.14em` letter-spacing, uppercase, muted color. Section eyebrows, stats, metadata. |

Two custom utilities to reuse rather than re-implement:
- `.font-serif` — Instrument Serif, italic, letter-spaced. The display voice.
- `.label-mono` — the uppercase mono micro-label. Add `normal-case tracking-wide` when you want the mono look without the uppercase.

---

## 4. Shape, Spacing & Motion

- **Radius:** the base token is `--radius: 0.375rem` (6px), with a scale from `--radius-sm` through `--radius-4xl`. Buttons and tags are usually full pills (`rounded-full`); cards use `rounded-xl` / `rounded-2xl`.
- **Buttons are pills.** The primary button is ink (`bg-primary text-primary-foreground`); variants are `outline`, `secondary`, and `ghost`; destructive uses the destructive token. Reuse `components/ui/button.tsx` rather than hand-rolling.
- **Photography treatment:** full-bleed imagery sits under black gradient scrims (e.g. `from-black/80 via-black/50 to-black/95`) with white text and logo on top — the standard for hero and auth screens.
- **Motion:** fast, standard transitions (roughly 150ms, ease-out) with gentle fade/translate reveals. Animation is handled by `motion`. Keep it subtle — the content does the work.
- **Admin nuance:** the `.admin-shell` scope forces `cursor: pointer` on all interactive elements.

---

## 5. Component Primitives

Shared primitives live in `src/components/ui/` (built on `base-ui/react`, shadcn-style): `button`, `dropdown-menu`, `floating-field`, `scroll-area`, `select`, `sheet`. Feature components are grouped by domain in `components/chat/`, `components/messages/`, and `components/shared/`. Toasts use `sonner`; icons use `lucide-react`.

**Conventions**
- Compose class names with `cn()` from `lib/utils` (clsx + tailwind-merge).
- Prefer an existing `ui/` primitive before adding a new dependency or hand-rolling.
- Keep the accent scarce — orange is for the logo dot, small highlights, and the send/Remix action, not for large fills.
- Use the category gradients only for workout-category surfaces, and only from the fixed four.

---

## 6. Relationship to the Marketing UI Reference

This doc governs the **product** (the app behind login). The separate UI/UX reference document (the Future.co teardown plus the Trenador brand brief) governs the **marketing site** and the Google Stitch prompts. Where they overlap — the accent, the serif-italic voice, the mono labels, the pill/scrim patterns — they should stay in lockstep; if the app's tokens change, update both. Note that the marketing brief describes an earlier warm-paper surface (`#F7F6F2`); the app has since moved to the neutral white/stone surfaces documented here, so treat the tokens in this file as authoritative for anything shipping inside the app.
