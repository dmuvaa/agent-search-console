"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/cn";

export function SiteHeader({ variant = "console" }: { variant?: "console" | "plain" }) {
  return (
    <header className={cn("sticky top-0 z-30 border-b border-line/80 bg-background/80 backdrop-blur-md")}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-medium tracking-tight">
          <BrandMark className="size-7" />
          <span>Agent Search Console</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted sm:gap-5">
          <Link href="/seo" className="hover:text-foreground">
            SEO tools
          </Link>
          <Link href="/seo/report" className="hidden hover:text-foreground sm:inline">
            SEO report
          </Link>
          {variant === "console" ? (
            <Link
              href="/seo"
              className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink hover:bg-accent-2"
            >
              Open SEO tools
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const productLinks = [
    { href: "/seo/report", label: "SEO report" },
    { href: "/seo", label: "SEO tools" },
    { href: "/seo/indexability", label: "Indexability" },
    { href: "/seo/schema", label: "Schema" },
  ];
  const webmcpLinks = [
    { href: "/webmcp.json", label: "WebMCP manifest" },
    { href: "/.well-known/webmcp.json", label: ".well-known manifest" },
  ];
  const projectLinks = [
    { href: "https://github.com/dmuvaa/agent-search-console", label: "Source code" },
    { href: "https://github.com/dmuvaa/agent-search-console/blob/main/LICENSE", label: "MIT license" },
  ];

  return (
    <footer className="mt-auto border-t border-line/80 bg-card-2 text-sm text-muted">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-[1.3fr_2fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 text-foreground">
            <BrandMark className="size-8" />
            <span className="font-semibold tracking-tight">Agent Search Console</span>
          </Link>
          <p className="mt-4 max-w-sm leading-6">
            Technical SEO reports for people and agents, with the same evidence available in the UI and through WebMCP.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-line bg-card px-3 py-1 font-mono text-xs text-accent">
              10 SEO tools
            </span>
            <span className="rounded-full border border-line bg-card px-3 py-1 font-mono text-xs text-accent">
              WebMCP ready
            </span>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          <FooterLinks title="Product" links={productLinks} />
          <FooterLinks title="WebMCP" links={webmcpLinks} />
          <FooterLinks title="Project" links={projectLinks} />
        </div>
      </div>

      <div className="border-t border-line/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Agent Search Console. SEO for the Agentic Web.</p>
          <p>Public URL content is processed for analysis and is not kept as a permanent copy.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
