import { AppNav } from "@/components/AppNav";
import { AppProviders } from "@/components/AppProviders";
import { auth } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;

  return (
    // On mobile: fixed viewport container prevents body scroll so the bottom
    // nav (position:fixed) doesn't drift during WKWebView rubber-band scroll.
    // On desktop (md+): revert to normal block layout with sidebar offset.
    <div className="fixed inset-0 flex flex-col md:static md:inset-auto md:block md:min-h-screen">
      <AppNav isAdmin={isAdmin} />
      {/* Mobile: flex-1 + overflow-y-auto = independent scroll zone */}
      {/* Desktop: normal block with sidebar offset */}
      <main className="flex-1 overflow-y-auto md:overflow-visible md:pl-60 pb-20 md:pb-0 md:min-h-screen">
        <AppProviders>{children}</AppProviders>
      </main>
    </div>
  );
}
