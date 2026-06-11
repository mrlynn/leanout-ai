/** Capacitor / native runtime detection and bridges (safe on web). */

type CapacitorWindow = Window & {
  Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
};

export type AppShell = "capacitor" | "pwa" | "browser";

export function getAppShell(): AppShell {
  if (typeof window === "undefined") return "browser";
  const cap = (window as CapacitorWindow).Capacitor;
  if (cap?.isNativePlatform?.()) return "capacitor";
  if (window.matchMedia("(display-mode: standalone)").matches) return "pwa";
  if ((navigator as Navigator & { standalone?: boolean }).standalone) return "pwa";
  return "browser";
}

export function isNativeApp(): boolean {
  return getAppShell() === "capacitor";
}

/** Why HealthKit / Health Connect sync cannot run in the current shell. */
export function healthSyncBlockedMessage(): string {
  switch (getAppShell()) {
    case "capacitor":
      return "Health plugin unavailable. Rebuild the native app: cd mobile && npx cap sync ios, then run the LeanOut scheme in Xcode.";
    case "pwa":
      return "This home-screen icon is the web app. Apple Health needs the native LeanOut app built from mobile/ and installed via Xcode on your iPhone.";
    default:
      return "You're in the browser (Safari/Chrome). Health sync only works in the native LeanOut app — not leanout.app in a tab. Install from Xcode (LeanOut scheme) and open that app icon.";
  }
}

export async function requestCameraPhoto(): Promise<File | null> {
  if (!isNativeApp()) return null;
  try {
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
    });
    if (!photo.dataUrl) return null;
    const res = await fetch(photo.dataUrl);
    const blob = await res.blob();
    return new File([blob], "meal-photo.jpg", { type: "image/jpeg" });
  } catch {
    return null;
  }
}

export type { TodayHealthMetrics as HealthSample } from "./healthSync";
export { readTodayMetrics as readHealthSamples } from "./healthSync";

export async function registerPushNotifications(
  onToken: (token: string) => void
): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return;
    await PushNotifications.register();
    PushNotifications.addListener("registration", (ev) => {
      if (ev.value) onToken(ev.value);
    });
  } catch {
    // push optional
  }
}
