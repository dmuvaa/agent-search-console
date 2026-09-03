"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Code2,
  Copy,
  ExternalLink,
  FileJson,
  Link2,
  Loader2,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { SEO_TOOL_META, SEO_TOOL_PAGES, type SeoToolName } from "@/lib/seo-tools/catalog";

type Result = Record<string, unknown> | null;

export function SeoToolsRunner({
  tool,
  initialUrl = "",
}: {
  tool: SeoToolName;
  initialUrl?: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result>(null);

  const meta = SEO_TOOL_META[tool];
  const page = SEO_TOOL_PAGES.find((item) => item.name === tool);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = url.trim();
    if (!value) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/seo-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, url: value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Check failed");
      if (data.success === false && data.error) {
        setError(String(data.error));
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-line bg-card p-5"
      >
        <p className="text-sm text-muted">{meta.summary}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            name="url"
            id="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={page?.placeholder || "https://example.com"}
            className="h-12 flex-1 rounded-md border border-line bg-background px-4 outline-none ring-accent/40 placeholder:text-faint focus:ring-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-accent-ink hover:bg-accent-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {loading ? "Checking…" : page?.button || `Run ${meta.title}`}
          </button>
        </div>
      </form>

      {loading ? <LoadingReport title={meta.title} /> : null}

      {error ? (
        <p className="rounded-md border border-critical/40 bg-critical/10 px-4 py-3 text-sm text-critical">
          {error}
        </p>
      ) : null}

      {result ? <SeoResult tool={tool} result={result} /> : null}
    </div>
  );
}

function unescapeText(value: string) {
  if (!value.includes("\\n") || value.includes("\n")) return value;
  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"');
}

function LoadingReport({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-line bg-card p-8 text-center">
      <Loader2 className="mx-auto size-8 animate-spin text-accent" />
      <p className="mt-4 font-medium">Running {title.toLowerCase()}…</p>
      <p className="mt-1 text-sm text-muted">Fetching the URL, parsing crawler-visible signals, and shaping the report.</p>
    </div>
  );
}

function SeoResult({ tool, result }: { tool: SeoToolName; result: Record<string, unknown> }) {
  const issues = Array.isArray(result.issues) ? (result.issues as { severity?: string; message?: string }[]) : [];
  const warnings = Array.isArray(result.warnings) ? (result.warnings as string[]) : [];
  const meta = SEO_TOOL_META[tool];
  const stats = statsFor(tool, result);

  if (result.success === false) {
    return (
      <ReportShell title={meta.title} url={String(result.url || "")}>
        <div className="rounded-xl border border-critical/40 bg-critical/10 p-5">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 size-5 shrink-0 text-critical" />
            <div>
              <p className="font-medium text-critical">The check could not complete</p>
              <p className="mt-1 text-sm text-muted">{String(result.error || "The URL could not be analyzed.")}</p>
            </div>
          </div>
        </div>
        <RawJson result={result} />
      </ReportShell>
    );
  }

  return (
    <ReportShell title={meta.title} url={String(result.url || "")}>
      {stats.length > 0 ? <StatGrid stats={stats} /> : <SummaryBar result={result} />}
      <Findings issues={issues} warnings={warnings} />
      <ToolSpecific tool={tool} result={result} />
      <RawJson result={result} />
    </ReportShell>
  );
}

function ReportShell({
  title,
  url,
  children,
}: {
  title: string;
  url: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Analysis complete</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
            {url ? <p className="mt-1 break-all text-sm text-muted">{url}</p> : null}
          </div>
          <StatusBadge tone="good">
            <ShieldCheck className="size-3" />
            Structured output
          </StatusBadge>
        </div>
      </div>
      {children}
    </section>
  );
}

type StatTone = "good" | "high" | "critical" | "muted" | "accent";

function StatGrid({
  stats,
}: {
  stats: Array<{ label: string; value: string | number; detail?: string; tone?: StatTone }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className={`rounded-xl border p-5 ${toneClasses(stat.tone || "muted")}`}>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-80">{stat.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{stat.value}</p>
          {stat.detail ? <p className="mt-1 text-xs opacity-80">{stat.detail}</p> : null}
        </div>
      ))}
    </div>
  );
}

