# LeanOut AI — Tier 1 PRD: Proactive Coaching & Frictionless Logging

> Drafted: June 2026
> Status: Proposed — Phase 5
> Depends on: Phases 1–4 (food logging shipped)

---

## Overview

Phase 5 turns LeanOut AI from a *reactive* tool (the user must open the coach, must type their steps, must search for food) into a *proactive* coach with near-zero logging friction. Four features, in build order:

| # | Feature | One-liner | Effort |
|---|---|---|---|
| 1 | Food Log → Coach Context | The AI coach sees what the user actually ate | XS (½ day) |
| 2 | Weekly Coach Review + Adaptive Adjustments | Automated weekly analysis with one-tap plan changes | M (3–5 days) |
| 3 | Barcode Scan + Food Database Search | Log packaged foods instantly | M (3–4 days) |
| 4 | Wearable Sync (steps + weight) | Auto-fill the daily check-in | L (1–2 weeks, decision-dependent) |

**Why this order:** #1 is pure prompt engineering on existing data and is a prerequisite for #2's quality. #2 is the headline perceived-value feature. #3 fixes the weakest moment in daily use. #4 has the largest payoff but requires a platform decision (native wrapper vs. web-API integrations) that shouldn't block the others.

### Success Metrics (Phase 5 overall)

| Metric | Baseline | Target |
|---|---|---|
| D30 retention | measure now | +20% relative |
| Food log entries / active user / day | measure now | ≥ 2.5 |
| Median check-in completion time | measure now | < 30s |
| Weekly review open rate | n/a | ≥ 60% of eligible users |
| Adjustment acceptance rate | n/a | ≥ 40% of recommendations |

---

## Feature 1 — Food Log → Coach Context

### Problem

The coach's system prompt includes profile + 14 days of check-ins, but not the food diary. The user's most detailed data stream is invisible to the coach, so it can't answer the questions users most want to ask ("why am I not losing?", "what should I eat tonight?") with specifics.

### Requirements

- **F1.1** — The coach system prompt includes a **14-day food log summary**: per-day totals (kcal, P/C/F) vs. that day's targets, plus a meal-type breakdown of where protein shortfalls and calorie overages concentrate.
- **F1.2** — The summary includes **today's running totals and remaining macros**, so "what should I have for dinner?" gets a numerically grounded answer.
- **F1.3** — Days with no entries are marked `(not logged)` and excluded from averages — never treated as 0 kcal.
- **F1.4** — Summary is computed server-side in `/api/coach` at request time (no new collections, no caching for v1).
- **F1.5** — Token budget: the food summary block must stay under ~800 tokens. Aggregate per day; never include the raw `foods[]` arrays for 14 days. Include itemized foods **only for today**.

### System Prompt Addition (shape)

```
## Food Log (last 14 days)
Targets: 2,150 kcal · 165P / 200C / 60F

Date        Kcal    P    C    F    Logged meals
2026-06-09  2,310  142  228   71   B,L,D,S
2026-06-08  (not logged)
...
14-day logged-day averages: 2,205 kcal · 148P (−17 vs target) ...
Patterns: protein shortfall concentrated at breakfast (avg 18g);
weekend calories avg +14% vs weekdays.

## Today (2026-06-10) — so far
Consumed: 1,180 kcal · 88P / 110C / 35F
Remaining: 970 kcal · 77P / 90C / 25F
Items: [breakfast] oatmeal w/ whey (420 kcal, 38P) ...
```

The "Patterns" lines are computed deterministically in `src/lib/foodLog.ts` (new helpers: `summarizeRange()`, `detectPatterns()`), not by the LLM — keep the LLM's input factual.

### Engineering Notes

- New helper `getFoodLogSummary(userId, days = 14)` in `src/lib/foodLog.ts`; single indexed query on `{ userId, date }`.
- Reused by Feature 2 (weekly review) — design the return type to be serializable, not a prompt string. Prompt formatting lives in the coach route.
- No schema changes. No new endpoints.

### Acceptance Criteria

- Asking the coach "how's my protein been?" yields an answer citing actual logged numbers.
- A user with zero food logs gets a coach that doesn't hallucinate intake and instead encourages logging.
- Coach route p95 latency increase < 150ms.

---

## Feature 2 — Weekly Coach Review + Adaptive Adjustments

### Problem

Users only get insight when they ask for it. Real coaches review the week, spot stalls, and adjust the plan. This is the single feature that justifies "AI coach" as a category claim — and it operationalizes the Phase 4 roadmap item "automated plan adjustments."

### User Stories

