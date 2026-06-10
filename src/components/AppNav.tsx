"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Camera,
  ClipboardCheck,
  TrendingUp,
  MessageSquare,
  LogOut,
  Zap,
  Wrench,
  MoreHorizontal,
  Info,
  X,
  Dumbbell,
  Settings,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { useBillingStatus } from "@/hooks/useBillingStatus";
import { SystemStatus } from "@/components/SystemStatus";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meal-plan", label: "Meal Plan", icon: UtensilsCrossed },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/food-log", label: "Food Log", icon: Camera },
  { href: "/check-in", label: "Check-in", icon: ClipboardCheck },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/coach", label: "AI Coach", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/pricing", label: "Pro", icon: Zap },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/about", label: "About", icon: Info },
];

// Items shown in the bottom bar
const BAR_NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/food-log", label: "Food Log", icon: Camera },
  { href: "/check-in", label: "Check-in", icon: ClipboardCheck },
  { href: "/coach", label: "Coach", icon: MessageSquare },
];

// Items shown in the More drawer
const DRAWER_NAV = [
  { href: "/meal-plan", label: "Meal Plan", icon: UtensilsCrossed },
  { href: "/workout", label: "Workout", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/pricing", label: "Go Pro", icon: Zap },
  { href: "/tools", label: "Tools & Resources", icon: Wrench },
  { href: "/about", label: "About", icon: Info },
];

export function AppNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const path = usePathname();
  const { billingEnabled } = useBillingStatus();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = billingEnabled ? NAV : NAV.filter((n) => n.href !== "/pricing");
  const drawerItems = billingEnabled ? DRAWER_NAV : DRAWER_NAV.filter((n) => n.href !== "/pricing");

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [path]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const drawerActive = drawerItems.some(
    (n) => path === n.href || path.startsWith(n.href + "/")
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col bg-sidebar text-sidebar-foreground z-40">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-orange flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-black text-lg tracking-tight text-white">LeanOut AI</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-sidebar-primary text-white"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${active ? "text-white" : ""}`} size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Admin link (only shown to admin) */}
        {isAdmin && (
          <div className="px-3 pt-2 space-y-1">
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                path === "/admin"
                  ? "bg-sidebar-primary text-white"
                  : "text-amber-400 hover:text-amber-300 hover:bg-sidebar-accent"
              }`}
            >
              <ShieldCheck size={18} />
              Admin
            </Link>
            <SystemStatus />
          </div>
        )}

        {/* Sign out */}
        <div className="px-3 pb-6 border-t border-sidebar-border pt-4">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-all"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom bar ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-border z-40 pb-safe">
        <div className="flex">
          {BAR_NAV.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 flex-1 text-xs font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon size={22} />
                <span className="text-[10px] mt-0.5">{label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 py-2.5 flex-1 text-xs font-medium transition-colors ${
              drawerActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <MoreHorizontal size={22} />
            <span className="text-[10px] mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* ── Mobile More drawer ── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-50"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Sheet */}
          <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl shadow-2xl pb-safe animate-in slide-in-from-bottom duration-200">
            {/* Handle + header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg gradient-orange flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" fill="white" />
                </div>
                <span className="font-black text-base tracking-tight">LeanOut AI</span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drag handle pill */}
            <div className="flex justify-center pb-2">
              <div className="w-10 h-1 rounded-full bg-muted" />
            </div>

            {/* Drawer nav items */}
            <nav className="px-4 pb-2 space-y-1">
              {drawerItems.map(({ href, label, icon: Icon }) => {
                const active = path === href || path.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon size={20} className={active ? "text-primary" : "text-muted-foreground"} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Divider + sign out */}
            <div className="px-4 pt-2 pb-6 border-t border-border mt-2">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold text-red-600 hover:bg-red-50 w-full transition-all mt-2"
              >
                <LogOut size={20} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
