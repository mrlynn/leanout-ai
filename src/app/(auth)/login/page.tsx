"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";
import { isNativeApp } from "@/lib/nativeBridge";
import { useNativeApp } from "@/hooks/useNativeApp";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const nativeApp = useNativeApp();

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((d) => setGoogleEnabled(!!d.google))
      .catch(() => {});
  }, []);

  async function completeLogin() {
    const result = await signIn("credentials", { email, password, redirect: false });
    const debug = JSON.stringify({ ok: result?.ok, status: result?.status, error: result?.error });
    console.log("[login] signIn result=", debug);
    try { sessionStorage.setItem("__login_debug", debug); } catch { /* ignore */ }

    if (result?.error || result?.ok === false) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    const target = isNativeApp() ? "/native-bridge" : "/dashboard";
    window.location.replace(`${window.location.origin}${target}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    await completeLogin();
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-orange flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <span className="font-black text-xl tracking-tight text-white">LeanOut AI</span>
        </div>
        <div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Your AI physique<br />coach is waiting.
          </h2>
          <p className="text-orange-200 text-lg">
            Personalized macros, meal plans, and coaching — all tailored to your exact goals.
          </p>
        </div>
        <p className="text-orange-300 text-sm">Built for people who are serious about results.</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 justify-center">
            <div className="w-9 h-9 rounded-xl gradient-orange flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="font-black text-xl tracking-tight">LeanOut AI</span>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border-border/80 bg-muted/40 focus:bg-white"
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl border-border/80 bg-muted/40 focus:bg-white"
                required
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-bold text-sm gradient-orange border-0 hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {googleEnabled && !nativeApp && (
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-xl font-bold text-sm"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              Continue with Google
            </Button>
          )}
          {nativeApp && (
            <p className="text-xs text-muted-foreground text-center">
              Use email and password in the mobile app. Google sign-in is not supported in the native shell.
            </p>
          )}

          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
