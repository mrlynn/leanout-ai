import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Guide from "@/models/Guide";

function isAdmin(email?: string | null) {
  return email && email === process.env.ADMIN_EMAIL;
}

export default async function DynamicGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { slug } = await params;
  await connectDB();

  const admin = isAdmin(session.user.email);
  const filter = admin ? { slug } : { slug, published: true };
  const guide = await Guide.findOne(filter).lean();

  if (!guide) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <AlertCircle size={48} className="mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">Guide not found</h1>
        <Link href="/tools" className="text-primary text-sm hover:underline">
          ← Back to Tools
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link
        href="/tools"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Tools &amp; Resources
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{guide.emoji}</span>
          {guide.category && (
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
              {guide.category}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-black leading-tight">{guide.title}</h1>
        {guide.summary && (
          <p className="text-muted-foreground mt-2 text-base leading-relaxed">{guide.summary}</p>
        )}
        {guide.tags && guide.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {guide.tags.map((tag: string) => (
              <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/80 prose-li:text-foreground/80 prose-strong:text-foreground prose-a:text-primary">
        <ReactMarkdown>{guide.content}</ReactMarkdown>
      </div>

      <div className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground">
        Last updated {new Date(guide.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </div>
    </div>
  );
}
