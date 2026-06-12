# LeanOut AI — Brand Strategy

> Last updated: June 2026  
> This document is the single source of truth for brand identity, voice, visual design, and positioning. Reference it when making product, marketing, or design decisions.

---

## Mission

Make serious physique coaching accessible to everyone — not just people who can afford a personal trainer or dietitian. LeanOut AI removes the friction between knowing what to do and actually doing it every day.

---

## Brand Essence

**One sentence:** AI-powered coaching that feels like having a knowledgeable friend in your corner — not a clinical tool.

LeanOut AI sits at the intersection of science-backed nutrition and the kind of motivating, personalized guidance that used to cost hundreds of dollars a month. The product is rigorous under the hood (real physique math, real macro targets) but warm and human on the surface.

---

## Target Persona

**Primary:** The Committed Beginner-Intermediate

- Age 22–38, fitness-aware but not obsessive
- Has tried calorie tracking before — found it tedious and gave up
- Motivated by visible results, not abstract health metrics
- Uses their phone at the gym; comfortable with AI tools
- Pain points: inconsistent logging, not knowing if their plan is actually working, no one to ask "is this normal?"

**Secondary:** The Returning Athlete

- Took time off (injury, life, etc.) and is getting back on track
- Wants structure and accountability, not hand-holding
- Values data and progress visibility over gamification
- Likely to become a power user of the progress charts and AI coach

---

## Brand Values

### 1. Honest over hype
No fake transformation promises. No "lose 30 lbs in 30 days." LeanOut AI gives users real numbers based on their actual body and realistic timelines. The AI coach tells the truth, even when it's not what someone wants to hear.

### 2. Friction is the enemy
Every extra tap, search, or form field is a reason someone stops tracking. The product is relentlessly focused on reducing the effort between intent and action — photo logging, quick-log from meal plan, one-tap check-in.

### 3. Progress is personal
A 5 lb loss for a 200 lb person is different from a 5 lb loss for a 140 lb person. Targets, timelines, and coaching are always derived from the individual's stats — never generic.

### 4. Earned confidence
Gamification (XP, levels, streaks, badges) exists to reflect real achievement, not manufacture fake motivation. Every reward is tied to a behavior that actually moves the needle.

### 5. Smart, not clinical
The tone is knowledgeable and direct, not medical or academic. Think: a coach who's done the research and can explain it plainly, not a textbook.

---

## Positioning

| | LeanOut AI | MyFitnessPal | Generic AI chatbot |
|---|---|---|---|
| Food logging | Photo → instant | Manual search | Manual or imprecise |
| Coaching | Personalized, context-aware | None | Generic, no user data |
| Macro targets | Calculated from physique math | User-entered estimates | None |
| Gamification | Tied to real behaviors | Basic streaks | None |
| Feel | Energetic, personal | Utilitarian | Cold |

**Tagline options (working):**
- "Your physique. Your plan. Your AI coach."
- "Coaching that knows your numbers."
- "Snap. Log. Progress."

---

## Voice & Tone

### Voice (consistent always)
- **Direct** — says what it means without hedging. "You're in a 400-calorie deficit" not "it appears you may be eating slightly less."
- **Knowledgeable** — earns trust through accuracy, not jargon. Explains the "why" briefly when it matters.
- **Encouraging without being hollow** — celebrates real milestones, doesn't cheerlead every click. "7-day streak — that's the hardest part done" not "Amazing job!! 🎉🎉"
- **Human** — the AI coach sounds like a person, not a bot. Contractions, natural phrasing, occasional dry humor.

### Tone (adjusts by context)

| Context | Tone |
|---|---|
| Onboarding | Warm, reassuring, concise |
| Dashboard / check-in | Energetic, focused |
| AI coach conversation | Conversational, honest, supportive |
| Error states | Calm, practical, never blaming |
| Celebrations (XP, badges) | Punchy, genuine, brief |
| Marketing / TikTok | Bold, surprising, demo-first |

### Words we use
- "your plan," "your targets," "your data"
- "lean out," "cut," "build," "maintain"
- "coach," "check-in," "streak," "macro"
- "snap," "log," "track"

### Words we avoid
- "diet" (implies temporary restriction)
- "calories burned" without context
- "cheat meal," "cheat day" (shame framing)
- "transformation" in a before/after sense
- Corporate speak: "leverage," "optimize your journey," "holistic"
- Excessive exclamation marks

---

## Visual Identity

### Color System

The palette pairs vivid orange energy with a deep navy grounding — high contrast, high intent.

#### Primary — Vivid Orange
The brand color. Used on primary actions, key stats, progress indicators, and anywhere the UI needs to signal importance or momentum.

| Token | Value | Usage |
|---|---|---|
| `--primary` | `oklch(0.65 0.22 42)` ≈ `#f97316` | Buttons, active nav, CTAs, accent text |
| `--primary-deep` | `oklch(0.55 0.22 42)` ≈ `#ea6c0a` | Hover states, gradient end |
| `--primary-soft` | `oklch(0.97 0.04 42)` ≈ `#fff7ed` | Selected cards, soft backgrounds, tints |

CSS utilities:
- `.gradient-orange` — `#f97316` → `#ea6c0a` (buttons, hero sections, headers)
- `.gradient-orange-soft` — pale orange tint (result cards, selected states)

#### Sidebar / Navigation — Dark Navy
Creates a strong visual anchor. The sidebar is the one persistent UI surface — it should feel solid and trustworthy.