- As a user, every Monday I see a Coach's Weekly Review: how my week went, my weight trend vs. projection, and one concrete focus for next week.
- As a user whose weight has stalled despite high compliance, I'm offered a specific adjustment (e.g., −100 kcal or +2k steps/day) and can apply it with one tap, which updates my targets and flags my meal plan as stale.
- As a user who lost faster than the safe rate, I'm told to *eat more*, with the same one-tap apply.

### How It Works

**Stage 1 — Deterministic analysis (`src/lib/weeklyAnalysis.ts`, no LLM):**

Inputs: check-ins (28 days), food log summary (14 days), current targets, goal, `vacationDate`.

Computed signals:

| Signal | Definition |
|---|---|
| `weightTrend` | Linear regression slope over last 14 days of logged weights (lbs/week) |
| `expectedRate` | From calculator: min(1 lb, 1% BW)/week (lose_fat); ±0 (maintain); +0.25–0.5 (build) |
| `complianceAvg` | Mean compliance score, last 7 days |
| `loggingRate` | % of last 7 days with ≥1 food entry |
| `intakeDelta` | Avg logged kcal − target kcal (logged days only, only if loggingRate ≥ 50%) |
| `stallDetected` | `goalType === "lose_fat"` AND |weightTrend| < 0.3 lb/wk for ≥ 2 consecutive weekly windows AND complianceAvg ≥ 7 |
| `tooFastDetected` | weightTrend < −1.5% BW/week |
| `dataInsufficient` | < 3 weigh-ins in 14 days |

Recommendation rules (v1 — deliberately conservative):

