import Link from "next/link";
import { MessageSquare, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { CoachBrief } from "@/lib/coachingContext";

export function CoachBriefCard({ brief }: { brief: CoachBrief }) {
  const Icon = brief.priority === "warning" ? AlertTriangle : brief.priority === "success" ? CheckCircle2 : Info;
  const border =
    brief.priority === "warning"
      ? "border-amber-200 bg-amber-50"
      : brief.priority === "success"
        ? "border-green-200 bg-green-50"
        : "border-orange-200 bg-orange-50";

  return (
    <div className={`rounded-3xl border-2 ${border} p-5 card-shadow`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl gradient-orange flex items-center justify-center shrink-0">
          <Icon size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Coach brief</p>
          <p className="font-black text-base leading-snug">{brief.headline}</p>
          <ul className="mt-3 space-y-1.5">
            {brief.insights.map((line) => (
              <li key={line} className="text-sm text-foreground/80 leading-snug flex gap-2">
                <span className="text-primary shrink-0">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          {brief.coachPrompt && (
            <Link
              href={`/coach?prompt=${encodeURIComponent(brief.coachPrompt)}`}
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold text-primary hover:underline"
            >
              <MessageSquare size={14} />
              Discuss with coach →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
