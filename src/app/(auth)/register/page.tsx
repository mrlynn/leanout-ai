"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/user/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registration failed");
      setLoading(false);
    } else {
      router.push("/login?registered=1");
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-orange flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="LeanOut AI" style={{ width: 36, height: 36, display: "block", borderRadius: 9 }} />
          <span className="font-black text-xl tracking-tight text-white">LeanOut AI</span>
        </div>
        <div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Build the physique<br />you&apos;ve been chasing.
          </h2>
          <p className="text-orange-200 text-lg">
            Set your goal, get your macros, follow your plan. It&apos;s that direct.
          </p>
        </div>
        <p className="text-orange-300 text-sm">Free to start. Powered by AI.</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-2.5 justify-center">
            <img src="/logo.png" alt="LeanOut AI" style={{ width: 36, height: 36, display: "block", borderRadius: 9 }} />
            <span className="font-black text-xl tracking-tight">LeanOut AI</span>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight">Create your account</h1>
            <p className="text-muted-foreground mt-1">Start your LeanOut journey today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Full name</Label>
              <Input
                placeholder="Alex Johnson"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-11 rounded-xl border-border/80 bg-muted/40 focus:bg-white"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-11 rounded-xl border-border/80 bg-muted/40 focus:bg-white"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Password</Label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="h-11 rounded-xl border-border/80 bg-muted/40 focus:bg-white"
                required
                minLength={8}
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
              {loading ? "Creating account…" : "Create account →"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
          </p>

          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            By creating an account, you agree to our{" "}
            <Link href="/license" className="text-primary font-semibold hover:underline">
              Terms &amp; License
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary font-semibold hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
          <LegalFooterLinks />
        </div>
      </div>
    </div>
  );
}
