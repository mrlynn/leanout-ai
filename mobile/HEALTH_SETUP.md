# HealthKit (iOS) & Health Connect (Android)

LeanOut uses [`@capgo/capacitor-health`](https://capgo.app/docs/plugins/health/) v7 for native step and weight sync.

## Install in mobile shell

```bash
cd mobile
npm install
npx cap sync ios
```

The Capacitor `server.url` must match the live site **without redirects**. Use `https://www.leanout.app` (not `https://leanout.app`, which 308-redirects and breaks the iOS WebView).

### Login in the native app

On Vercel, set `NEXTAUTH_URL` and `AUTH_URL` to `https://www.leanout.app` (must match `server.url`). Auth uses `trustHost: true` so callbacks follow the WebView host.

Use **email + password** in the LeanOut native app. Google OAuth is blocked inside iOS WebViews by Google.

After login, the app uses `/native-bridge` then a full page load to `/dashboard` to avoid Next.js RSC `NSURLError -999` cancellations in WKWebView.

### Xcode 26 note

If Xcode offers **Recommended Settings** (quoted includes in framework headers, user script sandboxing), **do not accept** them for this project — they break Capacitor Pods. The `Podfile` post-install hook and `App.xcodeproj` already set `CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = NO` and `ENABLE_USER_SCRIPT_SANDBOXING = NO`.

## iOS — HealthKit

1. Accept the latest **Program License Agreement** at [developer.apple.com/account](https://developer.apple.com/account) (Xcode signing fails with "PLA Update available" until you do).
2. `npx cap open ios`
3. **Signing & Capabilities** → confirm **HealthKit** is listed (entitlements file: `App/App.entitlements`). Re-add via **+ Capability** if missing.
4. `App/App/Info.plist` must include:

```xml
<key>NSHealthShareUsageDescription</key>
<string>LeanOut reads your steps and weight to pre-fill daily check-ins.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>LeanOut does not write health data.</string>
```

## Android — Health Connect

1. Min SDK 26+ (Capacitor 7 default is fine)
2. Plugin ships required Health Connect permissions in its manifest merge
3. Users on Android 13 and below need [Health Connect by Android](https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata) installed
4. Add privacy policy URL in `android/app/src/main/res/values/strings.xml`:

```xml
<string name="health_connect_privacy_policy_url">https://www.leanout.app/privacy</string>
```

5. Declare the app in [Play Console Health apps form](https://support.google.com/googleplay/android-developer/answer/14738291) before production release

## Test flow

1. Build and run on device (simulator HealthKit has limited data)
2. Tap the floating **+** → **Sync health** or use **Sync steps & weight** on check-in
3. Grant read access to Steps and Weight
4. Verify check-in pre-fills from `/api/user/health-sync`

## Troubleshooting

### `__abort_with_payload` on launch

Common causes on Xcode 16+:

1. **Target named `App`** — collides with system symbols on device. This project uses target **LeanOut**; scheme **LeanOut**; select that scheme in Xcode.
2. **HealthKit entitlement** not in provisioning profile — enable HealthKit on `app.leanout.mobile` in [developer.apple.com](https://developer.apple.com/account/resources/identifiers/list), toggle capability in Xcode, then **Signing & Capabilities → Try Again**.
3. **Xcode 26 debugger noise** (`OS_dispatch_mach_msg _setContext`) — if the app icon appears on the phone but Xcode shows a crash, tap the icon manually without the debugger, or Scheme → Run → uncheck **Debug executable**.

Health permissions are requested only when the user taps **Sync health** (not on app launch).

### Xcode console

Scroll above the assembly view in the debug navigator. Look for lines like `entitlement com.apple.developer.healthkit` or `This app has crashed because it attempted to access privacy-sensitive data`.
