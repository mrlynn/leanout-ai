# LeanOut AI — Product & Engineering Reference

> Last updated: June 2026  
> Status: Phases 1–5 complete; Phases 6–9 backlog tracked in [Roadmap & TODOs](#roadmap--todos)

---

## What It Is

LeanOut AI is a personalized physique coaching web app. Users enter their body stats and goal, receive calculated calorie and macro targets, get a 7-day AI-generated meal plan, log food intake (photo recognition, manual entry, or quick-log from meal plan), log daily check-ins, track progress with charts, and chat with an AI coach powered by Claude. A gamification layer (XP, levels, streaks, badges) drives daily engagement.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) | React 19, TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui | Custom orange design system in `globals.css` |
| Database | MongoDB (Atlas) | Mongoose ODM |
| Auth | NextAuth.js v5 (Auth.js beta) | JWT strategy, credentials provider |
| AI — Coach | Anthropic Claude (`claude-sonnet-4-6`) | Streaming via `@anthropic-ai/sdk` |
| AI — Meal Plans | OpenAI GPT-4o | JSON mode, `openai` SDK |
| AI — Food Recognition | OpenAI GPT-4o (vision) | Ephemeral image analysis, JSON mode; images not stored |
| Charts | Recharts | Progress page |
| Icons | Lucide React | |
| Deployment | Vercel (recommended) | |

---

## Running Locally

```bash
# Install
npm install

# Start dev server (npm run dev is broken due to bin symlink issue — use this instead)
node node_modules/next/dist/bin/next dev

# Type check
node node_modules/typescript/bin/tsc --noEmit

# Production build
node node_modules/next/dist/bin/next build
```

### Required Environment Variables

