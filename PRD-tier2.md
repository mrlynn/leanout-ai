# LeanOut AI — Tier 2 PRD: Training, Retention Mechanics & Visible Progress

> Drafted: June 2026
> Status: Proposed — Phase 6
> Depends on: Phases 1–5 (Tier 1: proactive coaching + frictionless logging)

---

## Overview

Tier 1 made the app proactive and low-friction. Tier 2 attacks the two reasons fitness apps lose users between weeks 4 and 12: **nothing new to do** (gamification exhausted, nutrition loop on autopilot) and **progress feels invisible** (the scale stalls even when the body changes). Four features, in build order:

| # | Feature | One-liner | Effort |
|---|---|---|---|
| 5 | Training Module | AI-generated workout plan + in-app set/rep logging | L (2–3 weeks) |
| 6 | Streak Insurance + Weekly Quests | Keep gamification alive past badge #17 | S (2–3 days) |
| 7 | Progress Photos + AI Commentary | Side-by-side comparisons with coach narrative | M (1 week) |
| 8 | Shareable Milestone Cards | Branded share images on badges/milestones | S (2–3 days) |

**Why this order:** #5 is the biggest product gap — the app collects `trainingFrequency` and awards workout XP but offers nothing to actually *do*; it deepens the daily loop more than anything else on the roadmap. #6 is small and protects the streak mechanic that drives daily opens. #7 was already on the Phase 4 roadmap and counters scale-stall churn. #8 piggybacks on #6/#7's surfaces and is the cheapest acquisition channel available.

### Success Metrics (Phase 6 overall)

| Metric | Baseline | Target |
|---|---|---|
| D60 retention | measure at Phase 5 end | +15% relative |
| % of check-ins with `workoutCompleted` | measure now | +25% relative |
| Streak survival past first break-risk day | measure now | +30% relative |
| Progress photo upload rate (eligible users) | n/a | ≥ 35% upload ≥ 2 photos by week 8 |
| Share card exports / month | n/a | instrument; ≥ 10% of milestone events |

---

## Feature 5 — Training Module

### Problem

LeanOut AI is a physique app that doesn't tell anyone how to train. We ask for `trainingFrequency` at onboarding, award +10 XP for `workoutCompleted`, and the coach discusses training in the abstract — but there is no plan, no today's-workout, no record of what was lifted. Users run a second app (Strong, Hevy, a spreadsheet) for half their physique journey.

### Goals / Non-Goals

**Goals:** a generated plan matched to the user's goal, frequency, and equipment; a "today's workout" surface in the daily loop; simple set/rep/weight logging; coach awareness of training data.

**Non-Goals (v1):** exercise video hosting (link out to YouTube search or a licensed library later), velocity/1RM analytics, plate calculators, social workout feeds, custom plan building from scratch (template-edit only).

### User Stories

- As a user, after a short training questionnaire I receive a weekly split (e.g., 4-day upper/lower) matched to my goal, experience, equipment, and `trainingFrequency`.
- As a user, the dashboard shows **Today's Workout**; I tap in, see exercises with target sets × reps, log my actual sets and weights with minimal taps, and finish — which sets `workoutCompleted` on today's check-in automatically.
- As a user, last session's weights pre-fill this session's inputs, and the app nudges progression ("last time: 3×8 @ 135 — try 140").
- As a user, the AI coach knows what I lifted ("your squat is up 20 lbs in 6 weeks").

### Onboarding Addition (training questionnaire)

New optional step (also reachable from Settings → Training): experience level (`beginner | intermediate | advanced`), equipment (`full_gym | dumbbells_only | home_minimal | bodyweight`), days/week (defaults from existing `trainingFrequency`), injuries/exclusions (free text), session length preference.

### Plan Generation

Same pattern as meal plans: LLM in JSON mode, constrained prompt, validated server-side.

- **Model:** Claude (`claude-sonnet-4-6`) JSON mode — training programming is reasoning-heavy and benefits from the same model the coach uses for consistency of advice.
- **Prompt constraints:** split structure must match days/week; exercise selection restricted to a server-side **exercise whitelist** (~250 exercises with id, name, muscle groups, equipment tags) shipped as static data in `src/lib/exercises.ts`. The LLM picks from the whitelist by id — it never free-texts exercise names. This eliminates hallucinated/unsafe exercises and makes logging data clean.
- **Validation:** every returned exercise id must exist in the whitelist and match the user's equipment; per-session volume sanity bounds (4–8 exercises, 10–28 working sets); reject + retry once on violation, then fall back to a static template for that split.
- **Progression rules are deterministic** (mirroring the Tier 1 "LLM never invents numbers" principle): double-progression defaults (add reps to top of range, then add weight) computed in `src/lib/progression.ts` from logged history — the plan stores rep ranges, the app computes suggested loads.

