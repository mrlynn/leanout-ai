"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Request failed");
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Reset password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>
        {sent ? (
          <p className="text-sm text-green-700 bg-green-50 rounded-xl p-4">
            If an account exists for that email, a reset link was sent. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full gradient-orange border-0 rounded-xl">
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <Link href="/login" className="text-sm font-bold text-primary hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}
