import { PageContainer } from "@/components/PageContainer";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import Guide from "@/models/Guide";
import { CALCULATORS, STATIC_GUIDES } from "./tools-data";

export default async function ToolsPage() {
  await connectDB();
  const dbGuides = await Guide.find({ published: true })
    .select("title slug summary emoji")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <PageContainer size="content" className="py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Tools & Resources</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Calculators and guides to support every part of your fitness journey.
        </p>
      </div>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Calculators</h2>
        <div className="space-y-2">
          {CALCULATORS.map(({ href, icon: Icon, title, description, iconBg }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all group"
            >
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Guides</h2>
        <div className="space-y-2">
          {STATIC_GUIDES.map(({ href, title, description, emoji }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all group"
            >
              <div className="w-11 h-11 rounded-xl border border-border bg-muted/40 flex items-center justify-center shrink-0 text-xl">
                {emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Guide
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
          {dbGuides.map((g) => (
            <Link
              key={g._id.toString()}
              href={`/tools/guides/${g.slug}`}
              className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all group"
            >
              <div className="w-11 h-11 rounded-xl border border-border bg-muted/40 flex items-center justify-center shrink-0 text-xl">
                {g.emoji || "📖"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{g.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{g.summary}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Guide
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