| Condition | Recommendation |
|---|---|
| `stallDetected` && intakeDelta ≤ +100 | Reduce calorie target by 100 kcal (floor: BMR × 1.05) **or** add 2,000 daily steps — user picks |
| `stallDetected` && intakeDelta > +100 | No target change; focus = adherence (intake exceeds target — the plan isn't the problem) |
| `tooFastDetected` | Increase target by 150–250 kcal |
| `dataInsufficient` | No adjustment; focus = consistent weigh-ins |
| On track | No adjustment; positive reinforcement focus |
| Within 14 days of `goalDate`/`vacationDate` | Add countdown framing; suppress calorie increases unless `tooFastDetected` |

**Hard rule: the LLM never invents numbers.** All target changes come from the rules table. Claude's job is narrative, tone, and the weekly behavioral focus.

**Stage 2 — Narrative generation (Claude, JSON mode):**

Input: the computed signals + recommendation. Output schema:

```ts
{
  headline: string,          // "Down 1.8 lbs — right on pace"
  summary: string,           // 2–3 sentences, references real numbers
  wins: string[],            // max 3
  focus: string,             // ONE behavioral focus for next week
  adjustmentRationale?: string  // only if an adjustment is recommended
}
```

### Data Model — `WeeklyReview`

```ts
{
  userId, weekStart,               // Monday, "YYYY-MM-DD"
  signals: { weightTrend, expectedRate, complianceAvg,
             loggingRate, intakeDelta, stallDetected,
             tooFastDetected, dataInsufficient },
  recommendation?: {
    type: "decrease_calories" | "increase_calories" | "increase_steps" | "none",
    calorieDelta?: number,         // signed
    stepsDelta?: number,
    status: "pending" | "applied" | "dismissed",
    appliedAt?: Date,
  },
  narrative: { headline, summary, wins[], focus, adjustmentRationale? },
  readAt?: Date,
}
// Index: { userId, weekStart } unique
```

### User Model Addition

```ts
{
  calorieAdjustment: number,       // default 0; applied on top of calculator output
  stepsTarget?: number,            // optional explicit target (default 10,000)
}
```

`GET /api/user/macros` becomes: calculator output + `calorieAdjustment`, macros re-derived from adjusted calories. This keeps the calculator pure and makes adjustments reversible/auditable.

### API

| Method | Route | Description |
|---|---|---|
| GET | `/api/weekly-review` | Latest review (`?week=` for history). Generates on-demand if the current week's review doesn't exist and ≥ 7 days of account age — **v1 is lazy generation, no cron** |
| POST | `/api/weekly-review/apply` | Body `{ weekStart, choice? }` (choice when rules offered calories-vs-steps). Sets `status: "applied"`, writes `calorieAdjustment`/`stepsTarget` to User, returns new macros |
| POST | `/api/weekly-review/dismiss` | Sets `status: "dismissed"` |

Lazy generation avoids cron/queue infrastructure on Vercel for v1; the dashboard fetch triggers it. (Phase 6: move to a Vercel Cron + push notification.)

### UI

- **Dashboard card** (above GamificationCard): unread review = orange-gradient "Your Weekly Review is ready" banner; read = compact headline.
- **Review page** (`/review` or modal): headline, summary, wins, focus, and — if recommendation pending — an adjustment card with Apply / Not now. Apply shows the before→after calorie/macro change and warns the meal plan will be flagged stale (existing stale-plan banner already handles the rest).
- Applying an adjustment awards **+15 XP** ("Coachable" — also a new badge for first applied adjustment).

### Acceptance Criteria

- A seeded user with a 3-week stall at compliance 8 receives a decrease-calories or increase-steps recommendation; applying it changes `/api/user/macros` output and trips the meal-plan stale banner.
- A user losing 2.5%BW/week receives an *increase* recommendation.
- A user with 1 weigh-in in 14 days receives no adjustment and a weigh-in-consistency focus.
- Calorie target can never be adjusted below BMR × 1.05 regardless of repeated stalls.
- Reviews are idempotent per `{ userId, weekStart }` (unique index; concurrent dashboard loads don't double-generate).

### Safety Guardrails

- Max cumulative `calorieAdjustment`: −300 kcal below calculator output without re-onboarding (prompt user to update stats instead — their BMR has likely changed).
- `tooFastDetected` always overrides stall logic.
- Narrative prompt instructs Claude to avoid shame framing on low-compliance weeks; focus is forward-looking.

---

## Feature 3 — Barcode Scan + Food Database Search

### Problem

Photo recognition shines on plated meals but is weakest on packaged foods — exactly where users log most often and where exact label data exists. Manual entry of a protein bar's macros is the most tedious moment in the app.

### Requirements

- **F3.1** — Food Log page gains two entry methods alongside the existing three: **Search** (text → database results) and **Scan** (camera → barcode → product).
- **F3.2** — Data source v1: **Open Food Facts** (free, no key, ~3M products, barcode + text search). Abstract behind `src/lib/foodDatabase.ts` with a `FoodDatabaseProvider` interface so Nutritionix/FatSecret can be swapped in if OFF coverage disappoints (decision gate: < 80% barcode hit rate in beta).
- **F3.3** — Server-side proxy routes (never call OFF from the client — CORS, rate limits, and future provider keys):

| Method | Route | Description |
|---|---|---|
| GET | `/api/food-db/search?q=` | Normalized results: `{ name, brand, servingSize, per100g: {kcal,P,C,F}, perServing?: {...}, barcode? }` |
| GET | `/api/food-db/barcode/:code` | Single product or 404 |

- **F3.4** — Barcode scanning is **client-side**: native `BarcodeDetector` API where available, `zxing-js/library` fallback. No image leaves the device for barcode flows.
- **F3.5** — Result → quantity picker (servings or grams, live macro math) → existing `FoodLogReview` component → existing `POST /api/food-log` with `source: "database"`.
- **F3.6** — **Recents & frequents**: search UI shows the user's 10 most recent and 10 most frequent database-sourced foods before any query (computed from `FoodLogEntry`, no new collection). This is the real speed win — most people eat the same 20 foods.
- **F3.7** — Cache: server-side LRU/edge cache of OFF responses, 24h TTL, keyed by barcode/query.

### Schema Change

`FoodLogEntry.source` enum gains `"database"`. Optional `foods[].barcode` and `foods[].externalId` for recents/frequents matching and future re-lookup.

### Acceptance Criteria

- Scanning a US packaged product logs it in ≤ 3 taps (scan → confirm quantity → save).
- Search returns results in < 1s p50 (cache-assisted).
- OFF being down degrades gracefully: search/scan show an error state; manual + photo + quick-log still work.
- A product with only per-100g data still yields correct macros for a gram-quantity entry.

---

## Feature 4 — Wearable Sync (Steps + Weight)

### Problem

Steps are typed by hand daily; weight requires remembering the scale number. Every manual field is a streak-killer. Auto-filled check-ins make the daily habit nearly free and make step-based recommendations (Feature 2) trustworthy.

### Platform Decision (blocking — decide before build)

| Option | Pros | Cons |
|---|---|---|
| **A. Web APIs first** (Fitbit, Oura, Withings) | Pure web, OAuth only, ships fast | Excludes Apple Health / Google Fit (most users) |
| **B. Capacitor wrapper** | Apple Health + Health Connect = majority coverage; unlocks reliable iOS push (needed for Phase 6 reminders) | App Store review overhead, native build pipeline, biggest lift |
| **C. Terra/Vital aggregator API** | One integration → all providers incl. Apple Health (via their helper app) | Per-user cost, third-party dependency, data residency review |

**Recommendation: A now, B next.** Ship Fitbit + Withings (smart scales!) in Phase 5 to validate the sync UX with minimal lift; commit to the Capacitor wrapper as its own Phase 6 epic since push notifications already require it.

### Requirements (scoped to Option A)

- **F4.1** — Settings page gains a **Connections** section: connect/disconnect Fitbit and Withings via OAuth 2.0 (PKCE). Tokens encrypted at rest (AES-256-GCM, key in env — *not* plaintext in Mongo).
- **F4.2** — Sync triggers: provider webhooks (both Fitbit and Withings support subscription/webhook APIs) + on-demand pull when the check-in page opens (staleness > 30 min).
- **F4.3** — Check-in form: steps and weight pre-filled with synced values, visibly badged with provider icon + "synced 8:14 AM". **User can always override; manual entry wins** and is stored with `source: "manual"`.
- **F4.4** — A synced weigh-in does **not** auto-create a check-in (subjective scores are the product's soul); it pre-fills. Exception: if the day ends with synced data but no check-in, store a `partial: true` check-in so charts don't gap — partials award no XP and don't extend streaks.
- **F4.5** — Disconnect purges tokens and stops sync; historical synced values remain in check-ins.

### Data Model

```ts
// New collection: WearableConnection
{
  userId, provider,                // "fitbit" | "withings"
  accessTokenEnc, refreshTokenEnc, expiresAt,
  scopes[], externalUserId,
  lastSyncAt, status,              // "active" | "revoked" | "error"
}
// Index: { userId, provider } unique

// DailyCheckIn additions
{
  stepsSource?: "manual" | "fitbit" | "withings",
  weightSource?: "manual" | "fitbit" | "withings",
  partial?: boolean,
}
```

### API

| Method | Route | Description |
|---|---|---|
| GET | `/api/connections` | List connection statuses |
| GET | `/api/connections/:provider/authorize` | Begin OAuth (redirect) |
| GET | `/api/connections/:provider/callback` | OAuth callback, store tokens |
| DELETE | `/api/connections/:provider` | Disconnect + purge tokens |
| POST | `/api/connections/webhook/:provider` | Provider webhook receiver (signature-verified) |
| POST | `/api/connections/sync` | On-demand pull for current user |

### Engineering Notes

- Webhook routes must verify provider signatures and must be excluded from auth in `proxy.ts` (edge-safe — no mongoose in the matcher logic, per existing constraint).
- Token refresh is lazy (on 401) + proactive (on sync if `expiresAt` < 10 min).
- Rate limits: Fitbit 150 req/user/hr — webhook-driven design keeps us far under.

### Acceptance Criteria

- Connecting Fitbit → opening check-in shows today's steps pre-filled within 5s.
- Withings scale weigh-in → weight appears on check-in form without user action (webhook path) within 5 min.
- Manual override of a synced value persists and is not overwritten by later syncs that day.
- Disconnecting removes tokens from the database (verified by inspection) and the Connections UI updates.
- No mongoose imports added to `proxy.ts` / `auth.config.ts`.

---

## Cross-Cutting

### Privacy & Data

- Wearable tokens encrypted at rest; new env vars: `TOKEN_ENC_KEY`, `FITBIT_CLIENT_ID/SECRET`, `WITHINGS_CLIENT_ID/SECRET`.
- Weekly reviews contain derived health data — include in any future data-export/delete flows.
- Barcode scanning processes images on-device only.

### Gamification Hooks

| Action | XP |
|---|---|
| First database/barcode log | +10 (new badge: "Scanner") |
| Apply a weekly-review adjustment | +15 (new badge: "Coachable") |
| Connect first wearable | +20 (new badge: "Plugged In") |

### Rollout

1. Feature 1 ships silently (prompt change) → verify coach quality manually.
2. Feature 2 behind a flag to internal users for 2 weeks (review correctness of stall detection against real data before exposing adjustments).
3. Feature 3 ships to all (additive, low risk); instrument barcode hit rate for the OFF decision gate.
4. Feature 4 behind a "beta" label in Settings.

### Out of Scope (explicitly)

- Cron-scheduled review generation and push notifications (Phase 6, pairs with Capacitor decision).
- Apple Health / Google Fit (Phase 6, Capacitor epic).
- Macro-level (not just calorie) adjustments from the weekly review.
- Training plan generation (separate Tier 2 epic).