### Data Models

```ts
// TrainingPlan
{
  userId, createdAt, active,
  daysPerWeek, split,              // "full_body" | "upper_lower" | "ppl" | "custom"
  experience, equipment, sessionLengthMin,
  days: [{
    dayLabel,                      // "Upper A"
    exercises: [{
      exerciseId,                  // FK into static whitelist
      sets, repRangeMin, repRangeMax,
      restSec, notes?,
    }]
  }]
}
// Index: { userId, active }

// WorkoutSession
{
  userId, date,                    // "YYYY-MM-DD"
  planDayLabel,
  exercises: [{
    exerciseId,
    sets: [{ reps, weightLbs, rpe? }],
  }],
  durationMin?, completed,
}
// Index: { userId, date }
```

### API

| Method | Route | Description |
|---|---|---|
| GET | `/api/training-plan` | Active plan (+ `?history=true`) |
| POST | `/api/training-plan` | Generate plan from questionnaire (LLM), validate, store |
| PATCH | `/api/training-plan` | Swap an exercise (whitelist-constrained), edit sets/reps |
| GET | `/api/workout` | Sessions (`?date=`, `?limit=`); includes progression suggestions |
| POST | `/api/workout` | Create/upsert today's session |
| PATCH | `/api/workout` | Update sets mid-session (autosave) |
| POST | `/api/workout/complete` | Mark complete → sets `workoutCompleted: true` on today's check-in (creating a partial check-in if none exists, consistent with Tier 1 F4.4), awards workout XP |

### UI

- **`/training` page** (new nav item): plan overview (week grid), today's workout CTA, history list.
- **Session view:** one exercise per card, set rows with reps/weight steppers, pre-filled from last session, rest timer (client-side), progression hint line. Autosaves via PATCH every set completion — closing mid-workout loses nothing.
- **Dashboard:** "Today's Workout" card showing the day label and exercise count; completed state turns the existing workout XP moment into a richer celebration.
- **Mobile-first:** this surface is used standing in a gym; big touch targets, no hover-dependent UI, steppers over keyboards.

### Coach Integration

Extend the coach system prompt (Tier 1 F1 pattern) with a training summary: active split, last 7 sessions (day labels + completion), and top-3 lift trends (best set per key exercise over 6 weeks, computed deterministically). Token budget: ≤ 400 tokens.

### Gamification

| Action | XP |
|---|---|
| Complete a workout session (replaces flat +10) | +10 |
| All planned sessions completed in a week | +25 |
| First PR on a lift (computed from history) | +10 (badge: "PR Machine" at 10 PRs) |
| Generate first training plan | +10 (badge: "Programmed") |

### Acceptance Criteria

- A `dumbbells_only` user's generated plan contains zero barbell/machine exercises (whitelist tag enforcement, not prompt hope).
- Logging a session and tapping Complete sets `workoutCompleted` on today's check-in; the check-in form reflects it without a manual toggle.
- Last session's weights pre-fill; a user who hit the top of a rep range sees a load-increase suggestion.
- Plan generation failure (2 LLM attempts) silently falls back to the static template — user always gets a plan.
- Coach can answer "how's my bench progressing?" with real numbers.

---

## Feature 6 — Streak Insurance + Weekly Quests

### Problem

Streaks drive daily opens until the first miss — then the sunk-cost flips and users churn ("streak's dead anyway"). Separately, with all 17 badges earnable in ~3 months, the XP system goes quiet exactly when retention risk peaks.

### Requirements — Streak Freeze

- **F6.1** — Users hold up to **2 streak freezes**. One granted free on the 1st of each month (if below cap); additional freezes purchasable with XP (200 XP) from a new Rewards section on the progress page. *XP spend does not reduce level progress — levels derive from lifetime XP; spending uses a separate `xpSpendable` balance accrued 1:1 alongside lifetime XP.*
- **F6.2** — **Auto-application:** when a check-in is submitted after exactly one missed day and the user holds a freeze, the freeze is consumed automatically and the streak continues. The celebration overlay says so explicitly ("Streak freeze used — 14 days alive!"). No user action required at the moment of risk — that's the point.
- **F6.3** — A freeze covers **one** missed day; two consecutive misses break the streak regardless. Freezes don't extend the streak count (the missed day contributes no increment) and don't award the missed day's XP.
- **F6.4** — `longestStreak` accounting unchanged; freeze-bridged streaks count as continuous.

### Requirements — Weekly Quests

