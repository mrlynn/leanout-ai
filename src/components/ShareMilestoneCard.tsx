"use client";

import { Button } from "@/components/ui/button";
import { Share2, Download } from "lucide-react";

export function ShareMilestoneCard({
  title,
  subtitle,
  stat,
  statLabel,
}: {
  title: string;
  subtitle: string;
  stat: string;
  statLabel: string;
}) {
  function copyShareText() {
    const text = `${title} — ${stat} ${statLabel}. Tracking with LeanOut AI.`;
    void navigator.clipboard.writeText(text);
  }

  function downloadCard() {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 640, 0);
    grad.addColorStop(0, "#f97316");
    grad.addColorStop(1, "#ea580c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 160);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 160, 640, 240);

    ctx.fillStyle = "#fed7aa";
    ctx.font = "bold 20px system-ui";
    ctx.fillText("LEANOUT AI", 32, 48);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px system-ui";
    ctx.fillText(title.slice(0, 28), 32, 96);

    ctx.fillStyle = "#ffedd5";
    ctx.font = "22px system-ui";
    ctx.fillText(subtitle.slice(0, 40), 32, 132);

    ctx.fillStyle = "#f97316";
    ctx.font = "bold 72px system-ui";
    ctx.fillText(stat, 32, 280);

    ctx.fillStyle = "#6b7280";
    ctx.font = "24px system-ui";
    ctx.fillText(statLabel, 32, 320);

    const link = document.createElement("a");
    link.download = "leanout-milestone.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl overflow-hidden card-shadow-md w-full max-w-xs">
        <div className="gradient-orange px-5 py-4">
          <p className="text-orange-100 text-xs font-bold uppercase tracking-widest">LeanOut AI</p>
          <p className="text-white font-black text-xl mt-1">{title}</p>
          <p className="text-orange-100 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="bg-white px-5 py-6 text-center">
          <p className="stat-number-lg text-primary">{stat}</p>
          <p className="text-sm text-muted-foreground font-medium">{statLabel}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1" onClick={copyShareText}>
          <Share2 size={14} /> Copy text
        </Button>
        <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1" onClick={downloadCard}>
          <Download size={14} /> Save image
        </Button>
      </div>
    </div>
  );
}
