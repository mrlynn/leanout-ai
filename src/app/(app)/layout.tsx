import { AppNav } from "@/components/AppNav";
import { AppProviders } from "@/components/AppProviders";
import { auth } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isAdmin = session?.user?.email === process.env.ADMIN_EMAIL;

  return (
    <div className="min-h-screen">
      <AppNav isAdmin={isAdmin} />
      {/* Offset for desktop sidebar */}
      <main className="md:pl-60 pb-20 md:pb-0 min-h-screen">
        <AppProviders>{children}</AppProviders>
      </main>
    </div>
  );
}
