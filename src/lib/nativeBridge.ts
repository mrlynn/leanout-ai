/** Capacitor / native runtime detection and bridges (safe on web). */

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return cap?.isNativePlatform?.() ?? false;
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

export interface HealthSample {
  steps?: number;
  weightLbs?: number;
  source: "apple_health" | "health_connect" | "manual";
  syncedAt: string;
}

/** Read steps + weight from native health APIs when available. */
export async function readHealthSamples(): Promise<HealthSample | null> {
  if (!isNativeApp()) return null;
  try {
    const bridge = (window as Window & {
      LeanOutHealth?: { readToday: () => Promise<{ steps?: number; weightLbs?: number }> };
    }).LeanOutHealth;
    if (!bridge?.readToday) return null;
    const data = await bridge.readToday();
    return {
      steps: data.steps,
      weightLbs: data.weightLbs,
      source: /iPhone|iPad|iPod/.test(navigator.userAgent) ? "apple_health" : "health_connect",
      syncedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

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