Create `.env.local` in the project root:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>
AUTH_SECRET=<random 32-byte base64 string — run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
# Optional — enables Pro checkout when all set (BILLING_ENABLED=false to force-disable)
STRIPE_SECRET_KEY=sk_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_ANNUAL=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
# Optional
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
USDA_FDC_API_KEY=...          # defaults to DEMO_KEY
BLOB_READ_WRITE_TOKEN=...     # progress photo Blob storage
PUSH_SERVER_KEY=...           # FCM for native push delivery
RESEND_API_KEY=...            # password reset + Pro email reminders
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/               # Unauthenticated pages (no sidebar)
│   │   ├── login/
│   │   └── register/
│   ├── (app)/                # Authenticated pages (sidebar via layout.tsx)
│   │   ├── layout.tsx        # Renders <AppNav> + offsets content for sidebar
│   │   ├── dashboard/
│   │   ├── onboarding/
│   │   ├── meal-plan/
│   │   ├── food-log/         # Food diary: photo recognition, manual, meal-plan quick-log
│   │   ├── check-in/
│   │   ├── progress/
│   │   └── coach/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── check-in/             # GET, POST (create/upsert), PATCH (edit)
│   │   ├── coach/                # POST — Claude streaming chat
│   │   ├── gamification/         # GET — XP, level, streak, badges
│   │   ├── meal-plan/            # GET (latest), POST (generate via GPT-4o)
│   │   ├── food-log/             # GET, POST, PATCH, DELETE — daily food diary
│   │   │   └── recognize/        # POST — GPT-4o vision preview (no persistence)
│   │   └── user/
│   │       ├── macros/           # GET — calculated calorie+macro targets
│   │       ├── me/               # GET — current user profile (no password)
│   │       ├── onboarding/       # POST — save onboarding form
│   │       ├── register/         # POST — create account
│   │       └── stats/            # GET — weight, goal weight, weeks to goal
│   ├── globals.css           # Design system: orange theme, card shadows, stat typography
│   ├── layout.tsx            # Root layout: Geist font
│   └── page.tsx              # Redirects → /dashboard or /login
├── components/
│   ├── AppNav.tsx            # Desktop sidebar + mobile bottom tab bar
│   ├── CheckInCelebration.tsx # XP/badge reward overlay shown after check-in
│   ├── GamificationCard.tsx  # Dashboard widget: level, streak, XP bar
│   ├── FoodLogReview.tsx     # Shared review/edit form before saving food entries
│   └── ui/                   # shadcn components
├── lib/
│   ├── auth.ts               # Full NextAuth config (uses mongoose — server only)
│   ├── auth.config.ts        # Edge-safe NextAuth config (no mongoose) — used by proxy.ts
│   ├── awardXP.ts            # Server function: compute + persist XP/badges after check-in
│   ├── calculator.ts         # Mifflin-St Jeor BMR, physique calc, macro engine
│   ├── gamification.ts       # Badge definitions, XP thresholds, level math
│   ├── foodLog.ts            # Food log helpers: totals, validation, date formatting
│   ├── imageResize.ts        # Client-side image resize before vision API
│   ├── mongodb.ts            # Mongoose connection with global cache (dev HMR safe)
│   └── utils.ts              # shadcn cn() helper
├── models/
│   ├── User.ts               # User schema (profile + gamification fields)
│   ├── DailyCheckIn.ts       # Daily log (weight, steps, scores, workout)
│   ├── FoodLogEntry.ts       # Food diary entries (per meal/snack)
│   └── MealPlan.ts           # 7-day plan + grocery list
└── proxy.ts                  # Next.js 16 route protection (renamed from middleware.ts)
```

---

## Auth Architecture

NextAuth v5 requires splitting config in two because Next.js 16 runs `proxy.ts` (formerly `middleware.ts`) in the **edge runtime**, which cannot import Node.js modules like mongoose.

- **`auth.config.ts`** — edge-safe config: `authorized` callback, JWT/session callbacks, empty `providers: []`. Used by `proxy.ts`.
- **`auth.ts`** — full config: spreads `authConfig`, adds the Credentials provider (which imports mongoose). Used only in API routes and server components.

---

## Data Models

### User

```ts
{
  name, email, password,          // auth
  age, sex, heightInches,         // body stats
  weightLbs, bodyFatPercent,
  activityLevel, trainingFrequency,
  goalType,                        // "lose_fat" | "maintain" | "build_muscle"
  goalDate, vacationDate,
  foodPreferences, allergies, supplements, onTRT,
  onboardingComplete,
  // Gamification
  xp, currentStreak, longestStreak,
  lastCheckInDate, earnedBadges[],
  startingWeightLbs,               // set on first check-in for weight-loss badges
}
```

### DailyCheckIn

```ts
{
  userId, date,
  weightLbs, steps,
  hunger, energy, compliance,     // 1–10 scores
  workoutCompleted, notes,
}
// Index: { userId, date }
```

### MealPlan

```ts
{
  userId, startDate,
  calories, protein, carbs, fat,  // targets used at generation time
  days: [{
    day, totalCalories, totalProtein, totalCarbs, totalFat,
    meals: [{ name, foods: [{ item, quantity, calories, protein, carbs, fat }], totals }]
  }],
  groceryList: { protein[], vegetables[], fruits[], carbs[], condiments[] }
}
```

### FoodLogEntry

```ts
{
  userId, date,                    // date: "YYYY-MM-DD"
  mealType,                        // "breakfast" | "lunch" | "dinner" | "snack"
  source,                          // "vision" | "manual" | "meal_plan"
  foods: [{ name, quantity, calories, protein, carbs, fat }],
  notes?,
}
// Index: { userId, date }
```

---

## Core Logic

### Physique Calculator (`src/lib/calculator.ts`)

1. **Lean body mass** = `weight × (1 - bodyFat%)`
2. **BMR** via Mifflin-St Jeor (lbs/inches converted to kg/cm)
3. **Maintenance calories** = BMR × activity multiplier (1.2–1.9)
4. **Goal weight** = LBM ÷ (1 - goalBodyFat%)
5. **Target calories** = maintenance − deficit (lose_fat) or maintenance + 300 (build_muscle)
6. **Weekly loss rate** = min(1 lb, 1% of bodyweight) / week

### Macro Engine

- Protein: 1.3g × LBM lbs
- Fat: 25% of target calories ÷ 9
- Carbs: remaining calories ÷ 4

### AI Coach (`src/app/api/coach/route.ts`)

Builds a system prompt containing: full user profile, calculated physique + macros, last 14 check-ins summarized (avg weight, avg compliance, weight trend delta). Streams Claude's response token by token to the client.

### Gamification (`src/lib/gamification.ts`, `src/lib/awardXP.ts`)

XP per check-in:

| Action | XP |
|---|---|
| Check-in submitted | +10 |
| Compliance ≥ 8 | +5 |
| Perfect compliance (10) | +5 bonus |
| Workout logged | +10 |
| Steps ≥ 10,000 | +5 |
| 7-day streak milestone | +25 |
| Badge unlocked | badge.xpReward |

Level thresholds: Level N requires `Σ(50 + i×50)` for i = 1..N−1 XP (Level 2 = 100, Level 3 = 250, Level 4 = 450, …).

17 badges across streaks, compliance, workouts, steps, weight loss, and program milestones.

---

## API Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/user/register` | No | Create account (bcrypt, 12 rounds) |
| GET | `/api/user/me` | Yes | Current user profile, no password |
| POST | `/api/user/onboarding` | Yes | Save onboarding form, set `onboardingComplete: true` |
| GET | `/api/user/macros` | Yes | Live calorie + macro targets from profile |
| GET | `/api/user/stats` | Yes | Weight, goal weight, weeks to goal |
| GET | `/api/check-in` | Yes | Last N check-ins (`?limit=14`) |
| POST | `/api/check-in` | Yes | Upsert today's check-in, award XP/badges, return `{ checkIn, reward }` |
| PATCH | `/api/check-in` | Yes | Edit past check-in by `{ id, ...fields }` |
| GET | `/api/meal-plan` | Yes | Fetch latest stored meal plan |
| POST | `/api/meal-plan` | Yes | Generate 7-day plan via GPT-4o, store + return |
| POST | `/api/coach` | Yes | Streaming Claude chat — body: `{ messages }` |
| GET | `/api/gamification` | Yes | XP, level, streak, all badges with earned status |
| GET | `/api/food-log` | Yes | Entries + daily totals (`?date=YYYY-MM-DD`, default today) |
| POST | `/api/food-log` | Yes | Create food log entry, return `{ entry, totals }` |
| PATCH | `/api/food-log` | Yes | Edit entry by `{ id, ...fields }`, return updated totals |
| DELETE | `/api/food-log` | Yes | Delete entry by `?id=`, return updated totals |
| POST | `/api/food-log/recognize` | Yes | GPT-4o vision preview from base64 image — not persisted |
| POST | `/api/food-log/voice` | Yes | Voice-parse food entry via GPT |
| GET | `/api/food-log/barcode` | Yes | Open Food Facts barcode lookup |
| GET | `/api/food-log/search` | Yes | USDA FDC + Open Food Facts + user recents |
| GET/POST/DELETE | `/api/food-log/saved-meals` | Yes | Reusable meal templates |
| GET/POST | `/api/workout/plan` | Yes | AI workout plan CRUD |
| POST | `/api/workout/generate` | Yes | Generate workout plan (Claude) |
| GET/POST | `/api/workout/session` | Yes | Session logging, pre-fill, PR detection |
| GET | `/api/coach/brief` | Yes | Dashboard proactive coach brief |
| GET | `/api/quests` | Yes | Weekly quests |
| POST | `/api/rewards/freeze` | Yes | Buy streak freeze with XP |
| GET/POST/DELETE | `/api/progress/photos` | Yes | Progress photos (pose-aware) |
| POST | `/api/progress/photos/compare` | Yes | Opt-in AI photo commentary (Claude vision) |
| GET/POST | `/api/pro/weekly-review` | Pro | Weekly AI review |
| GET/POST | `/api/pro/macro-adjustment` | Pro | Adaptive macro suggestions + apply |
| GET/POST | `/api/pro/accountability` | Pro | Partner share link |
| GET/POST | `/api/billing/*` | Yes | Stripe checkout/portal/webhook (when configured) |
| POST | `/api/auth/forgot-password` | No | Password reset email |
| POST | `/api/auth/reset-password` | No | Set new password with token |
| GET | `/api/auth/providers` | No | OAuth availability (`google`) |
| GET | `/api/user/export` | Yes | JSON data export |
| POST | `/api/user/health-sync` | Yes | Steps/weight from wearables |
| POST | `/api/user/push-token` | Yes | Register native push token |

