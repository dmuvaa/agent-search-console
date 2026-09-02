"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { SeverityBadge } from "@/components/scores";
import { useAudit } from "@/components/use-audit";

export function IssueDetailView() {
  const params = useParams<{ id: string }>();
  const { report, ready } = useAudit();
  const issue = report?.issues.find((item) => item.id === params.id);

  if (!ready) return <p className="text-muted">Loading…</p>;
  if (!report || !issue) {
    return (
      <div className="rounded-xl border border-line bg-card p-8">
        <h1 className="text-2xl font-semibold">Issue not found</h1>
        <p className="mt-2 text-muted">Analyze a site first, then open an issue from the dashboard.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-accent">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <article className="rounded-xl border border-line bg-card p-8">
      <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">
        ← Dashboard
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SeverityBadge severity={issue.severity} />
        <span className="text-xs uppercase tracking-wide text-muted">{issue.category}</span>
        <span className="text-xs uppercase tracking-wide text-faint">{issue.source}</span>
      </div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{issue.title}</h1>
      <p className="mt-2 text-muted">Affected workflow: {issue.affectedWorkflow}</p>

      <section className="mt-8 space-y-6">
        <Block title="Problem" body={issue.problem} />
        <Block title="Why it matters" body={issue.whyItMatters} />
        <Block title="Recommendation" body={issue.recommendation} />
        {issue.suggestedTool ? (
          <div>
            <h2 className="text-sm uppercase tracking-wide text-muted">Suggested WebMCP tool</h2>
            <div className="mt-2 rounded-lg border border-line bg-background p-4">
              <p className="font-mono text-accent">{issue.suggestedTool.name}</p>
              <p className="mt-2 text-sm text-muted">{issue.suggestedTool.description}</p>
              <ul className="mt-3 space-y-1 font-mono text-sm">
                {issue.suggestedTool.inputs.map((input) => (
                  <li key={input.name}>
                    {input.name}
                    {input.required ? "" : "?"} : {input.type} — {input.description}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
        <div>
          <h2 className="text-sm uppercase tracking-wide text-muted">Suggested implementation</h2>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-line bg-background p-4 text-xs leading-6">
            {issue.implementation}
          </pre>
        </div>
      </section>
    </article>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="text-sm uppercase tracking-wide text-muted">{title}</h2>
      <p className="mt-2 max-w-3xl text-pretty">{body}</p>
    </div>
  );
}