- **F6.5** — Every Monday, each user gets **3 quests** drawn from a server-side quest pool, parameterized by their data (see table). Quests render on the dashboard (compact) and progress page (detailed with progress bars).
- **F6.6** — Quest pool v1 (deterministic selection: one nutrition, one activity, one engagement; difficulty scaled to the user's trailing 4-week averages so quests are stretch-but-achievable):

| Quest | Completion rule | XP |
|---|---|---|
| Protein Pro | Hit ≥ 90% protein target on N days (N = 4 or 5) | +30 |
| Step It Up | ≥ step target on N days | +25 |
| Full Logger | Log ≥ 2 meals on 6 days | +25 |
| Iron Week | Complete all planned workouts (requires Feature 5) | +35 |
| Early Bird | Check in before noon on 5 days | +20 |
| Clean Sweep | Compliance ≥ 8 every logged day | +30 |
| Weigh Steady | ≥ 5 weigh-ins this week | +20 |
- **F6.7** — Quest progress is **evaluated lazily** on check-in POST, food-log POST, and workout completion (no cron, consistent with Tier 1's lazy-generation principle). Completion fires inside the existing celebration overlay.
- **F6.8** — Expired incomplete quests vanish silently — no failure states, no guilt UI.

### Data Models

```ts
// User additions
{
  xpSpendable: number,             // default 0; accrues 1:1 with xp
  streakFreezes: number,           // default 0, max 2
  lastFreezeGrantMonth?: string,   // "YYYY-MM"
}

// QuestAssignment
{
  userId, weekStart,
  quests: [{
    questId, params: {},           // e.g. { days: 5, threshold: 0.9 }
    progress: number, target: number,
    completedAt?: Date, xpAwarded: boolean,
  }]
}
// Index: { userId, weekStart } unique
```

### API

| Method | Route | Description |
|---|---|---|
| GET | `/api/quests` | Current week's quests + progress (lazily assigns on first call each week) |
| POST | `/api/rewards/freeze` | Buy a freeze with `xpSpendable` (validates cap + balance) |
| GET | `/api/gamification` | *Extended:* now also returns `xpSpendable`, `streakFreezes`, active quests summary |

### Acceptance Criteria

- Miss Tuesday, check in Wednesday holding a freeze → streak continues, freeze count decrements, overlay announces it.
- Miss Tuesday + Wednesday → streak resets even with 2 freezes held.
- Quest difficulty params differ between a 6k-steps/day user and a 12k-steps/day user.
- Buying a freeze reduces `xpSpendable` but not level/`xp`.
- Quest evaluation adds no new scheduled infrastructure (verified: no cron entries).

---

## Feature 7 — Progress Photos + AI Commentary

### Problem

The scale is a lagging, noisy signal; visible change is the real motivator — and the thing users can't see day-to-day. This was a Phase 4 roadmap item; Tier 2 ships it with the coach attached. This is also the app's most sensitive feature: photos of users' bodies at their most self-critical. Privacy and tone are requirements, not polish.

### Requirements

- **F7.1** — Photo capture/upload on a new **Photos tab of the progress page**: front / side / back poses, guided overlay (silhouette + same-spot/same-lighting tips). Client-side resize (reuse `src/lib/imageResize.ts`) to ≤ 1280px before upload.
- **F7.2** — **Storage:** Vercel Blob, private access; objects keyed `progress-photos/{userId}/{date}-{pose}.jpg`; served only via short-lived signed URLs from an authenticated route. Photos are **never** sent to any third party except the vision call in F7.4, and that requires explicit per-comparison opt-in.
- **F7.3** — **Compare view:** pick any two dates (default: earliest vs. latest), side-by-side with synchronized pose tabs, date + weight-at-date captions, swipe/slider on mobile.
- **F7.4** — **AI commentary (opt-in per comparison):** "Get coach's take" button sends the two images to Claude vision with weight/measurement context. Output is encouragement-focused: 2–3 observed changes, framed positively, tied to the user's logged effort ("12 weeks of 85% compliance shows in the midsection"). 
  - **Tone guardrails (prompt-enforced + reviewed):** never comment negatively on the *earlier* photo; never estimate body fat from photos; never comment on features unrelated to composition; if change is genuinely imperceptible, pivot to objective data (weight trend, lift PRs) and normalize the timeline — *never* fabricate visible progress.
  - Vision calls are ephemeral (images not retained by the API call, consistent with the food-recognition pattern).
- **F7.5** — Reminder cadence: gentle dashboard prompt every 14 days ("photo day"), dismissible, off-switch in settings. Photos are never required for any feature, quest, or badge beyond F7.6's first-photo badge.
- **F7.6** — Deletion is immediate and hard (blob + DB record). Account deletion cascades.

### Data Model

```ts
// ProgressPhoto
{
  userId, date,                    // "YYYY-MM-DD"
  pose,                            // "front" | "side" | "back"
  blobKey, width, height,
  weightLbsAtDate?,                // snapshot from nearest check-in ±3 days
}
// Index: { userId, date, pose } unique
```

### API

| Method | Route | Description |
|---|---|---|
| GET | `/api/photos` | List user's photos (metadata + signed URLs, 15-min expiry) |
| POST | `/api/photos` | Upload (multipart), resize-validated, returns record |
| DELETE | `/api/photos?id=` | Hard delete blob + record |
| POST | `/api/photos/compare` | Body `{ beforeId, afterId }` → Claude vision commentary (not persisted v1) |

### Gamification

First photo set: +15 XP (badge: "Baseline"). Deliberately nothing else — photo cadence must never feel like a streak obligation.

### Acceptance Criteria

- Photos are inaccessible without auth (direct blob URL guess fails; signed URL expires).
- Comparison commentary on near-identical photos contains no fabricated change claims (spot-check eval set of 10 same-photo pairs before launch).
- Delete removes the blob (verified by subsequent signed-URL 404).
- Upload → compare → commentary works end-to-end on mobile Safari (camera capture path).

---

## Feature 8 — Shareable Milestone Cards

### Problem

Every badge unlock and weight milestone currently dies in a private overlay. Word-of-mouth is the only acquisition channel that's free, and fitness milestones are among the most-shared personal content that exists.

### Requirements

- **F8.1** — **Share moments:** badge unlocks, level-ups, streak milestones (7/30/100), weight milestones (every 5 lbs toward goal), quest sweeps (all 3 in a week), and lift PRs (with Feature 5). The existing `CheckInCelebration` overlay and the new quest/PR celebrations gain a "Share" button.
- **F8.2** — **Card generation: server-side** via `@vercel/og` (satori) at `/api/share-card?type=&id=` — returns a 1080×1350 PNG (and 1080×1920 story variant via `&format=story`). Server-side rendering keeps cards pixel-identical across devices and lets us evolve designs without client releases.
- **F8.3** — **Card content:** milestone headline, key stat, user first name (optional toggle), date, app branding + QR/link footer. **Never on a card:** weight *values*, body photos, or any health metric — only deltas and achievements ("−15 lbs" allowed as an explicit user toggle, default off; "212 lbs" never).
- **F8.4** — **Share flow:** Web Share API (`navigator.share` with file) where available → native share sheet; fallback = download + copy-link. No social SDKs, no tracking pixels.
- **F8.5** — Card designs use the design system: `.gradient-orange` hero treatment, `.stat-number-lg` typography, dark-navy variant for streak cards. 4–5 templates v1.
- **F8.6** — Instrument: card generated, share invoked, (if link used) UTM-tagged landing visits.

### Acceptance Criteria

- Badge unlock → Share → native share sheet opens with an attached image on iOS Safari and Android Chrome.
- Generated card for a weight milestone shows the delta only; absolute weight appears in zero templates.
- Card renders correctly with long names and the longest badge title (truncation rules defined).
- `/api/share-card` requires auth and only renders the requesting user's milestones.

---

## Cross-Cutting

### Privacy & Data

- Progress photos: private blob storage, signed URLs, per-comparison opt-in for AI vision, hard delete. Add photos and training data to the (future) export/delete flow alongside Tier 1's weekly reviews.
- Share cards are user-initiated only; no milestone is ever auto-posted anywhere.
- New env vars: `BLOB_READ_WRITE_TOKEN` (Vercel Blob).

### Nav & Surface Changes

- New sidebar/tab item: **Training** (Feature 5).
- Progress page gains tabs: Charts (existing) / Photos (F7) / Achievements (existing grid + quests + rewards shop).
- Dashboard card stack order: Weekly Review (Tier 1) → Today's Workout → Quests (compact) → GamificationCard → existing stats.
- Mobile bottom tab bar is at capacity (5 items) — Training replaces nothing; it goes under a "More" pattern **or** check-in moves into the dashboard as a card. Decide in design review before Feature 5 UI work.

### New Badges Summary

"Programmed", "PR Machine", "Baseline", plus quest-related meta-badges ("Quest Sweep ×5"). Total badge count: 17 → 22.

### Rollout

1. Feature 6 first despite build order being driven by Feature 5's length — it's 2–3 days, protects existing engagement, and its quest pool gains the "Iron Week" quest when Feature 5 lands. (Sequencing: 6 → 5 → 7 → 8.)
2. Feature 5 behind a flag to internal users for 2 weeks — validate whitelist coverage and plan quality across all equipment tiers.
3. Feature 7 launches with the vision-commentary eval (10 same-photo pairs) passed; tone prompt reviewed.
4. Feature 8 ships last; templates A/B-tested on share rate.

### Out of Scope (explicitly)

- Exercise video content / licensing.
- Social feeds, friends, leaderboards (evaluate after share-card data).
- Coach-facing admin / B2B view (still Tier 3).
- Restaurant mode (Tier 3).
- Paid subscriptions / freeze purchases with real money — XP economy only.