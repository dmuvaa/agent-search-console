import Link from "next/link";
import { SEO_TOOL_PAGES } from "@/lib/seo-tools/catalog";

export default function Home() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-line">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">Technical SEO tools</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Technical SEO reports for humans and agents.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            Indexability, schema, robots.txt, sitemaps, redirects, HTTP headers, headings, meta
            tags, broken links, and SERP snippets. Paste a public URL to get a readable audit, or
            let ChatGPT call <code className="mx-1 font-mono text-accent">generate_seo_report</code> through WebMCP.
            The same scores, evidence, raw checker output, and action plan serve both workflows.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/seo/report" className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-ink hover:bg-accent-2">
              Generate SEO report
            </Link>
            <Link href="/seo" className="rounded-md border border-line px-5 py-3 text-sm font-semibold hover:bg-accent/10">
              Open SEO tools
            </Link>
            <Link href="/seo/indexability" className="rounded-md border border-line px-5 py-3 text-sm hover:bg-accent/10">
              Check indexability
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">The suite</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Ten checkers. One report generator.</h2>
          </div>
          <Link href="/seo" className="text-sm text-accent hover:underline">
            All tools →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SEO_TOOL_PAGES.map((page) => (
            <Link
              key={page.slug}
              href={`/seo/${page.slug}`}
              className="rounded-xl border border-line bg-card p-5 hover:border-accent/40"
            >
              <p className="font-medium">{page.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{page.summary}</p>
              <p className="mt-3 font-mono text-[11px] text-accent">{`/seo/${page.slug}`}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-card-2">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">How it works</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              ["01", "Fetch a public URL", "SSRF-safe. Timeouts, size caps, no private networks."],
              ["02", "Parse what crawlers see", "robots.txt, headers, HTML, JSON-LD, sitemap XML."],
              ["03", "Return an action plan", "People get a PDF-ready report. Agents get structured JSON with the same evidence."],
            ].map(([n, title, body]) => (
              <div key={n} className="rounded-xl border border-line bg-card p-5">
                <p className="font-mono text-xs text-accent">{n}</p>
                <h2 className="mt-3 text-lg font-medium">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Why this exists</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight">SEO first. Ready for agent workflows.</h2>
        <p className="mt-4 max-w-3xl leading-7 text-muted">
          Search engines were the original machine users of the web. Technical SEO is still how you
          control crawl, index, and snippet. This console keeps the report readable for people,
          while exposing the same checks through WebMCP so agents can continue the work from
          structured evidence.
        </p>
      </section>
    </main>
  );
}
