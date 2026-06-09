"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Guide {
  title: string;
  slug: string;
  summary: string;
  content: string;
  emoji: string;
  category: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DynamicGuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/guides/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((d) => { if (d) setGuide(d); })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (notFound || !guide) {
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
        {guide.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {guide.tags.map((tag) => (
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
