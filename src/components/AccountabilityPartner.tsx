"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProCta } from "@/components/ProCta";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, Copy, Check } from "lucide-react";

export function AccountabilityPartner({ isPro }: { isPro: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [notifyPartner, setNotifyPartner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isPro) return;
    fetch("/api/pro/accountability")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.share) {
          setPartnerEmail(d.share.partnerEmail ?? "");
          setNotifyPartner(d.share.notifyPartner ?? false);
        }
      });
  }, [isPro]);

  async function createLink() {
    setLoading(true);
    const res = await fetch("/api/pro/accountability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", partnerEmail, notifyPartner }),
    });
    const data = await res.json();
    if (data.url) setUrl(data.url);
    setLoading(false);
  }

  async function revoke() {
    await fetch("/api/pro/accountability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke" }),
    });
    setUrl(null);
  }

  function copyUrl() {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!isPro) {
    return (
      <div className="bg-white rounded-3xl card-shadow p-5">
        <div className="flex items-center gap-2 mb-2">
          <Users size={16} className="text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Accountability Partner</p>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Share a read-only progress link with a friend or coach who can keep you accountable.
        </p>
        <ProCta />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl card-shadow p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Users size={16} className="text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Accountability Partner</p>
      </div>

      <div>
        <Label>Partner email (optional)</Label>
        <Input
          type="email"
          value={partnerEmail}
          onChange={(e) => setPartnerEmail(e.target.value)}
          placeholder="partner@email.com"
          className="mt-1"
        />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={notifyPartner}
          onChange={(e) => setNotifyPartner(e.target.checked)}
          className="w-4 h-4 accent-primary"
          disabled={!partnerEmail}
        />
        Notify partner when I miss a check-in
      </label>

      {url ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input value={url} readOnly className="text-xs" />
            <Button variant="outline" size="sm" onClick={copyUrl} className="shrink-0 rounded-xl">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={revoke} className="rounded-xl text-red-600">
            Revoke link
          </Button>
        </div>
      ) : (
        <Button onClick={createLink} disabled={loading} className="rounded-xl gradient-orange border-0">
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Generate share link"}
        </Button>
      )}
    </div>
  );
}
