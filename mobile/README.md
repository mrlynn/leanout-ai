# LeanOut AI — Mobile (Capacitor)

Native iOS/Android shell that loads the deployed LeanOut web app.

## Setup

```bash
cd mobile
npm install

# Point at your deployment (default: https://leanout.app)
export LEANOUT_APP_URL=https://your-app.vercel.app

npx cap add ios    # macOS + Xcode required
npx cap add android

npx cap sync
npx cap open ios
# or
npx cap open android
```

## Permissions

- **Camera** — food photo logging, progress photos
- **Push notifications** — check-in reminders, weekly review (register token via `/api/user/push-token`)
- **Health** — wired through `src/lib/nativeBridge.ts` when native health plugins are added

## Local dev

```bash
# Terminal 1 — Next.js
node ../node_modules/next/dist/bin/next dev

# Terminal 2 — point Capacitor at localhost (iOS simulator)
LEANOUT_APP_URL=http://localhost:3000 npx cap sync
```
