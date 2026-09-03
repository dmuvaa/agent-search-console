"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileJson,
  Loader2,
  ListChecks,
  Search,
  XCircle,
} from "lucide-react";

type ReportSection = {
  tool: string;
  title: string;
  status: "pass" | "warning" | "fail";
  score: number;
  summary: string;
  metrics: Record<string, string | number | boolean | null>;
  findings: string[];
};

type ReportAction = {
  priority: "high" | "medium" | "low";
  tool: string;
  title: string;
  action: string;
  why: string;
  evidence: string;
  ownerHint: "developer" | "seo" | "content" | "platform";
};

type SeoReport = {
  success?: boolean;
  error?: string;
  url?: string;
  generatedAt?: string;
  overallScore?: number;
  grade?: string;
  executiveSummary?: string;
  summary?: {
    toolCount: number;
    passed: number;
    warnings: number;
    failed: number;
    findingCount: number;
  };
  agentCapabilities?: string[];
  agentActionPlan?: ReportAction[];
  sections?: ReportSection[];
  results?: Record<string, unknown>;
};

export function SeoReportRunner({ initialUrl = "" }: { initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<SeoReport | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = url.trim();
    if (!value) return;
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const response = await fetch("/api/seo-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "SEO report failed");
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "SEO report failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="rounded-xl border border-line bg-card p-5 print:hidden">
        <p className="text-sm text-muted">Run the full technical SEO suite and assemble one agent-readable report.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            id="url"
            name="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://webprismio.com/"
            className="h-12 flex-1 rounded-md border border-line bg-background px-4 outline-none ring-accent/40 placeholder:text-faint focus:ring-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-accent-ink hover:bg-accent-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {loading ? "Generating..." : "Generate report"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="rounded-xl border border-line bg-card p-8 text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-accent" />
          <p className="mt-4 font-medium">Generating technical SEO report...</p>
          <p className="mt-1 text-sm text-muted">Running ten checks and assembling the audit sections.</p>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md border border-critical/40 bg-critical/10 px-4 py-3 text-sm text-critical">
          {error}
        </p>
      ) : null}

      {report ? <ReportDocument report={report} /> : null}
    </div>
  );
}

