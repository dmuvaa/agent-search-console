"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function SiteHeader({ variant = "console" }: { variant?: "console" | "plain" }) {
  const pathname = usePathname();
  if (pathname.startsWith("/demo")) return null;

  return (
    <header className={cn("sticky top-0 z-30 border-b border-line/80 bg-background/80 backdrop-blur-md")}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-medium tracking-tight">
          <span className="grid h-6 w-6 place-items-center rounded-sm bg-accent text-[11px] font-bold text-accent-ink">
            A
          </span>
          <span>Agent Search Console</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted sm:gap-5">
          <Link href="/analyze" className="hover:text-foreground">
            Analyze
          </Link>
          <Link href="/dashboard" className="hidden hover:text-foreground sm:inline">
            Dashboard
          </Link>
          <Link href="/demo" className="hover:text-foreground">
            NovaShop
          </Link>
          {variant === "console" ? (
            <Link
              href="/analyze"
              className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink hover:bg-accent-2"
            >
              Analyze a website
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/demo")) return null;

  return (
    <footer className="mt-auto border-t border-line/80 py-8 text-sm text-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between">
        <p>Agent Search Console assessment scores are not an industry standard.</p>
        <p>Website content is processed for analysis and is not kept as a permanent copy.</p>
      </div>
    </footer>
  );
}
