import { AppNav } from "@/components/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppNav />
      {/* Offset for desktop sidebar */}
      <main className="md:pl-60 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
