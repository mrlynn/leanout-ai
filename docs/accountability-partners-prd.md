# Feature PRD: Accountability Partners v2

> Status: Ready to build  
> Last updated: June 2026  
> Author: Michael Lynn

---

## Problem

The current accountability share link is passive — a partner visits a URL when they remember to. There's no notification loop, no ability to add multiple people, and no way for a partner to act on what they see. Users set it up and forget it exists.

Real accountability requires the *partner* to be pulled in automatically when something happens, and to have a frictionless way to respond.

---

## Goal

Make partners active participants in the user's journey. A partner should receive an automated email when the user misses a check-in, and should be able to send a one-tap nudge back — all without creating a LeanOut account.

---

## Non-Goals

- Partners do not log in or have accounts.
- Partners cannot see food log detail, macros, or body measurements — only the existing summary (streak, compliance, weight trend).
- No push notifications to partners (email only — avoids device permission requirements for third parties).
- No partner-initiated rewards or badge actions.

---

## User Stories

| # | As a… | I want to… | So that… |
|---|---|---|---|
| U1 | User | Add multiple accountability partners by name + email | Different people in my life can support me |
| U2 | User | Label each partner (e.g. "Coach", "Spouse", "Training buddy") | I can distinguish them in the UI |
| U3 | User | Revoke a specific partner's access without affecting others | I stay in control of who sees my data |
| U4 | Partner | Receive an email when my person misses a check-in | I can reach out at the right moment |
| U5 | Partner | Tap a "Send nudge" button in the share page (no account needed) | I can act immediately with zero friction |
| U6 | User | Receive a push notification when a partner sends me a nudge | I feel the accountability in real-time |
| U7 | User | See who nudged me and when, on the share settings panel | I know who's in my corner |
| U8 | User | Optionally be cc'd on the miss-notification email | I know the loop has been triggered |

---

## Data Model Changes

### Replace `AccountabilityShare` (one-per-user) → `AccountabilityPartner` (many-per-user)

```typescript
// src/models/AccountabilityPartner.ts
{
  userId:         ObjectId   // ref User, indexed
  name:           string     // partner's display name, e.g. "Coach Dan"
  label:          string     // "Coach" | "Spouse" | "Training buddy" | "Friend" | custom
  email:          string     // where miss-notifications go
  tokenHash:      string     // sha256 of the raw share token; unique index
  notifyOnMiss:   boolean    // default true
  expiresAt:      Date       // 90 days from creation, rolling re-generate
  revokedAt:      Date?
  lastNudgeAt:    Date?      // last time this partner sent a nudge
  lastNotifiedAt: Date?      // last time we emailed this partner about a miss
  createdAt:      Date
}
// Indexes: { userId, revokedAt }, { tokenHash }
```

**Migration:** existing `AccountabilityShare` documents stay intact. The reminders cron reads from `AccountabilityPartner` first and falls back to `AccountabilityShare` until old documents naturally expire (90-day TTL). After July 2026, remove the fallback and the old model.

---

## API Changes

### `GET /api/accountability`
Returns all active (non-revoked, non-expired) partners for the session user.

```json
{
  "partners": [{
    "id": "...",
    "name": "Coach Dan",
    "label": "Coach",
    "email": "dan@...",
    "shareUrl": "https://...",
    "notifyOnMiss": true,
    "expiresAt": "...",
    "lastNudgeAt": "..."
  }]
}
```

### `POST /api/accountability`
Three actions:

**create:**
```json
{ "action": "create", "name": "Coach Dan", "label": "Coach", "email": "dan@...", "notifyOnMiss": true }
```
Returns `{ partner, shareUrl }`. Fails with 400 if user already has 5 active partners.

**revoke:**
```json
{ "action": "revoke", "partnerId": "..." }
```

**regenerate:** revokes the current token for one partner and issues a new one, keeping all other fields. Returns new `shareUrl`.
```json
{ "action": "regenerate", "partnerId": "..." }
```

### `POST /api/accountability/nudge/[token]`
Public (no auth). Validates the token (not revoked, not expired), rate-limits to 3 nudges per partner per day via `lastNudgeAt` + a `nudgesToday` counter, then:
1. Sends a push notification to the user via `sendPushToUser`.
2. Sets `lastNudgeAt` on the partner document.
3. Optionally sends a nudge-confirmation email to the user (if `remindersEnabled`).