---

## Feature Status

### Phase 1 ✅ Complete
- Email/password auth (register, login, JWT sessions)
- 4-step onboarding wizard with live physique + macro preview
- Physique calculator (BMR, goal weight, timeline)
- Macro engine (protein/carb/fat targets)
- Dashboard with calorie target, body composition, macro bars

### Phase 2 ✅ Complete
- 7-day meal plan generator (GPT-4o, JSON mode, macro-constrained prompt)
- Week view — all 7 days visible simultaneously, tap meal for detail overlay
- Stale plan detection — warns if stored plan doesn't match current calorie target
- Grocery list — interactive checkboxes, progress bar, localStorage persistence
- Daily check-in (weight, steps, hunger/energy/compliance scores, workout toggle)
- Check-in history with inline editing (PATCH route, expand-in-place form)

### Phase 3 ✅ Complete
- Progress dashboard: weight trend (area chart + goal projection line), weekly averages table, adherence/energy dual-line chart, steps chart
- AI Coach: streaming Claude chat, system prompt pre-loaded with full user profile + 14-day check-in history
- Gamification: XP system, 17 badges, streak tracking, level progression, post-check-in celebration overlay, achievements grid on progress page

### Phase 4 ✅ Complete
- Food diary: photo, voice, barcode, manual, meal-plan quick-log, saved meals
- Food search: USDA FDC + Open Food Facts + user recents
- Progress photos: pose-aware upload (front/side/back), swipe compare, opt-in AI commentary
- Pro weekly review + macro adjustments (Stripe-gated when billing configured)
- Workout module: AI plan generation, session logging with pre-fill, rest timer, RPE, PR detection
- Gamification extensions: weekly quests, streak freezes, shareable milestone cards on celebrations

