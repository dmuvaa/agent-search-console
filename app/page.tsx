import { AnalyzeForm } from "@/components/analyze-form";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-line">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">SEO for the Agentic Web</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Can AI agents actually operate your website?
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
            Search engines needed sitemaps. Agents need tools. Paste any public URL — a store, SaaS app, or agency site — and get an Agent Readiness Score plus missing WebMCP operations.
          </p>
          <div className="mt-10 max-w-2xl">
            <AnalyzeForm />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:grid-cols-3">
        <Problem
          kicker="Humans"
          title="Interfaces that look obvious"
          body="Buttons, cards, and checkout steps are designed for eyes and pointers. Agents get unlabeled controls and mystery meat navigation."
        />
        <Problem
          kicker="Search engines"
          title="SEO was the last machine user"
          body="Title tags and structured data help crawlers index pages. They do not tell an agent how to search, filter, compare, or book."
        />
        <Problem
          kicker="Agents"
          title="A new class of user"
          body="WebMCP lets a site publish typed operations. Without them, agents scrape and guess. That is the new ranking problem."
        />
      </section>

      <section className="border-y border-line bg-[#0c0c0e]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">How it works</p>
          <div className="mt-8 grid gap-6 sm:grid-cols-4">
            {[
              ["01", "Paste a URL", "Any public http(s) site. Private networks are blocked."],
              ["02", "Extract", "Headings, forms, workflows, and declared WebMCP tools."],
              ["03", "Score", "Five categories, 20 points each, deterministic where possible."],
              ["04", "Act", "Issues, starter registerTool code, and task simulations."],
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
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Agent Readiness Score</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">A 0–100 assessment, not a standard.</h2>
            <p className="mt-4 text-muted leading-7">
              Discoverability, workflow access, WebMCP coverage, tool quality, and task simulation. Each category is 20 points. We label runtime tools we cannot verify instead of pretending a site has none.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted">
              <li>90–100 Excellent · 75–89 Strong · 60–74 Good</li>
              <li>40–59 Needs improvement · 0–39 Poor</li>
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-card p-6">
            <p className="text-sm text-muted">What we score on a live site</p>
            <div className="mt-6 space-y-2 text-sm">
              {[
                ["Discoverability", "Titles, headings, labeled UI"],
                ["Workflow access", "Search, contact, checkout, booking"],
                ["WebMCP coverage", "Declared tools for those jobs"],
                ["Tool quality", "Names, descriptions, schemas"],
                ["Task simulation", "Expected tool names present"],
              ].map(([label, n]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-line py-2">
                  <span>{label}</span>
                  <span className="text-right text-muted">{n}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted">
              Sites without WebMCP typically score in the 30s–50s. Sites that declare tools score much higher.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-[#0c0c0e]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">WebMCP</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">
            This console is a WebMCP site. Yours can be too.
          </h2>
          <p className="mt-4 max-w-2xl text-muted leading-7">
            Agent Search Console registers <code className="font-mono text-accent">analyze_website</code>,{" "}
            <code className="font-mono text-accent">get_issues</code>, and related tools on{" "}
            <code className="font-mono">document.modelContext</code>. Open it in ChatGPT’s in-app browser and ask it to analyze a URL. After you audit your own site, use the generator for starter <code className="font-mono">registerTool</code> code.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/analyze" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
              Analyze a website
            </Link>
            <Link href="/generator" className="rounded-md border border-line px-4 py-2 text-sm hover:bg-white/5">
              Starter WebMCP code
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Problem({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <article className="rounded-xl border border-line bg-card p-5">
      <p className="font-mono text-xs uppercase tracking-wide text-accent">{kicker}</p>
      <h2 className="mt-3 text-lg font-medium">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </article>
  );
}