function ReportDocument({ report }: { report: SeoReport }) {
  const sections = useMemo(() => report.sections || [], [report.sections]);
  const agentActionPlan = useMemo(() => report.agentActionPlan || [], [report.agentActionPlan]);
  const critical = sections.filter((section) => section.status === "fail");
  const warnings = sections.filter((section) => section.status === "warning");
  const strongest = useMemo(
    () => sections.filter((section) => section.status === "pass").slice(0, 4),
    [sections],
  );

  if (report.success === false) {
    return (
      <div className="rounded-xl border border-critical/40 bg-critical/10 p-5 text-critical">
        {report.error || "Report generation failed."}
      </div>
    );
  }

  return (
    <article className="space-y-6 rounded-xl border border-line bg-card p-5 print:border-0 print:bg-white print:p-0 print:text-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5 print:border-slate-300">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent print:text-emerald-700">Technical SEO report</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">SEO Audit</h2>
          <p className="mt-1 break-all text-sm text-muted print:text-slate-600">{report.url}</p>
          {report.generatedAt ? (
            <p className="mt-2 text-xs text-muted print:text-slate-500">
              Generated {new Date(report.generatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-muted hover:text-foreground print:hidden"
        >
          <Download className="size-4" />
          Save as PDF
        </button>
      </div>

      <section className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 print:border-emerald-200 print:bg-emerald-50">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent print:text-emerald-700">Overall score</p>
          <div className="mt-3 flex items-end gap-3">
            <p className="text-6xl font-semibold tracking-tight">{report.overallScore ?? 0}</p>
            <p className="pb-2 text-2xl font-semibold text-muted print:text-slate-500">/ 100</p>
          </div>
          <p className="mt-3 inline-flex rounded-full border border-accent/30 px-3 py-1 font-mono text-xs text-accent print:border-emerald-300 print:text-emerald-700">
            Grade {report.grade || "N/A"}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-background p-5 print:border-slate-200 print:bg-slate-50">
          <h3 className="text-lg font-semibold">Executive summary</h3>
          <p className="mt-3 leading-7 text-muted print:text-slate-700">{report.executiveSummary}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ReportMetric label="Passed" value={report.summary?.passed ?? 0} tone="good" />
            <ReportMetric label="Warnings" value={report.summary?.warnings ?? 0} tone="warning" />
            <ReportMetric label="Failed" value={report.summary?.failed ?? 0} tone="fail" />
            <ReportMetric label="Findings" value={report.summary?.findingCount ?? 0} tone="muted" />
          </div>
        </div>
      </section>

      {agentActionPlan.length > 0 ? (
        <section className="rounded-xl border border-accent/30 bg-accent/5 p-5 print:border-emerald-200 print:bg-emerald-50">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <ListChecks className="size-5 text-accent print:text-emerald-700" />
                Agent action plan
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted print:text-slate-700">
                A prioritized work order generated from the ten checks. The same list is returned by <code className="font-mono text-accent print:text-emerald-700">generate_seo_report</code> for agents.
              </p>
            </div>
            <span className="rounded-full border border-accent/30 px-3 py-1 font-mono text-xs text-accent print:border-emerald-300 print:text-emerald-700">
              {agentActionPlan.length} actions
            </span>
          </div>
          <div className="mt-5 grid gap-3">
            {agentActionPlan.map((item, index) => (
              <ActionCard key={`${item.tool}-${index}`} action={item} index={index + 1} />
            ))}
          </div>
        </section>
      ) : null}

      {critical.length || warnings.length ? (
        <section className="rounded-xl border border-line bg-background p-5 print:border-slate-200 print:bg-white">
          <h3 className="text-lg font-semibold">Priority fixes</h3>
          <ul className="mt-4 space-y-3">
            {[...critical, ...warnings].slice(0, 8).map((section) => (
              <li key={section.tool} className="flex items-start gap-3 text-sm">
                {section.status === "fail" ? (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-critical" />
                ) : (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-high" />
                )}
                <div>
                  <p className="font-medium">{section.title}</p>
                  <p className="mt-1 text-muted print:text-slate-600">{section.summary}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {strongest.length > 0 ? (
        <section className="rounded-xl border border-good/30 bg-good/5 p-5 print:border-emerald-200 print:bg-emerald-50">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-good print:text-emerald-700">
            <CheckCircle2 className="size-5" />
            What already works
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {strongest.map((section) => (
              <p key={section.tool} className="rounded-lg border border-good/20 bg-background p-3 text-sm print:border-emerald-100 print:bg-white">
                <span className="font-medium">{section.title}</span>
                <span className="mt-1 block text-muted print:text-slate-600">{section.summary}</span>
              </p>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Detailed checks</h3>
        <div className="grid gap-3">
          {sections.map((section) => (
            <SectionCard key={section.tool} section={section} />
          ))}
        </div>
      </section>

      <details className="rounded-xl border border-line bg-background print:hidden">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm text-muted">
          <FileJson className="size-4" />
          Raw report JSON for agents
        </summary>
        <pre className="overflow-x-auto border-t border-line p-4 text-xs leading-5 text-muted">
          {JSON.stringify(report, null, 2)}
        </pre>
      </details>
    </article>
  );
}

function ActionCard({ action, index }: { action: ReportAction; index: number }) {
  return (
    <article className="rounded-lg border border-line bg-background p-4 print:border-slate-200 print:bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase text-muted print:text-slate-500">
            {String(index).padStart(2, "0")} · {action.tool.replaceAll("_", " ")}
          </p>
          <h4 className="mt-2 text-base font-semibold">{action.title}</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full border px-3 py-1 font-mono text-xs uppercase ${actionPriorityClass(action.priority)}`}>
            {action.priority}
          </span>
          <span className="rounded-full border border-line px-3 py-1 font-mono text-xs uppercase text-muted print:border-slate-200 print:text-slate-600">
            {action.ownerHint}
          </span>
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted print:text-slate-500">Do next</p>
          <p className="mt-1 text-sm leading-6">{action.action}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted print:text-slate-500">Why it matters</p>
          <p className="mt-1 text-sm leading-6 text-muted print:text-slate-700">{action.why}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted print:text-slate-500">Evidence</p>
          <p className="mt-1 text-sm leading-6 text-muted print:text-slate-700">{action.evidence}</p>
        </div>
      </div>
    </article>
  );
}

function SectionCard({ section }: { section: ReportSection }) {
  return (
    <section className="rounded-xl border border-line bg-background p-4 print:border-slate-200 print:bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold">{section.title}</h4>
          <p className="mt-1 text-sm text-muted print:text-slate-600">{section.summary}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 font-mono text-xs uppercase ${statusClass(section.status)}`}>
          {section.status} · {section.score}
        </span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(section.metrics).map(([key, value]) => (
          <div key={key} className="rounded-lg border border-line p-3 print:border-slate-200">
            <p className="font-mono text-[10px] uppercase tracking-wide text-muted print:text-slate-500">{humanMetricLabel(key)}</p>
            <p className="mt-1 break-words text-sm">{String(value ?? "None")}</p>
          </div>
        ))}
      </div>
      {section.findings.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm text-high print:text-amber-700">
          {section.findings.slice(0, 4).map((finding) => (
            <li key={finding}>{finding}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ReportMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "warning" | "fail" | "muted";
}) {
  return (
    <div className={`rounded-lg border p-3 ${metricClass(tone)}`}>
      <p className="font-mono text-[10px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function metricClass(tone: "good" | "warning" | "fail" | "muted") {
  if (tone === "good") return "border-good/30 bg-good/5 text-good print:border-emerald-200 print:bg-emerald-50 print:text-emerald-700";
  if (tone === "warning") return "border-high/30 bg-high/5 text-high print:border-amber-200 print:bg-amber-50 print:text-amber-700";
  if (tone === "fail") return "border-critical/30 bg-critical/5 text-critical print:border-rose-200 print:bg-rose-50 print:text-rose-700";
  return "border-line bg-card text-muted print:border-slate-200 print:bg-white print:text-slate-700";
}

function statusClass(status: ReportSection["status"]) {
  if (status === "pass") return "border-good/30 bg-good/5 text-good print:border-emerald-200 print:bg-emerald-50 print:text-emerald-700";
  if (status === "fail") return "border-critical/30 bg-critical/5 text-critical print:border-rose-200 print:bg-rose-50 print:text-rose-700";
  return "border-high/30 bg-high/5 text-high print:border-amber-200 print:bg-amber-50 print:text-amber-700";
}

function actionPriorityClass(priority: ReportAction["priority"]) {
  if (priority === "high") return "border-critical/30 bg-critical/5 text-critical print:border-rose-200 print:bg-rose-50 print:text-rose-700";
  if (priority === "medium") return "border-high/30 bg-high/5 text-high print:border-amber-200 print:bg-amber-50 print:text-amber-700";
  return "border-line bg-card text-muted print:border-slate-200 print:bg-white print:text-slate-700";
}

function humanMetricLabel(key: string) {
  const labels: Record<string, string> = {
    pagesWithSchema: "Pages with schema",
    pagesWithErrors: "Pages with errors",
    schemaTypes: "Schema types",
    jsonLdBlocks: "JSON-LD blocks",
    totalTimeMs: "Total time",
    loopDetected: "Loop detected",
    finalUrl: "Final URL",
    securityHeaders: "Security headers",
    missingSecurityHeaders: "Missing security headers",
    contentType: "Content type",
    totalHeadings: "Total headings",
    rewriteRisk: "Rewrite risk",
    titleLength: "Title length",
    descriptionLength: "Description length",
  };
  return labels[key] || key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}