### Phase 5 ✅ Complete (launch hardening)
- **Billing** — Stripe auto-enables when `STRIPE_*` env vars set; tighter free tier limits; Pro unlocks unlimited coach + weekly review
- **Adaptive targets** — Dashboard hero card with expenditure estimate, plateau detection; Pro one-tap apply
- **Mobile** — PWA manifest, install banner, Capacitor shell in `mobile/` (iOS/Android)
- **Auth & trust** — Password reset, optional Google OAuth, JSON data export
- **Health sync** — `/api/user/health-sync` + check-in Health Sync button (native bridge in Capacitor)
- **Push** — Native token registration; cron reminders send push when `PUSH_SERVER_KEY` configured

---

## Roadmap & TODOs

> B2C physique launch backlog (from competitive gap analysis, June 2026).  
> Status: **done** = shipped in code · **partial** = scaffolded, needs production hardening · **todo** = not started.

### Phase 6 — Go-live (ops + distribution)

| # | Item | Status | Notes |
|---|---|---|---|
| 6.1 | Stripe live on Vercel (webhook, prices, trial) | todo | Code ready; set all `STRIPE_*` vars in prod. Verify `checkout.session.completed` → `planTier: pro`. |
| 6.2 | Capacitor App Store + Play Store submission | todo | Shell in [`mobile/`](mobile/); run `cap add ios/android`, camera + push entitlements, review assets. |
| 6.3 | App icons (192/512 PNG) for PWA + stores | todo | Manifest currently points at `favicon.ico` only. |
| 6.4 | Apple Sign-In | todo | Google OAuth shipped; Apple required for iOS App Store if any third-party login is offered. |
| 6.5 | Instrument viability metrics | todo | D7 retention, food logs/active day, check-in time, Pro conversion, stack-replacement survey. |

### Phase 7 — Daily-loop parity (beat MacroFactor + Hevy)

| # | Item | Status | Notes |
|---|---|---|---|
| 7.1 | Native HealthKit + Health Connect plugins | partial | [`src/lib/nativeBridge.ts`](src/lib/nativeBridge.ts) stub + [`/api/user/health-sync`](src/app/api/user/health-sync/route.ts); wire Capacitor health plugin in `mobile/`. |
| 7.2 | Withings / smart-scale API | todo | Auto weight on check-in without opening app. |
| 7.3 | Restaurant + branded chain food DB | todo | USDA FDC + OFF shipped; add curated chain entries or third-party restaurant API. |
| 7.4 | Food favorites (explicit save, not just recents) | todo | Search returns recents from log history; pinned favorites UI not built. |
| 7.5 | Workout supersets + drop sets | todo | Logger has sets/reps/weight/RPE/rest/PRs; no superset linking. |
| 7.6 | Workout CSV export | todo | Strong parity; export from [`WorkoutSession`](src/models/WorkoutSession.ts). |
| 7.7 | Exercise demo videos | todo | Link-out to YouTube search per exercise id acceptable for v1. |
| 7.8 | Apple Watch workout logging | todo | Requires native Capacitor watch extension or companion app. |
| 7.9 | iOS APNs push (not FCM-only) | partial | [`pushNotifications.ts`](src/lib/pushNotifications.ts) uses FCM when `PUSH_SERVER_KEY` set; add APNs for iOS tokens. |
| 7.10 | Coach training summary in system prompt | partial | Food log in prompt ✅; add lift trends + progression hints per [`PRD-tier2.md`](PRD-tier2.md) F5 coach integration. |

