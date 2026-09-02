"use client";

import Link from "next/link";
import { useAudit } from "@/components/use-audit";

export function ToolsView() {
  const { report, ready } = useAudit();
  if (!ready) return <p className="text-muted">Loading…</p>;
  if (!report) {
    return (
      <Empty title="No tools to inspect" href="/analyze" />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Inspector</p>
        <h1 className="mt-2 text-3xl font-semibold">WebMCP tools</h1>
        <p className="mt-2 max-w-2xl text-muted">{report.webmcp.note}</p>
      </header>
      {report.tools.length === 0 ? (
        <p className="rounded-xl border border-line bg-card p-6 text-muted">
          No declared tools were observed. If the site registers tools only at runtime, the crawler cannot verify them from HTML alone.
        </p>
      ) : (
        report.tools.map((tool) => (
          <article key={tool.name} className="rounded-xl border border-line bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-mono text-lg text-accent">{tool.name}</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted">{tool.description || "No description provided."}</p>
              </div>
              <p className="font-mono text-sm">Quality {tool.score}/20</p>
            </div>
            {tool.problems.length > 0 ? (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-high">
                {tool.problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-good">No structural problems detected.</p>
            )}
            {tool.inputSchema ? (
              <pre className="mt-4 overflow-x-auto rounded-lg border border-line bg-background p-4 text-xs">
                {JSON.stringify(tool.inputSchema, null, 2)}
              </pre>
            ) : null}
          </article>
        ))
      )}
      <Link href="/generator" className="inline-block text-sm text-accent">
        Generate missing tools →
      </Link>
    </div>
  );
}

export function TasksView() {
  const { report, ready } = useAudit();
  if (!ready) return <p className="text-muted">Loading…</p>;
  if (!report) return <Empty title="No task simulations" href="/analyze" />;

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Task simulation</p>
        <h1 className="mt-2 text-3xl font-semibold">Are the expected tools declared?</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Simulations use templates for commerce, SaaS, services, and booking. They check whether required WebMCP tool names exist in the analysis. They do not run an agent, invoke remote tools, or click the live UI.
        </p>
      </header>
      {report.tasks.map((task) => (
        <article key={task.id} className="rounded-xl border border-line bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-medium">{task.title}</h2>
            <span className="font-mono text-xs uppercase tracking-wide">{task.status}</span>
          </div>
          <p className="mt-2 text-sm text-muted">{task.template}</p>
          <p className="mt-4">{task.result}</p>
          {task.failurePoint ? (
            <p className="mt-2 text-sm text-critical">
              Failure point: {task.failurePoint}. {task.reason}
            </p>
          ) : null}
          <p className="mt-3 font-mono text-xs text-muted">{(task.durationMs / 1000).toFixed(1)}s · tools {task.toolsUsed.join(", ") || "none"}</p>
          <ol className="mt-4 space-y-2">
            {task.steps.map((step) => (
              <li key={step.order} className="flex gap-3 text-sm">
                <span className="font-mono text-muted">{step.order}</span>
                <span className={step.ok ? "text-good" : "text-critical"}>{step.ok ? "Declared" : "Missing"}</span>
                <span>{step.detail}</span>
              </li>
            ))}
          </ol>
        </article>
      ))}
    </div>
  );
}

export function GeneratorView() {
  const { report, ready } = useAudit();
  if (!ready) return <p className="text-muted">Loading…</p>;
  if (!report) return <Empty title="No tools to generate" href="/analyze" />;

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Generator</p>
        <h1 className="mt-2 text-3xl font-semibold">Starter WebMCP tools</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Generated code is a starting point. Review it, wire it to real data, and keep humans in the loop for checkout, booking, and payments.
        </p>
      </header>
      {report.generatedTools.length === 0 ? (
        <p className="rounded-xl border border-line bg-card p-6">No missing tools were recommended for this analysis.</p>
      ) : (
        report.generatedTools.map((tool) => (
          <article key={tool.name} className="rounded-xl border border-line bg-card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-mono text-lg text-accent">{tool.name}</h2>
              <CopyButton text={tool.implementation} />
            </div>
            <p className="mt-2 text-sm text-muted">{tool.description}</p>
            <pre className="mt-4 overflow-x-auto rounded-lg border border-line bg-background p-4 text-xs leading-6">
              {tool.implementation}
            </pre>
          </article>
        ))
      )}
    </div>
  );
}

function Empty({ title, href }: { title: string; href: string }) {
  return (
    <div className="rounded-xl border border-line bg-card p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <Link href={href} className="mt-4 inline-block text-accent">
        Analyze a website
      </Link>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      className="rounded-md border border-line px-3 py-1.5 text-xs hover:bg-white/5"
      onClick={() => void navigator.clipboard.writeText(text)}
    >
      Copy
    </button>
  );
}
