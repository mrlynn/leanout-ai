import Link from "next/link";

const LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/license", label: "Terms & License" },
  { href: "/cookies", label: "Cookies" },
] as const;

export function LegalFooterLinks({ className = "" }: { className?: string }) {
  return (
    <nav
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground ${className}`}
      aria-label="Legal"
    >
      {LINKS.map(({ href, label }, i) => (
        <span key={href} className="inline-flex items-center gap-4">
          {i > 0 && <span className="text-border hidden sm:inline" aria-hidden>|</span>}
          <Link href={href} className="font-semibold text-primary hover:underline">
            {label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
