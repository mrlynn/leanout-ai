"use client";

import { useEffect, useState } from "react";
import { Loader2, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ProCta } from "@/components/ProCta";

interface Report {
  _id: string;
  weekStart: string;
  headline: string;
  content: string;
}

export function WeeklyReviewCard({ isPro }: { isPro: boolean }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!isPro) {
      setLoading(false);
      return;
    }
    fetch("/api/pro/weekly-review")
      .then((r) => (r.ok ? r.json() : { reports: [] }))
      .then((d) => setReports(d.reports ?? []))
      .finally(() => setLoading(false));
  }, [isPro]);

  if (!isPro) {
    return (
      <div className="bg-white rounded-3xl card-shadow p-5">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={16} className="text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Weekly AI Review</p>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Get a personalized Sunday report with weight trends, adherence insights, and action items.
        </p>
        <ProCta />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="animate-spin text-muted-foreground" size={20} />
      </div>
    );
  }

  const latest = reports[0];
  if (!latest) {
    return (
      <div className="bg-white rounded-3xl card-shadow p-5 text-sm text-muted-foreground">
        Your first weekly review arrives this Sunday.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl card-shadow p-5">
      <div className="flex items-center gap-2 mb-2">
        <FileText size={16} className="text-primary" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Weekly AI Review</p>
      </div>
      <h3 className="font-black text-lg">{latest.headline}</h3>
      <p className="text-xs text-muted-foreground mt-1">Week of {latest.weekStart}</p>
      {expanded && (
        <div className="prose prose-sm max-w-none mt-4 text-sm">
          <ReactMarkdown>{latest.content}</ReactMarkdown>
        </div>
      )}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-sm font-semibold text-primary mt-3 hover:underline"
      >
        {expanded ? "Show less" : "Read full review"}
      </button>
    </div>
  );
}
