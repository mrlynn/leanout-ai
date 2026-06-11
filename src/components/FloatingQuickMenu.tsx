"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Plus,
  X,
  UtensilsCrossed,
  Camera,
  ScanBarcode,
  Mic,
  Scale,
  Dumbbell,
  Heart,
  Loader2,
} from "lucide-react";
import { syncHealthToBackend } from "@/lib/healthSync";
import { useNativeApp } from "@/hooks/useNativeApp";

const QUICK_ACTIONS = [
  { id: "food", label: "Log food", href: "/food-log?tab=manual", icon: UtensilsCrossed },
  { id: "photo", label: "Photo scan", href: "/food-log?tab=photo", icon: Camera },
  { id: "barcode", label: "Barcode", href: "/food-log?tab=scan", icon: ScanBarcode },
  { id: "voice", label: "Voice log", href: "/food-log?tab=voice", icon: Mic },
  { id: "weight", label: "Weight", href: "/check-in", icon: Scale },
  { id: "workout", label: "Workout", href: "/workout", icon: Dumbbell },
] as const;

export function FloatingQuickMenu() {
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const nativeApp = useNativeApp();
  const router = useRouter();
  const path = usePathname();

  const close = useCallback(() => {
    setOpen(false);
    setSyncMsg("");
  }, []);

  useEffect(() => {
    close();
  }, [path, close]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function handleHealthSync() {
    setSyncing(true);
    setSyncMsg("");
    try {
      const result = await syncHealthToBackend();
      if (result.ok) {
        setSyncMsg(result.message);
        setTimeout(() => {
          close();
          router.push("/check-in");
        }, 600);
      } else {
        setSyncMsg(result.message);
      }
    } catch (err) {
      setSyncMsg(err instanceof Error ? err.message : "Sync failed unexpectedly.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <button
          type="button"
          aria-label="Close quick menu"
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] md:bg-black/20"
          onClick={close}
        />
      )}

      <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-3">
        {/* Expanded actions */}
        {open && (
          <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="bg-white rounded-2xl card-shadow-md p-2 min-w-[200px]">
              {QUICK_ACTIONS.map(({ id, label, href, icon: Icon }) => (
                <Link
                  key={id}
                  href={href}
                  onClick={close}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors w-full"
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <span className="text-sm font-bold">{label}</span>
                </Link>
              ))}
              <button
                type="button"
                onClick={handleHealthSync}
                disabled={syncing}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors w-full text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                  {syncing ? (
                    <Loader2 size={18} className="text-rose-600 animate-spin" />
                  ) : (
                    <Heart size={18} className="text-rose-600" />
                  )}
                </div>
                <span className="text-sm font-bold">
                  {nativeApp ? "Sync health" : "Health sync"}
                </span>
              </button>
            </div>

            {syncMsg && (
              <p className="text-xs font-medium bg-white rounded-xl px-3 py-2 card-shadow max-w-[220px] text-muted-foreground">
                {syncMsg}
              </p>
            )}

            {/* MacroFactor-style bottom row shortcuts */}
            <div className="flex gap-2 bg-white/95 backdrop-blur rounded-2xl card-shadow-md px-3 py-2">
              <QuickChip icon={Scale} label="Weight" href="/check-in" onClick={close} />
              <QuickChip icon={Dumbbell} label="Workout" href="/workout" onClick={close} />
              <QuickChip icon={Heart} label="Health" onClick={handleHealthSync} disabled={syncing} />
            </div>
          </div>
        )}

        {/* FAB */}
        <button
          type="button"
          aria-label={open ? "Close quick actions" : "Quick actions"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={`w-14 h-14 rounded-full gradient-orange card-shadow-md flex items-center justify-center text-white transition-transform duration-200 ${
            open ? "rotate-45 scale-105" : "hover:scale-105"
          }`}
        >
          {open ? <X size={24} strokeWidth={2.5} /> : <Plus size={26} strokeWidth={2.5} />}
        </button>
      </div>
    </>
  );
}

function QuickChip({
  icon: Icon,
  label,
  href,
  onClick,
  disabled,
}: {
  icon: typeof Scale;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const inner = (
    <>
      <Icon size={18} className="text-primary" />
      <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl hover:bg-muted/50 min-w-[56px]"
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl hover:bg-muted/50 min-w-[56px] disabled:opacity-50"
    >
      {inner}
    </button>
  );
}