| Token | Value | Usage |
|---|---|---|
| `--sidebar` | `oklch(0.13 0.01 260)` ≈ `#0f1117` | Sidebar background |
| `--sidebar-text` | `rgba(255,255,255,0.85)` | Nav labels |
| `--sidebar-active` | `rgba(249,115,22,0.15)` | Active nav item background |

#### Neutrals
| Token | Value | Usage |
|---|---|---|
| `--background` | `#ffffff` | Page background |
| `--surface` | `#f9fafb` | Card backgrounds, input fills |
| `--border` | `rgba(0,0,0,0.08)` | Card borders, dividers |
| `--text-primary` | `#111827` | Headings, body copy |
| `--text-secondary` | `#6b7280` | Labels, meta, captions |
| `--text-muted` | `#9ca3af` | Placeholder text, disabled states |

#### Semantic
| Token | Hex | Usage |
|---|---|---|
| Success | `#22c55e` | Streak active, goals met, positive delta |
| Warning | `#f59e0b` | Stale plan banner, approaching limit |
| Danger | `#ef4444` | Over-target, error states |
| Info | `#3b82f6` | Neutral callouts, tooltips |

---

### Typography

**Font family:** Geist (loaded via `next/font`) — geometric, clean, modern. Pairs well with high-weight numerics.

#### Type scale

| Role | Size | Weight | Letter spacing | Usage |
|---|---|---|---|---|
| Stat number large | 48px | 800 | −0.04em | Hero metrics (dashboard weight, calorie target) |
| Stat number | 32px | 800 | −0.04em | Secondary stats, macro numbers |
| Heading 1 | 24px | 700 | −0.02em | Page titles |
| Heading 2 | 18px | 600 | −0.01em | Section headers |
| Heading 3 | 15px | 600 | 0 | Card titles, widget headers |
| Body | 15px | 400 | 0 | Default body copy |
| Small | 13px | 400 | 0 | Labels, captions, meta |
| Micro | 11px | 500 | 0.02em | Badges, tags, overlines |

CSS utilities: `.stat-number` (32px, 800, −0.04em) and `.stat-number-lg` (48px) are defined in `globals.css`.

---

### Spacing & Layout

- **Base unit:** 4px
- **Component padding:** 16px inner (cards), 12px (compact cards)
- **Section gap:** 24px between major page sections
- **Card gap:** 12–16px in grids
- **Mobile breakpoint:** 375px minimum — all UI is designed gym-first (one hand, bright light)
- **Desktop sidebar width:** 240px (`md:pl-60`)

---

### Elevation & Depth

No skeuomorphic shadows. Depth is communicated through subtle layered box shadows that suggest lift without decoration.

| Utility | Usage |
|---|---|
| `.card-shadow` | Default cards, panels |
| `.card-shadow-md` | Modals, overlays, dropdowns |

Shadow values are defined in `globals.css`. Do not use Tailwind's built-in `shadow-*` — they don't match the brand aesthetic.

---

### Iconography

**Library:** Lucide React — outline style, consistent 1.5px stroke weight.

Rules:
- Always use outline variants, never filled
- Default size: 20px inline, 24px decorative
- Color inherits from parent text color unless indicating status
- Never use icons as the sole indicator of meaning — pair with a label on first use

---

### Border Radius

| Context | Radius |
|---|---|
| Cards, modals | 12px |
| Buttons, inputs, badges | 8px |
| Pills, tags | 999px (full round) |
| Charts, progress bars | 4px |

---

### Motion

Keep it fast and purposeful. Animation should communicate state change, not decorate.

| Interaction | Duration | Easing |
|---|---|---|
| Button press | 100ms | ease-out |
| Card hover | 150ms | ease-out |
| Page transition | 200ms | ease-in-out |
| Celebration overlay (XP/badge) | 300ms in, 200ms out | spring / ease-out |
| Chart render | 400ms | ease-out |

No looping animations. No animations on data that updates frequently (live macro bars, streaks).

---

## Product Experience Principles

These inform every UI and UX decision, from button placement to copy length.

1. **The hardest part is showing up** — reduce every barrier to daily check-in. One tap should get users 80% of the way logged.
2. **Show the number, explain the why** — always surface the metric, then make the context available (not mandatory).
3. **Celebrate behavior, not outcomes** — XP and badges reward showing up consistently, not just hitting a goal weight.
4. **Never leave a user stranded** — every empty state has a clear next action. Every error has a recovery path.
5. **Mobile is the primary canvas** — every screen is designed at 375px first. Desktop is an enhancement.

---

## Launch & Marketing Voice

For TikTok, paid social, and App Store copy — the voice shifts to bold and demo-first. Show, don't describe.

**Format principles:**
- Lead with the wow moment, not the feature name
- No more than one idea per video
- End with a concrete, low-friction CTA ("free to try")
- Avoid narrated walkthroughs — let the UI speak

**Hero feature for launch:** AI photo food log — point camera at a meal, get instant macro breakdown. This is the single most visually demonstrable, friction-removing feature in the product. Lead every launch campaign here.

---

## Brand Dos and Don'ts

| Do | Don't |
|---|---|
| Use orange sparingly — it should signal importance | Orange everything |
| Let white space breathe | Pack cards with too much data |
| Use real user numbers in demos | Use obviously fake/perfect numbers |
| Write coach copy that sounds human | Write coach copy that sounds like a medical report |
| Celebrate milestones with restraint | Spam celebration modals |
| Lead marketing with a demo | Lead marketing with a feature list |
| Keep the sidebar dark navy | Change the sidebar color |