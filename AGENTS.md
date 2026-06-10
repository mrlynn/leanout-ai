<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version (Next.js 16) has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LeanOut AI — Agent Rules

You are working on LeanOut AI, a physique-coaching web app (Next.js 16 App Router, React 19, TypeScript, Tailwind v4 + shadcn/ui, MongoDB/Mongoose, NextAuth v5). `PRD.md` is the source of truth for *what the product is*; this file is the source of truth for *how to work in this repo*. When they conflict on engineering practice, this file wins.

---

## Commands — use these EXACTLY

`npm run dev` is **broken** (corrupt npm bin symlink for `next`). Never use it, never try to fix it, never suggest it.

```bash
# Dev server
node node_modules/next/dist/bin/next dev

# Type check (run before declaring any task complete)
node node_modules/typescript/bin/tsc --noEmit

# Production build (run before declaring any non-trivial change complete)
node node_modules/next/dist/bin/next build
```

A change is not "done" until `tsc --noEmit` passes with zero errors.

---

## Hard constraints — violating these breaks the app

### 1. Edge runtime boundary (most common failure mode)

`proxy.ts` (Next.js 16's rename of `middleware.ts`) runs in the **edge runtime**.

- **NEVER** import `mongoose`, `bcrypt`, any model from `src/models/`, or any Node.js built-in (`fs`, `crypto`, `path`, …) into `proxy.ts` or `src/lib/auth.config.ts` — directly or transitively.
- Before adding any import to either file, trace its full dependency chain. If anything in the chain touches Node APIs, stop.
- This error often compiles locally and only fails at build/deploy. Do not trust "it runs in dev."

### 2. Auth config split — respect it, don't "simplify" it

- `src/lib/auth.config.ts` — edge-safe: `authorized` callback, JWT/session callbacks, `providers: []`. Imported by `proxy.ts`.
- `src/lib/auth.ts` — full config: spreads `authConfig`, adds the Credentials provider (imports mongoose). Use **only** in API routes and server components.
- Never merge these files. Never add a provider to `auth.config.ts`.

### 3. Secrets and env

- All secrets live in `.env.local` (`MONGODB_URI`, `AUTH_SECRET`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `NEXTAUTH_URL`). Never hardcode, never log, never import into client components.
- API keys are used only in `src/app/api/**` route handlers — never in anything marked `"use client"`.

### 4. Mongoose connection

- Always connect via `src/lib/mongodb.ts` (global-cached, HMR-safe). Never call `mongoose.connect()` anywhere else.

---

## API route conventions (`src/app/api/**`)

Every authenticated route follows the existing pattern. Match it; don't invent new shapes.

1. **Auth check first**: call `auth()` from `src/lib/auth.ts`; return `401` JSON if no session. No route handler may touch the DB before this check.
2. **Validate the request body** before writing to the DB. Reject unknown `mealType`, out-of-range scores (1–10), malformed dates, etc. with `400`.
3. **Scope every query by `userId`** from the session — never from the request body. A user must never be able to read or mutate another user's documents.
4. **Return shapes**: mutations on collections with daily totals return `{ entry, totals }` (food-log) or `{ checkIn, reward }` (check-in). New mutating endpoints on aggregable data should return the updated aggregate alongside the document so the client never needs a second fetch.
5. **Dates are strings** in `"YYYY-MM-DD"` format for daily-keyed collections (`FoodLogEntry.date`, check-in day keys). Compute "today" consistently with helpers in `src/lib/foodLog.ts` — do not roll new date-formatting logic.

---

## Data model conventions (`src/models/**`)

- Per-user, per-day collections **must** have a compound index `{ userId, date }` (see `DailyCheckIn`, `FoodLogEntry`). Any new collection queried on hot pages (dashboard, progress, food-log) must be covered by an index — no unindexed scans on user-facing paths.
- Never return the `password` field from any API. Follow the `/api/user/me` projection pattern.
- MongoDB is schemaless at the DB level: renaming or removing a schema field silently orphans existing data. Any schema field rename/removal requires an explicit migration note in the PR/summary and a fallback read path.

---

## Gamification invariants — intentional, do not "fix"

- XP and badges are awarded **only** by `awardXP` during check-in **POST**. Editing a check-in via **PATCH** deliberately does **not** re-award XP or re-evaluate badges. Do not change this without an explicit request.
- `startingWeightLbs` is set once on first check-in and never overwritten — weight-loss badges depend on it.
- Level math and XP values live in `src/lib/gamification.ts` and the table in `PRD.md`. If you change one, change the other.

---

## AI integration patterns

Three AI surfaces exist. Follow the established pattern per surface; don't cross-pollinate.

| Surface | Model | Pattern |
|---|---|---|
| Coach (`/api/coach`) | Claude `claude-sonnet-4-6` via `@anthropic-ai/sdk` | Streaming, token-by-token. System prompt = profile + macros + 14-day check-in summary. |
| Meal plans (`/api/meal-plan`) | GPT-4o, JSON mode | Macro-constrained prompt; parse defensively, retry once on malformed JSON before returning `502`. |
| Food recognition (`/api/food-log/recognize`) | GPT-4o vision, JSON mode | **Ephemeral**: images are analyzed and discarded. Never persist image data or base64 payloads to the DB or logs. Client resizes via `src/lib/imageResize.ts` before upload. |

General rules:
- Never trust model JSON blindly — validate against the expected shape before storing.
- New AI features must degrade gracefully: an AI failure returns a clear error to the client, never a crashed page or a half-written DB record.

---

## Design system — UX consistency is a hard requirement

The app has a custom orange design system in `src/app/globals.css`. New UI must use it:

- **Use** `.gradient-orange`, `.gradient-orange-soft`, `.card-shadow`, `.card-shadow-md`, `.stat-number`, `.stat-number-lg`.
- **Do not** use raw Tailwind `shadow-*` utilities or ad-hoc orange hex values/gradients. The primary is `oklch(0.65 0.22 42)` and comes from CSS variables — reference tokens, don't restate values.
- New authenticated pages go in the `(app)` route group so they inherit `<AppNav>` and the `md:pl-60` content offset. Unauthenticated pages go in `(auth)`.
- Every new page must work at mobile widths with the bottom tab bar — verify layouts at ~375px. Primary actions must be reachable one-handed (bottom half of viewport on mobile where feasible).
- Prefer existing shadcn components in `src/components/ui/` before adding new dependencies.

---

## Testing & verification expectations

- Pure logic in `src/lib/` (`calculator.ts`, `gamification.ts`, `foodLog.ts`) is the highest-value test surface — wrong macros or XP math directly damages user trust. Changes to these files require unit tests covering the changed behavior, including boundary cases (e.g., compliance = 8 vs 7, streak rollover, level thresholds).
- Before claiming completion on any task: type check passes, build passes (for non-trivial changes), and you have manually traced the user-visible flow you touched.

## Documentation sync

- Shipping a feature or endpoint **requires** updating `PRD.md`: Feature Status, API Reference table, and Data Models if schemas changed. Stale PRD = broken context for every future agent session.
- New gotchas discovered during work get added to this file (or PRD "Known Issues") — tribal knowledge in a chat transcript is lost knowledge.

## Out of scope without explicit instruction

- Do not upgrade dependencies, change the auth strategy, restructure route groups, or "modernize" patterns that look unusual — several (the auth split, the broken npm script workaround, PATCH-without-XP) are deliberate.
- Do not add new third-party services or SDKs without asking.