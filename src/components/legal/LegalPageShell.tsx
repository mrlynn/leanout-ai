import Link from "next/link";
import { PageContainer } from "@/components/PageContainer";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";

interface LegalPageShellProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageShell({ title, subtitle, lastUpdated, children }: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-orange pt-8 pb-14 md:pt-10">
        <PageContainer>
          <Link
            href="/"
            className="inline-flex items-center text-sm font-semibold text-orange-100 hover:text-white transition-colors mb-6"
          >
            ← LeanOut AI
          </Link>
          <p className="text-orange-200 text-xs font-bold uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{title}</h1>
          <p className="text-orange-100 mt-2 text-sm md:text-base max-w-2xl">{subtitle}</p>
          <p className="text-orange-200/80 text-xs mt-3">Last updated {lastUpdated}</p>
        </PageContainer>
      </div>

      <PageContainer className="-mt-8 pb-16">
        <article className="bg-white rounded-3xl card-shadow-md p-6 md:p-10 prose prose-sm md:prose-base prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline max-w-none">
          {children}
        </article>
        <div className="mt-8 flex flex-col items-center gap-3">
          <LegalFooterLinks />
          <p className="text-xs text-muted-foreground text-center">
            Questions?{" "}
            <a href="mailto:contact@leanout.ai" className="text-primary font-semibold hover:underline">
              contact@leanout.ai
            </a>
          </p>
        </div>
      </PageContainer>
    </div>
  );
}
