"use client";

import Link from "next/link";
import { CategoryGrid, ScoreHero, SeverityBadge } from "@/components/scores";
import { useAudit } from "@/components/use-audit";
import { plainSummary, taskStatusHint, taskStatusLabel } from "@/lib/report-summary";

export function DashboardView() {
  const { report, ready } = useAudit();

  if (!ready) {
    return <p className="text-muted">Loading report…</p>;
  }

  if (!report) {
    return (
      <div className="rounded-xl border border-line bg-card p-8">
        <h1 className="text-2xl font-semibold">No analysis in this session</h1>
        <p className="mt-2 max-w-xl text-muted">
          Analyze a public URL to generate an Agent Readiness Score. Nothing is stored permanently.
        </p>
        <Link href="/analyze" className="mt-6 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
          Analyze a website
        </Link>
      </div>
    );
  }

  const critical = report.issues.filter((i) => i.severity === "critical" || i.severity === "high");
  const summary = plainSummary(report);

  return (
    <div className="space-y-6">
      <ScoreHero score={report.score} rating={report.rating} host={report.host} siteKind={report.siteKind} />

      <section className="rounded-xl border border-accent/30 bg-accent/5 p-5 sm:p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">What this means</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">{summary.headline}</h2>
        <ul className="mt-4 max-w-3xl space-y-2 text-sm leading-6 text-muted">
          {summary.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <CategoryGrid categories={report.categories} />

      {report.warnings.length > 0 ? (
        <div className="rounded-xl border border-medium/30 bg-medium/5 px-4 py-3 text-sm text-medium">
          {report.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-line bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Issues</h2>
            <span className="font-mono text-xs text-muted">{report.issues.length}</span>
          </div>
          <p className="mt-1 text-sm text-muted">Problems that would slow an agent down.</p>
          <ul className="mt-4 space-y-3">
            {report.issues.slice(0, 8).map((issue) => (
              <li key={issue.id}>
                <Link href={`/issues/${issue.id}`} className="block rounded-lg border border-transparent p-2 hover:border-line hover:bg-white/2">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={issue.severity} />
                    <span className="text-xs uppercase tracking-wide text-muted">
                      {issue.source === "ai" ? "suggestion" : "found on the site"}
                    </span>
                  </div>
                  <p className="mt-1 font-medium">{issue.title}</p>
                  <p className="text-sm text-muted">{issue.recommendation}</p>
                </Link>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-line bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Agent tools (WebMCP)</h2>
            <Link href="/tools" className="text-sm text-accent hover:underline">
              Inspector
            </Link>
          </div>
          <p className="mt-2 text-sm text-muted">
            {report.tools.length === 0
              ? "No agent tools were declared on the pages we fetched. The site may still register tools only in the browser; we cannot see that from the server. People can use the forms. An agent cannot call them by name."
              : report.webmcp.note}
          </p>
          <ul className="mt-4 space-y-2">
            {report.tools.length === 0 ? (
              <li className="text-sm text-muted">None found.</li>
            ) : (
              report.tools.map((tool) => (
                <li key={tool.name} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                  <span className="font-mono text-sm">{tool.name}</span>
                  <span className="font-mono text-xs text-muted">{tool.score}/20</span>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-line bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Task simulation</h2>
            <Link href="/tasks" className="text-sm text-accent hover:underline">
              Details
            </Link>
          </div>
          <p className="mt-2 text-sm text-muted">
            Checks whether expected WebMCP tool names are declared. Does not run an agent or click the site.
          </p>
          <ul className="mt-4 space-y-3">
            {report.tasks.map((task) => (
              <li key={task.id} className="rounded-lg border border-line px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{task.title}</p>
                  <span className="font-mono text-xs uppercase tracking-wide text-muted">
                    {taskStatusLabel(task.status)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{taskStatusHint(task.status)}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-line bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">What to do next</h2>
            <Link href="/generator" className="text-sm text-accent hover:underline">
              Starter code
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {report.recommendations.slice(0, 6).map((rec) => (
              <li key={rec.id} className="border-b border-line/70 pb-3 last:border-0">
                <p className="font-medium">{rec.title}</p>
                <p className="text-sm text-muted">{rec.detail}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-faint">
                  {rec.source === "ai" ? "AI suggestion" : "Found on the site"}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-xl border border-line bg-card p-5">
        <h2 className="text-lg font-medium">Site reading</h2>
        <p className="mt-2 text-sm text-muted">
          {report.ai.usedLlm
            ? "A model wrote this summary from the extracted page structure."
            : report.ai.error
              ? report.ai.error
              : "This summary was generated with rules, not a model."}
        </p>
        <p className="mt-4 max-w-3xl">{report.ai.purpose}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {report.ai.journeys.map((journey) => (
            <span key={journey} className="rounded-full border border-line px-3 py-1 text-xs text-muted">
              {journey}
            </span>
          ))}
        </div>
        {critical.length > 0 ? (
          <p className="mt-4 text-sm text-critical">{critical.length} high-priority gaps for agents.</p>
        ) : null}
      </section>
    </div>
  );
}
