import Link from "next/link";
import type { Metadata } from "next";
import { SEO_TOOL_PAGES } from "@/lib/seo-tools/catalog";

export const metadata: Metadata = {
  title: "Technical SEO report and tools — Agent Search Console",
  description:
    "Generate a technical SEO report or run individual checkers for indexability, schema, robots.txt, sitemaps, redirects, HTTP headers, headings, meta tags, broken links, and SERP snippets.",
};

export default function SeoIndexPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Technical SEO</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight">
        One SEO report. Ten callable checks.
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
        Indexability, schema, robots.txt, sitemaps, redirects, headers, headings, meta tags,
        broken links, and SERP snippets. Run the full report for a prioritized action plan, or open
        each checker when you need the raw diagnostic view.
      </p>

      <section className="mt-10 rounded-xl border border-accent/30 bg-accent/5 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Full report</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Generate one SEO audit from all ten checks.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Humans get a report page they can save as PDF. Agents call <code className="font-mono text-accent">generate_seo_report</code> and receive structured sections, scores, findings, metrics, raw outputs, and a prioritized action plan.
            </p>
          </div>
          <Link href="/seo/report" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-accent-2">
            Generate report
          </Link>
        </div>
      </section>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {SEO_TOOL_PAGES.map((page) => (
          <Link
            key={page.slug}
            href={`/seo/${page.slug}`}
            className="rounded-xl border border-line bg-card p-5 hover:border-accent/40"
          >
            <p className="font-medium">{page.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted">{page.headline}</p>
            <p className="mt-3 font-mono text-[11px] text-accent">{`/seo/${page.slug}`}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