function Findings({
  issues,
  warnings,
}: {
  issues: { severity?: string; message?: string; type?: string; detail?: string }[];
  warnings: string[];
}) {
  const rows = [
    ...issues.map((issue) => ({
      severity: issue.severity || "warning",
      message: issue.message || issue.detail || issue.type || "Issue detected.",
    })),
    ...warnings.map((warning) => ({ severity: "warning", message: warning })),
  ];

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-good/30 bg-good/5 p-5 text-sm">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-good" />
          <div>
            <p className="font-medium text-good">No immediate problems in this check</p>
            <p className="mt-1 text-muted">Review the details below for the full technical output.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-card p-5">
      <h3 className="text-sm font-medium">Findings</h3>
      <ul className="mt-4 space-y-3 text-sm">
        {rows.map((row, index) => (
          <li key={`${row.message}-${index}`} className="flex items-start gap-3">
            {row.severity === "error" || row.severity === "critical" || row.severity === "high" ? (
              <XCircle className="mt-0.5 size-4 shrink-0 text-critical" />
            ) : (
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-high" />
            )}
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted">{row.severity}</span>
              <p className="mt-0.5">{row.message}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RawJson({ result }: { result: Record<string, unknown> }) {
  return (
    <details className="rounded-xl border border-line bg-card">
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm text-muted">
        <FileJson className="size-4" />
        Raw JSON for agents
      </summary>
      <pre className="overflow-x-auto border-t border-line bg-background p-4 text-xs leading-5 text-muted">
        {JSON.stringify(result, null, 2)}
      </pre>
    </details>
  );
}

function statsFor(tool: SeoToolName, result: Record<string, unknown>) {
  const summary = result.summary && typeof result.summary === "object"
    ? (result.summary as Record<string, unknown>)
    : {};
  const stats: Array<{ label: string; value: string | number; detail?: string; tone?: StatTone }> = [];

  if (tool === "check_schema") {
    stats.push(
      { label: "Pages crawled", value: numberOrDash(result.pagesCrawled), tone: "accent" },
      { label: "With schema", value: numberOrDash(result.pagesWithSchema), tone: numberTone(result.pagesWithSchema) },
      { label: "Errors", value: numberOrDash(result.pagesWithErrors), tone: Number(result.pagesWithErrors || 0) > 0 ? "critical" : "good" },
      { label: "Opportunity", value: numberOrDash(result.opportunityScore), detail: "Schema score", tone: scoreTone(result.opportunityScore) },
    );
  }

  if (tool === "check_robots_txt") {
    stats.push(
      { label: "Status", value: result.status ? `HTTP ${result.status}` : "Missing", tone: result.success === false ? "critical" : "good" },
      { label: "Rules", value: Array.isArray(result.rules) ? result.rules.length : 0, tone: "accent" },
      { label: "Sitemaps", value: Array.isArray(result.sitemaps) ? result.sitemaps.length : 0, tone: numberTone(Array.isArray(result.sitemaps) ? result.sitemaps.length : 0) },
      { label: "File", value: result.success === false ? "Unavailable" : "Readable", tone: result.success === false ? "critical" : "good" },
    );
  }

  if (tool === "check_sitemap") {
    stats.push(
      { label: "Total URLs", value: numberOrDash(summary.total), tone: "accent" },
      { label: "Checked", value: numberOrDash(summary.checked), tone: "muted" },
      { label: "Valid", value: numberOrDash(summary.valid), tone: "good" },
      { label: "Broken", value: numberOrDash(summary.broken), tone: Number(summary.broken || 0) > 0 ? "critical" : "good" },
    );
  }

  if (tool === "check_redirects") {
    const chainLength = Array.isArray(result.chain) ? result.chain.length : 0;
    stats.push(
      { label: "Hops", value: chainLength, tone: chainLength > 2 ? "high" : "good" },
      { label: "Total time", value: `${numberOrDash(result.totalTimeMs)}ms`, tone: Number(result.totalTimeMs || 0) > 1000 ? "high" : "muted" },
      { label: "Loop", value: result.loopDetected ? "Detected" : "None", tone: result.loopDetected ? "critical" : "good" },
      { label: "Final", value: result.finalUrl ? "Resolved" : "Unknown", tone: result.finalUrl ? "good" : "high" },
    );
  }

  if (tool === "check_http_headers") {
    const security = Array.isArray(result.securityHeaders)
      ? (result.securityHeaders as { present: boolean }[])
      : [];
    const present = security.filter((item) => item.present).length;
    stats.push(
      { label: "Status", value: result.status ? `HTTP ${result.status}` : "Unknown", tone: "accent" },
      { label: "Headers", value: Array.isArray(result.headers) ? result.headers.length : 0, tone: "muted" },
      { label: "Security", value: `${present}/${security.length}`, detail: "Recommended headers present", tone: present === security.length ? "good" : "high" },
      { label: "Content type", value: String(result.contentType || "Missing"), tone: result.contentType ? "good" : "high" },
    );
  }

  if (tool === "check_headings") {
    const counts = result.counts && typeof result.counts === "object" ? (result.counts as Record<string, unknown>) : {};
    const total = Array.isArray(result.headings) ? result.headings.length : 0;
    stats.push(
      { label: "Headings", value: total, tone: total > 0 ? "accent" : "critical" },
      { label: "H1 count", value: numberOrDash(counts[1] ?? counts["1"]), tone: Number(counts[1] ?? counts["1"] ?? 0) === 1 ? "good" : "high" },
      { label: "Warnings", value: Array.isArray(result.warnings) ? result.warnings.length : 0, tone: Array.isArray(result.warnings) && result.warnings.length > 0 ? "high" : "good" },
      { label: "Depth", value: deepestHeading(result.headings), detail: "Deepest heading level", tone: "muted" },
    );
  }

  if (tool === "check_meta_tags") {
    const tags = Array.isArray(result.tags) ? (result.tags as { status?: string }[]) : [];
    stats.push(
      { label: "Tags checked", value: tags.length, tone: "accent" },
      { label: "OK", value: tags.filter((tag) => tag.status === "ok").length, tone: "good" },
      { label: "Warnings", value: tags.filter((tag) => tag.status === "warn").length, tone: tags.some((tag) => tag.status === "warn") ? "high" : "good" },
      { label: "Errors", value: tags.filter((tag) => tag.status === "error").length, tone: tags.some((tag) => tag.status === "error") ? "critical" : "good" },
    );
  }

  if (tool === "check_indexability") {
    stats.push(
      { label: "Total", value: numberOrDash(summary.total), tone: "accent" },
      { label: "Indexable", value: numberOrDash(summary.indexable), tone: Number(summary.indexable || 0) > 0 ? "good" : "critical" },
      { label: "Noindex", value: numberOrDash(summary.noindex), tone: Number(summary.noindex || 0) > 0 ? "high" : "good" },
      { label: "Blocked/errors", value: Number(summary.blocked || 0) + Number(summary.errors || 0), tone: Number(summary.blocked || 0) + Number(summary.errors || 0) > 0 ? "critical" : "good" },
    );
  }

  if (tool === "check_broken_links") {
    stats.push(
      { label: "Checked", value: numberOrDash(summary.checked ?? summary.totalChecked), tone: "accent" },
      { label: "Healthy", value: numberOrDash(summary.healthy ?? summary.okCount), tone: "good" },
      { label: "Broken", value: numberOrDash(summary.broken ?? summary.brokenCount), tone: Number(summary.broken ?? summary.brokenCount ?? 0) > 0 ? "critical" : "good" },
      { label: "Redirects", value: numberOrDash(summary.redirects), tone: Number(summary.redirects || 0) > 0 ? "high" : "good" },
    );
  }

  if (tool === "preview_serp_snippet") {
    const analysis = result.analysis && typeof result.analysis === "object"
      ? (result.analysis as Record<string, unknown>)
      : {};
    const measurements = result.measurements && typeof result.measurements === "object"
      ? (result.measurements as Record<string, unknown>)
      : {};
    stats.push(
      { label: "Rewrite risk", value: String(result.rewriteRisk || analysis.rewriteRisk || "unknown"), tone: riskTone(result.rewriteRisk || analysis.rewriteRisk) },
      { label: "Title width", value: `${numberOrDash(analysis.titlePx ?? measurements.titlePx)}px`, tone: analysis.titleTruncated ? "high" : "good" },
      { label: "Description", value: `${numberOrDash(analysis.descLength)} chars`, tone: analysis.descTruncated ? "high" : "good" },
      { label: "Canonical", value: result.canonical ? "Set" : "Missing", tone: result.canonical ? "good" : "high" },
    );
  }

  return stats;
}

function StatusBadge({ tone, children }: { tone: StatTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wide ${toneClasses(tone)}`}>
      {children}
    </span>
  );
}

function toneClasses(tone: StatTone) {
  if (tone === "good") return "border-good/30 bg-good/5 text-good";
  if (tone === "critical") return "border-critical/30 bg-critical/5 text-critical";
  if (tone === "high") return "border-high/30 bg-high/5 text-high";
  if (tone === "accent") return "border-accent/30 bg-accent/5 text-accent";
  return "border-line bg-card text-muted";
}

function numberOrDash(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : "—";
}

function numberTone(value: unknown): StatTone {
  return Number(value || 0) > 0 ? "good" : "high";
}

function scoreTone(value: unknown): StatTone {
  const score = Number(value || 0);
  if (score >= 80) return "good";
  if (score >= 50) return "high";
  return "critical";
}

function riskTone(value: unknown): StatTone {
  if (value === "low") return "good";
  if (value === "high") return "critical";
  return "high";
}

function statusTone(value: unknown): StatTone {
  if (value === "ok" || value === "present" || value === true) return "good";
  if (value === "error" || value === "missing" || value === "broken" || value === false) return "critical";
  return "high";
}

function linkStatusTone(status: "ok" | "redirect" | "warning" | "broken" | "skipped"): StatTone {
  if (status === "ok") return "good";
  if (status === "broken") return "critical";
  return "high";
}

function deepestHeading(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return "—";
  const levels = value
    .map((item) => (item && typeof item === "object" ? Number((item as { level?: unknown }).level) : 0))
    .filter(Boolean);
  return levels.length ? `H${Math.max(...levels)}` : "—";
}

function SummaryBar({ result }: { result: Record<string, unknown> }) {
  const chips = useMemo(() => {
    const items: string[] = [];
    if (typeof result.url === "string") items.push(result.url);
    if (typeof result.status === "number") items.push(`HTTP ${result.status}`);
    if (typeof result.indexable === "boolean") items.push(result.indexable ? "Indexable" : "Not indexable");
    if (result.summary && typeof result.summary === "object") {
      const summary = result.summary as Record<string, unknown>;
      if (typeof summary.total === "number") items.push(`${summary.total} URLs`);
      if (typeof summary.checked === "number") items.push(`${summary.checked} checked`);
      if (typeof summary.indexable === "number") items.push(`${summary.indexable} indexable`);
      if (typeof summary.valid === "number") items.push(`${summary.valid} valid`);
      if (typeof summary.broken === "number") items.push(`${summary.broken} broken`);
      if (typeof summary.redirects === "number") items.push(`${summary.redirects} redirects`);
    }
    if (typeof result.opportunityScore === "number") items.push(`Score ${result.opportunityScore}`);
    if (typeof result.loopDetected === "boolean" && result.loopDetected) items.push("Redirect loop");
    if (typeof result.rewriteRisk === "string") items.push(`Rewrite risk: ${result.rewriteRisk}`);
    return items;
  }, [result]);

  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span key={chip} className="rounded-full border border-line bg-card px-3 py-1 font-mono text-xs">
          {chip}
        </span>
      ))}
    </div>
  );
}

function Panel({ title, extra, children }: { title: string; extra?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <h2 className="text-sm font-medium">{title}</h2>
        {extra ? <span className="font-mono text-[10px] uppercase tracking-wide text-muted">{extra}</span> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function ToolSpecific({ tool, result }: { tool: SeoToolName; result: Record<string, unknown> }) {
  if (tool === "check_robots_txt") return <RobotsView result={result} />;
  if (tool === "check_schema") return <SchemaView result={result} />;
  if (tool === "check_meta_tags" && Array.isArray(result.tags)) return <MetaView tags={result.tags as TagRow[]} />;
  if (tool === "check_headings" && Array.isArray(result.headings)) return <HeadingsView result={result} />;
  if (tool === "check_redirects" && Array.isArray(result.chain)) {
    return <RedirectsView chain={result.chain as { url: string; status: number; timeMs: number }[]} />;
  }
  if (tool === "check_http_headers") return <HeadersView result={result} />;
  if (tool === "check_sitemap") return <SitemapView result={result} />;
  if (tool === "check_indexability") return <IndexabilityView result={result} />;
  if (tool === "check_broken_links") return <BrokenLinksView result={result} />;
  if (tool === "preview_serp_snippet") return <SerpPreviewView result={result} />;
  return null;
}

function RobotsView({ result }: { result: Record<string, unknown> }) {
  const content = unescapeText(typeof result.content === "string" ? result.content : "");
  const sitemaps = Array.isArray(result.sitemaps) ? (result.sitemaps as string[]) : [];
  const rules = Array.isArray(result.rules)
    ? (result.rules as { userAgent: string; type: "allow" | "disallow"; path: string }[])
    : [];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Panel title="robots.txt source" extra={typeof result.status === "number" ? `HTTP ${result.status}` : undefined}>
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-6">
            {content
              ? content.split("\n").map((line, index) => {
                  const lower = line.toLowerCase().trim();
                  let color = "text-foreground";
                  if (lower.startsWith("#")) color = "text-faint";
                  else if (lower.startsWith("allow:")) color = "text-good";
                  else if (lower.startsWith("disallow:")) color = "text-critical";
                  else if (lower.startsWith("sitemap:")) color = "text-accent";
                  else if (lower.startsWith("user-agent:")) color = "font-semibold text-accent";
                  return (
                    <span key={index} className={`block ${color}`}>
                      {line || " "}
                    </span>
                  );
                })
              : <span className="italic text-muted">Empty file</span>}
          </pre>
        </Panel>

        <Panel title="Extracted directives">
          {rules.length === 0 ? (
            <p className="text-sm italic text-muted">No explicit crawl rules found in this file.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="pb-2 pr-4 font-medium">User-agent</th>
                    <th className="pb-2 pr-4 font-medium">Directive</th>
                    <th className="pb-2 font-medium">Path</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule, index) => (
                    <tr key={`${rule.userAgent}-${rule.path}-${index}`} className="border-t border-line">
                      <td className="py-2 pr-4 font-mono text-xs">{rule.userAgent}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`font-mono text-[11px] uppercase ${
                            rule.type === "allow" ? "text-good" : "text-critical"
                          }`}
                        >
                          {rule.type}
                        </span>
                      </td>
                      <td className="py-2 font-mono text-xs">{rule.path}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel title="Status">
          <p className="font-medium">{result.success === false ? "Unavailable" : "Active and accessible"}</p>
          <p className="mt-1 text-sm text-muted">HTTP {String(result.status ?? "—")}</p>
        </Panel>
        <Panel title="Declared sitemaps" extra={String(sitemaps.length)}>
          {sitemaps.length === 0 ? (
            <p className="text-sm italic text-muted">No sitemap locations were specified.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {sitemaps.map((sitemap) => (
                <li key={sitemap} className="flex items-start gap-2 break-all">
                  <Link2 className="mt-0.5 size-4 shrink-0 text-accent" />
                  <a href={sitemap} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                    {sitemap}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function SchemaView({ result }: { result: Record<string, unknown> }) {
  const schemaTypes = Object.keys((result.schemaTypeDistribution as Record<string, number>) || {});
  const eligible = Array.isArray(result.eligibleRichResults)
    ? (result.eligibleRichResults as { name?: string; eligible?: boolean; reason?: string }[])
    : [];
  const pages = Array.isArray(result.pages)
    ? (result.pages as { url?: string; schemaTypes?: string[]; jsonLd?: string[]; errors?: string[]; warnings?: string[] }[])
    : [];
  const page = pages[0];
  const rawBlocks = page?.jsonLd || [];
  const pageErrors = page?.errors || [];
  const pageWarnings = page?.warnings || [];

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.7fr]">
      <aside className="space-y-4">
        <Panel title="Analysis summary">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-accent text-accent-ink">
              <FileJson className="size-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold">Schema payloads</h3>
              <p className="mt-1 break-all text-sm text-muted">{domainFromUrl(String(result.url || page?.url || ""))}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3">
            <SummaryMetric label="Schema types" value={`${schemaTypes.length} detected`} tone={schemaTypes.length ? "good" : "high"} />
            <SummaryMetric label="Payloads" value={`${rawBlocks.length} blocks`} tone={rawBlocks.length ? "accent" : "high"} />
            <SummaryMetric label="Parse errors" value={String(result.pagesWithErrors ?? pageErrors.length)} tone={Number(result.pagesWithErrors || pageErrors.length) > 0 ? "critical" : "good"} />
            {typeof result.opportunityScore === "number" ? (
              <SummaryMetric label="Opportunity score" value={String(result.opportunityScore)} tone={scoreTone(result.opportunityScore)} />
            ) : null}
          </dl>
        </Panel>

        <Panel title="Detected types" extra={String(schemaTypes.length)}>
          {schemaTypes.length === 0 ? (
            <p className="text-sm italic text-muted">No Schema.org types were detected.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {schemaTypes.map((type) => (
                <span key={type} className="rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent">
                  {type}
                </span>
              ))}
            </div>
          )}
        </Panel>

        {eligible.length > 0 ? (
          <Panel title="Rich result checks">
            <ul className="space-y-3 text-sm">
              {eligible.map((item) => (
                <li key={item.name} className="rounded-lg border border-line bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{item.name || "Rich result"}</span>
                    <StatusBadge tone={item.eligible ? "good" : "high"}>
                      {item.eligible ? "Eligible" : "Not eligible"}
                    </StatusBadge>
                  </div>
                  {item.reason ? <p className="mt-2 text-xs text-muted">{item.reason}</p> : null}
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {pageErrors.length || pageWarnings.length ? (
          <Panel title="Payload notes">
            <ul className="space-y-2 text-sm">
              {[...pageErrors, ...pageWarnings].map((message) => (
                <li key={message} className="flex items-start gap-2 text-high">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>{message}</span>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </aside>

      <section className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="size-5 text-accent" />
            <h3 className="text-xl font-semibold">Detected JSON-LD ({rawBlocks.length} blocks)</h3>
          </div>
          {rawBlocks.length > 0 ? <StatusBadge tone="good">Crawler-visible</StatusBadge> : null}
        </div>

        {rawBlocks.length === 0 ? (
          <Panel title="Detected JSON-LD">
            <p className="text-sm italic text-muted">No JSON-LD script blocks were found in the fetched HTML.</p>
          </Panel>
        ) : (
          rawBlocks.map((block, index) => (
            <JsonCodeBlock
              key={`${index}-${block.slice(0, 24)}`}
              code={prettyJson(block)}
              title={jsonBlockTitle(block, index)}
              defaultExpanded={index === 0}
            />
          ))
        )}
      </section>
    </div>
  );
}

function SummaryMetric({ label, value, tone }: { label: string; value: string; tone: StatTone }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-background px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`rounded-full border px-2.5 py-1 font-mono text-xs ${toneClasses(tone)}`}>{value}</dd>
    </div>
  );
}

function JsonCodeBlock({
  code,
  title,
  defaultExpanded,
}: {
  code: string;
  title: string;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-background px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex min-w-0 items-center gap-2 text-left"
        >
          <ChevronDown className={`size-4 shrink-0 text-muted transition ${expanded ? "" : "-rotate-90"}`} />
          <span className="truncate font-semibold">{title}</span>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase text-accent">json</span>
        </button>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:text-foreground"
        >
          <Copy className="size-3.5" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {expanded ? (
        <div className="max-h-[720px] overflow-auto p-4">
          <pre className="min-w-max font-mono text-sm leading-6">
            {lines.map((line, index) => (
              <code key={index} className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="select-none text-right text-muted">{index + 1}</span>
                <span className="whitespace-pre text-foreground">{line || " "}</span>
              </code>
            ))}
          </pre>
        </div>
      ) : null}
    </article>
  );
}

type TagRow = { tagName: string; value: string; status: string; message: string };

function MetaView({ tags }: { tags: TagRow[] }) {
  return (
    <Panel title="Metadata checks" extra={`${tags.length} fields`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="pb-2 pr-4 font-medium">Field</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 font-medium">Value and guidance</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.tagName} className="border-t border-line align-top">
                <td className="py-3 pr-4 font-medium">{tag.tagName}</td>
                <td className="py-3 pr-4">
                  <StatusBadge tone={statusTone(tag.status)}>{tag.status}</StatusBadge>
                </td>
                <td className="py-3">
                  <p className="text-muted">{tag.message}</p>
                  {tag.value ? (
                    <p className="mt-2 whitespace-pre-wrap break-words font-mono text-xs">{unescapeText(tag.value)}</p>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function HeadingsView({ result }: { result: Record<string, unknown> }) {
  const headings = result.headings as { level: number; text: string }[];
  const counts = result.counts && typeof result.counts === "object" ? (result.counts as Record<string, number>) : {};

  return (
    <div className="space-y-4">
      <Panel title="Heading count by level">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <div key={level} className="rounded-lg border border-line bg-background p-3 text-center">
              <p className="font-mono text-[10px] uppercase text-muted">H{level}</p>
              <p className="mt-1 text-2xl font-semibold">{counts[level] || 0}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Document outline" extra={`${headings.length} headings`}>
        {headings.length === 0 ? (
          <p className="text-sm italic text-muted">No H1-H6 headings found in the HTML source.</p>
        ) : (
          <ol className="space-y-1 text-sm">
            {headings.map((heading, index) => (
              <li
                key={`${heading.level}-${index}`}
                className="border-l border-line py-1"
                style={{ paddingLeft: `${Math.max(0, heading.level - 1) * 14 + 12}px` }}
              >
                <span className="mr-2 font-mono text-xs text-accent">H{heading.level}</span>
                {heading.text}
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}

function RedirectsView({ chain }: { chain: { url: string; status: number; timeMs: number }[] }) {
  return (
    <Panel title="Redirect chain" extra={`${chain.length} hops`}>
      <ol className="space-y-3 text-sm">
        {chain.map((hop, index) => (
          <li key={`${hop.url}-${index}`} className="grid gap-2 rounded-lg border border-line bg-background p-3 sm:grid-cols-[5rem_1fr_5rem]">
            <StatusBadge tone={hop.status >= 300 && hop.status < 400 ? "high" : hop.status >= 400 ? "critical" : "good"}>
              {hop.status}
            </StatusBadge>
            <span className="break-all">{hop.url}</span>
            <span className="font-mono text-xs text-muted">{hop.timeMs}ms</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function HeadersView({ result }: { result: Record<string, unknown> }) {
  const security = Array.isArray(result.securityHeaders)
    ? (result.securityHeaders as { name: string; present: boolean; value?: string; description: string }[])
    : [];
  const headers = Array.isArray(result.headers)
    ? (result.headers as { name: string; value: string }[])
    : [];

  return (
    <div className="space-y-4">
      <Panel title="Response">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="HTTP status" value={`${String(result.status ?? "—")} ${String(result.statusText ?? "")}`.trim()} />
          <Metric label="Server" value={String(result.server || "Not exposed")} />
          <Metric label="Content type" value={String(result.contentType || "Missing")} />
        </div>
      </Panel>
      {security.length > 0 ? (
        <Panel title="Security headers">
          <ul className="grid gap-3 sm:grid-cols-2">
            {security.map((item) => (
              <li key={item.name} className={`rounded-lg border p-4 ${toneClasses(item.present ? "good" : "critical")}`}>
                <div className="flex items-start gap-3">
                  {item.present ? (
                    <ShieldCheck className="mt-0.5 size-5 shrink-0" />
                  ) : (
                    <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold">{item.name}</p>
                    <p className="mt-1 text-xs opacity-80">{item.description}</p>
                  </div>
                </div>
                {item.value ? (
                  <p className="mt-3 break-all rounded-md border border-current/20 p-2 font-mono text-xs opacity-80">{item.value}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      {headers.length > 0 ? (
        <Panel title="All headers">
          <dl className="space-y-2 text-sm">
            {headers.map((header) => (
              <div key={header.name} className="grid gap-1 sm:grid-cols-[12rem_1fr]">
                <dt className="font-mono text-xs text-muted">{header.name}</dt>
                <dd className="break-all">{header.value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      ) : null}
    </div>
  );
}

function SitemapView({ result }: { result: Record<string, unknown> }) {
  const urls = Array.isArray(result.urls)
    ? (result.urls as { loc: string; lastmod?: string; status?: number | null }[])
    : [];
  const summary = (result.summary as Record<string, number> | undefined) || {};

  return (
    <div className="space-y-4">
      <Panel title="Sitemap discovery">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Sitemap URL" value={String(result.url || "Auto-discovered")} />
          <Metric label="URLs discovered" value={String(summary.total ?? urls.length)} />
          <Metric label="Broken discovered" value={String(summary.broken ?? 0)} />
        </div>
      </Panel>
      <Panel title="Sitemap URLs" extra={summary.total ? `${summary.total} total` : undefined}>
        {urls.length === 0 ? (
          <p className="text-sm italic text-muted">No sitemap URLs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">URL</th>
                  <th className="pb-2 font-medium">Last modified</th>
                </tr>
              </thead>
              <tbody>
                {urls.map((entry) => (
                  <tr key={entry.loc} className="border-t border-line align-top">
                    <td className="py-3 pr-4">
                      {entry.status != null ? (
                        <StatusBadge tone={entry.status >= 400 ? "critical" : entry.status >= 300 ? "high" : "good"}>
                          {entry.status}
                        </StatusBadge>
                      ) : (
                        <span className="font-mono text-xs text-muted">Not checked</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <a href={entry.loc} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2 break-all text-accent hover:underline">
                        <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
                        {entry.loc}
                      </a>
                    </td>
                    <td className="py-3 text-muted">{entry.lastmod || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function IndexabilityView({ result }: { result: Record<string, unknown> }) {
  const rows = Array.isArray(result.results)
    ? (result.results as {
        url: string;
        finalUrl: string;
        status: number;
        canonical: string;
        noindex: boolean;
        robotsBlocked: boolean;
        isRedirect: boolean;
        indexable: boolean;
      }[])
    : [];

  return (
    <Panel title="Indexability">
      {rows.length === 0 ? (
        <p className="text-sm italic text-muted">No results.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="pb-2 pr-4 font-medium">Index status</th>
                <th className="pb-2 pr-4 font-medium">Signals</th>
                <th className="pb-2 font-medium">URL</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.url} className="border-t border-line align-top">
                  <td className="py-3 pr-4">
                    <StatusBadge tone={row.indexable ? "good" : "high"}>
                      {row.indexable ? "Indexable" : "Not indexable"}
                    </StatusBadge>
                    <p className="mt-2 font-mono text-xs text-muted">HTTP {row.status}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={row.noindex ? "high" : "good"}>{row.noindex ? "noindex" : "index allowed"}</StatusBadge>
                      <StatusBadge tone={row.robotsBlocked ? "critical" : "good"}>
                        {row.robotsBlocked ? "robots blocked" : "robots allowed"}
                      </StatusBadge>
                      <StatusBadge tone={row.isRedirect ? "high" : "good"}>
                        {row.isRedirect ? "redirect" : "direct"}
                      </StatusBadge>
                    </div>
                    {row.canonical ? <p className="mt-2 break-all text-xs text-muted">Canonical: {row.canonical}</p> : null}
                    {row.isRedirect ? <p className="mt-1 break-all text-xs text-muted">Final URL: {row.finalUrl}</p> : null}
                  </td>
                  <td className="py-3">
                    <a href={row.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2 break-all text-accent hover:underline">
                      <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
                      {row.url}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function BrokenLinksView({ result }: { result: Record<string, unknown> }) {
  const links = Array.isArray(result.links)
    ? (result.links as {
        href: string;
        text: string;
        kind: "internal" | "external";
        status: "ok" | "redirect" | "warning" | "broken" | "skipped";
        statusCode: number | null;
        finalUrl: string | null;
        note: string;
      }[])
    : [];
  const summary = result.summary && typeof result.summary === "object"
    ? (result.summary as Record<string, unknown>)
    : {};
  const broken = links.filter((link) => link.status === "broken");
  const redirects = links.filter((link) => link.status === "redirect");
  const prioritized = [...links].sort((left, right) => {
    const rank = { broken: 0, redirect: 1, warning: 2, skipped: 3, ok: 4 };
    return rank[left.status] - rank[right.status];
  });

  return (
    <div className="space-y-4">
      <Panel title="Link health summary">
        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="Internal" value={String(summary.internal ?? 0)} />
          <Metric label="External" value={String(summary.external ?? 0)} />
          <Metric label="Broken" value={String(summary.broken ?? summary.brokenCount ?? broken.length)} />
          <Metric label="Redirecting" value={String(summary.redirects ?? redirects.length)} />
        </div>
        {links.length > 0 && broken.length === 0 ? (
          <div className="mt-5 rounded-lg border border-good/30 bg-good/5 p-4 text-sm text-good">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
              <p>All evaluated links resolved without hard failures.</p>
            </div>
          </div>
        ) : null}
      </Panel>

      {broken.length > 0 ? (
        <Panel title="Broken links to fix first" extra={`${broken.length} found`}>
          <ul className="divide-y divide-line text-sm">
            {broken.map((link) => (
              <li key={link.href} className="py-3 first:pt-0 last:pb-0">
                <a href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2 break-all text-critical hover:underline">
                  <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
                  {link.href}
                </a>
                <p className="mt-1 text-xs text-muted">Anchor: {link.text || "No anchor text"}</p>
                <p className="mt-1 font-mono text-xs text-critical">HTTP {link.statusCode || "timeout"} · {link.note}</p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel title="Checked links" extra={String(links.length)}>
        {links.length === 0 ? (
          <p className="text-sm italic text-muted">No crawlable links found on this page.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Kind</th>
                  <th className="pb-2 pr-4 font-medium">Anchor</th>
                  <th className="pb-2 font-medium">URL</th>
                </tr>
              </thead>
              <tbody>
                {prioritized.map((link) => (
                  <tr key={link.href} className="border-t border-line align-top">
                    <td className="py-3 pr-4">
                      <StatusBadge tone={linkStatusTone(link.status)}>
                        {link.statusCode ? `${link.statusCode} ` : ""}
                        {link.status}
                      </StatusBadge>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-muted">{link.kind}</td>
                    <td className="max-w-56 py-3 pr-4 text-muted">{link.text || "No anchor text"}</td>
                    <td className="py-3">
                      <a href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2 break-all text-accent hover:underline">
                        <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
                        {link.href}
                      </a>
                      {link.finalUrl && link.finalUrl !== link.href ? (
                        <p className="mt-1 break-all text-xs text-muted">Final URL: {link.finalUrl}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted">{link.note}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function SerpPreviewView({ result }: { result: Record<string, unknown> }) {
  const snippet = (result.snippet as Record<string, string> | undefined) || {};
  const measurements = (result.measurements as Record<string, unknown> | undefined) || {};
  const comparisons = (result.comparisons as Record<string, unknown> | undefined) || {};
  const reasons = Array.isArray(result.rewriteReasons) ? (result.rewriteReasons as string[]) : [];
  const tone = riskTone(result.rewriteRisk);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <Panel title="Search preview">
        <div className="rounded-lg border border-line bg-card p-5 shadow-sm">
          <p className="flex items-start gap-2 break-all text-sm text-good">
            <Link2 className="mt-0.5 size-4 shrink-0" />
            {snippet.displayUrl || String(result.url || "")}
          </p>
          <h2 className="mt-1 text-xl font-medium leading-7 text-[#8ab4f8]">
            {snippet.displayTitle || "Untitled page"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {snippet.displayDescription || "No meta description was found."}
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric label="Title tag" value={String(result.title || "Missing")} />
          <Metric label="Meta description" value={String(result.metaDesc || "Missing")} />
          <Metric label="H1" value={String(comparisons.h1 || result.h1 || "Not found")} />
          <Metric label="Canonical" value={String(snippet.canonical || result.canonical || "Missing")} />
        </div>
      </Panel>

      <div className="space-y-4">
        <Panel title="Snippet measurements">
          <div className={`mb-4 rounded-lg border p-4 ${toneClasses(tone)}`}>
            <p className="font-mono text-[10px] uppercase tracking-wide opacity-80">Rewrite risk</p>
            <p className="mt-1 text-2xl font-semibold capitalize">{String(result.rewriteRisk || "unknown")}</p>
          </div>
          <dl className="space-y-3 text-sm">
            <Metric label="Title" value={`${measurements.titleLength ?? 0} chars / ${measurements.titlePx ?? 0}px`} />
            <Metric
              label="Description"
              value={`${measurements.descriptionLength ?? 0} chars / ${measurements.descriptionPx ?? 0}px`}
            />
            <Metric label="H1/title match" value={String(comparisons.h1 || "Not found")} />
            <Metric label="Open Graph title" value={String(comparisons.ogTitle || "Not found")} />
          </dl>
        </Panel>
        {reasons.length > 0 ? (
          <Panel title="Rewrite and truncation notes">
            <ul className="list-disc space-y-1 pl-5 text-sm text-high">
              {reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 break-words">{value}</dd>
    </div>
  );
}

function prettyJson(raw: string) {
  const text = unescapeText(raw);
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

function domainFromUrl(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value || "Unknown URL";
  }
}

function jsonBlockTitle(raw: string, index: number) {
  const parsed = parseJson(raw);
  const type = schemaType(parsed) || `JSON-LD block ${index + 1}`;
  const name = schemaName(parsed);
  return name ? `${type} · ${name}` : type;
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(unescapeText(raw));
  } catch {
    return null;
  }
}

function schemaType(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(schemaType).filter(Boolean).join(", ");
  }
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  const graph = record["@graph"];
  if (Array.isArray(graph)) {
    return graph.map(schemaType).filter(Boolean).join(", ");
  }
  const type = record["@type"];
  return Array.isArray(type) ? type.join(", ") : typeof type === "string" ? type : "";
}

function schemaName(value: unknown): string {
  if (Array.isArray(value)) return schemaName(value[0]);
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  const graph = record["@graph"];
  if (Array.isArray(graph)) return schemaName(graph[0]);
  const name = record.name || record.headline || record.serviceType;
  return typeof name === "string" ? name : "";
}