Returns `{ ok: true }` or an appropriate error. No user data is returned.

---

## Email Changes

### Miss-notification email (sent by cron)

- **Trigger:** user hasn't checked in by their `reminderHour`, same logic as today.
- **Recipients:** all active partners with `notifyOnMiss: true` for that user.
- **Rate limit:** one miss-notification per partner per calendar day (guarded by `lastNotifiedAt`).
- **Content:** partner's name, user's first name, streak at stake, deep link to share page.
- **CTA:** "View [Name]'s progress →" linking to `/share/[token]`.
- **Remove Pro gate** from partner notification logic in the cron — this is a free feature.

### Nudge-confirmation email (to user)

- Triggered when a partner taps Send Nudge on the share page.
- Subject: `"[Partner name] just nudged you 💪"`
- Body: partner name, timestamp, deep link to `/check-in`.
- Only sent if user has `remindersEnabled`.

---

## UI Changes

### Settings page — replace `AccountabilityPartner` component

The existing single-partner card becomes a multi-partner manager:

```
┌─────────────────────────────────────────────────┐
│ 👥  Accountability Partners                      │
│                                                  │
│  Coach Dan  [Coach]  dan@...  nudged 2d ago     │
│  📋 Copy link   🔄 Regenerate   🗑 Revoke        │
│                                                  │
│  Sarah  [Spouse]  sarah@...  never nudged       │
│  📋 Copy link   🔄 Regenerate   🗑 Revoke        │
│                                                  │
│  [＋ Add a partner]                              │
└─────────────────────────────────────────────────┘
```

- Each row shows: name, label badge, email (truncated), last nudge relative date.
- Inline add-form (no separate page): Name, Label (select: Coach / Spouse / Training buddy / Friend), Email, "Notify on miss" toggle.
- Hard cap at **5 active partners**.
- Copy link copies the raw share URL to clipboard (same UX as today).

### Share page (`/share/[token]`) — add Nudge button

Below the existing stats card:

```
┌──────────────────────────────────────────┐
│  Send Michael a nudge                    │
│  [ 💪 Send nudge ]                       │
│  (disabled + "3/3 nudges sent today"     │
│   after rate limit hit)                  │
└──────────────────────────────────────────┘
```

- Fires `POST /api/accountability/nudge/[token]`.
- Button enters "Nudge sent! 🎉" confirmation state for 3s.
- After 3 nudges/day: disabled, shows "You've nudged them 3× today".
- Rate limit state is tracked client-side via `localStorage` (keyed by token) — no login needed.

---

## Cron changes (`/api/cron/reminders`)

1. Query `AccountabilityPartner` for partners to notify (not `AccountabilityShare`).
2. Fan out one email per partner — a user with 3 partners generates 3 separate emails.
3. Guard with `lastNotifiedAt` < today to prevent duplicate sends.
4. Remove the `isPro` gate on partner notifications.
5. Keep the `AccountabilityShare` fallback query until July 2026, then remove.

---

## Rollout Sequence

1. **Data model** — `src/models/AccountabilityPartner.ts` with indexes.
2. **API routes** — `GET/POST /api/accountability` + `POST /api/accountability/nudge/[token]`.
3. **Cron update** — switch to new model, remove Pro gate, add `lastNotifiedAt` guard.
4. **Share page** — nudge button + rate-limit UX.
5. **Settings UI** — multi-partner manager component.
6. **Email templates** — miss-notification (updated) + nudge-confirmation (new).
7. **Type check + build** — `tsc --noEmit` clean, then `next build` passes.
8. **PRD.md update** — API Reference, Feature Status, Data Models.

---

## Open Questions

| # | Question | Default assumption |
|---|---|---|
| OQ1 | Welcome email when a partner is first added? | No — user shares the link manually. |
| OQ2 | Nudge push notification — silent or with sound? | Sound on (reuse `sendPushToUser` defaults). |
| OQ3 | Nudge rate limit — per partner per day or per share-page-visit? | Per partner per day, tracked in DB. |
| OQ4 | Streak milestone emails auto-CC partners? | Defer to v3. |

---

## Success Metrics

- % of users with ≥1 active partner (target: 20% of DAU within 60 days).
- Partner miss-notification emails sent per day.
- Nudge tap rate (nudges ÷ share page views).
- D7 retention: users with ≥1 partner vs. without.
