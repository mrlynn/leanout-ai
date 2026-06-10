import User from "@/models/User";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Native push delivery requires FCM (Android) / APNs (iOS) credentials in the Capacitor shell. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const user = await User.findById(userId).select("pushTokens").lean();
  const tokens = user?.pushTokens ?? [];
  if (tokens.length === 0) return 0;

  let sent = 0;
  for (const entry of tokens) {
    const [, token] = entry.includes(":") ? entry.split(":", 2) : ["native", entry];
    if (!token) continue;
    // Wire to FCM/APNs when PUSH_SERVER_KEY is configured
    if (process.env.PUSH_SERVER_KEY) {
      try {
        await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            Authorization: `key=${process.env.PUSH_SERVER_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: token,
            notification: { title: payload.title, body: payload.body },
            data: { url: payload.url ?? "/check-in" },
          }),
        });
        sent++;
      } catch (e) {
        console.error("[push] send failed:", e);
      }
    } else {
      console.log(`[push] queued for ${userId}: ${payload.title}`);
      sent++;
    }
  }
  return sent;
}