### Phase 8 — Retention & growth (weeks 4–12)

| # | Item | Status | Notes |
|---|---|---|---|
| 8.1 | Progress photo 14-day nudge on dashboard | todo | Upload/compare/AI commentary shipped; no dismissible “photo day” prompt. |
| 8.2 | Private Blob + signed URLs for photos | partial | [`progressPhotoStorage.ts`](src/lib/progressPhotoStorage.ts) uses public Blob when token set; migrate off base64-in-MongoDB default. |
| 8.3 | Grocery list server sync | todo | Still `localStorage` key `grocery-checked` — see Known Issues. |
| 8.4 | Social feed / workout summary cards (Hevy-style) | partial | [`ShareMilestoneCard`](src/components/ShareMilestoneCard.tsx) on badge/level-up only; no workout PR cards or public feed. |
| 8.5 | Offline workout logging | todo | Depends on Capacitor + local queue sync. |

### Phase 9 — Post-PMF (do not block launch)

| # | Item | Status | Notes |
|---|---|---|---|
| 9.1 | Micronutrient tracking (84+ nutrients) | todo | Cronometer territory; low priority for physique macro crowd. |
| 9.2 | B2B coach-facing admin dashboard | todo | Internal [`/admin`](src/app/(app)/admin/page.tsx) exists; Forge Jira panel is niche wedge only. |
| 9.3 | Social leaderboards | todo | Accountability share link may suffice early. |
| 9.4 | Web Push (non-native) | todo | Unreliable on iOS; native push is the real path. |

### Launch success criteria (B2C physique)

Track once 6.5 instrumentation is live:

| Metric | Target |
|---|---|
| D7 retention | ≥ 40% |
| Median food logs / active day | ≥ 2.5 |
| Median check-in time | < 30s (with wearable sync) |
| Workout sessions logged / week (training users) | ≥ 3 |
| Pro conversion (D30 actives) | ≥ 5% at $79/yr |
| Stack replacement (survey) | ≥ 50% dropped a paid competitor |

### Priority order (next 4–6 weeks)

1. **6.1 + 6.2** — Revenue + home-screen distribution (blocks viability claims).
2. **7.1 + 7.2** — Auto weight/steps (MacroFactor parity on check-in friction).
3. **7.3 + 7.4** — Food DB trust at restaurants and packaged goods.
4. **7.5 + 7.6** — Gym-floor parity so users delete Hevy/Strong.
5. **8.1 + 8.2** — Anti-churn at week 6–8 scale stall.

---

## Design System

The app uses a custom "clean & energetic" design system defined in `globals.css`.

**Primary color:** vivid orange (`oklch(0.65 0.22 42)` ≈ `#f97316`)

Key CSS utilities:
- `.gradient-orange` — primary orange → deep orange gradient (buttons, headers, hero sections)
- `.gradient-orange-soft` — pale orange tint (result cards, selected states)
- `.card-shadow` / `.card-shadow-md` — layered box shadows replacing Tailwind `shadow-*`
- `.stat-number` / `.stat-number-lg` — `font-weight: 800, letter-spacing: -0.04em` for big numbers

All authenticated pages share an `(app)` route group with `layout.tsx` rendering `<AppNav>` (desktop sidebar + mobile bottom tabs). The sidebar is dark navy (`--sidebar: oklch(0.13 0.01 260)`); the content area is offset `md:pl-60`.

---

## Known Issues / Engineering Notes

- **`npm run dev` is broken.** The npm bin symlink for `next` is corrupt. Always use `node node_modules/next/dist/bin/next dev` directly. This is a known Next.js 16 issue on some Node versions.
- **MealPlan calories vs. user targets.** The stored meal plan records the calorie target at generation time. If the user updates their profile stats, `mealPlan.calories` may differ from `GET /api/user/macros`. The meal plan page detects this (>50 kcal diff) and shows a "regenerate" warning banner.
- **Gamification on PATCH.** Editing a past check-in via PATCH does not re-award XP or re-evaluate badges. Only the initial POST triggers `awardXP`.
- **Edge runtime constraint.** `proxy.ts` runs in the Next.js edge runtime. Never import mongoose, bcrypt, or any Node.js built-in into `proxy.ts` or `auth.config.ts`.
- **Grocery list state.** Checked items persist in `localStorage` under the key `grocery-checked`. This is not synced to the server — it resets if the user clears browser storage or switches devices.
