"use client";

import { useEffect } from "react";
import { getModelContext } from "@/components/webmcp/runtime";
import { CONSOLE_TOOLS } from "@/lib/webmcp/catalog";
import { registerToolOptions } from "@/lib/webmcp/agent-access";
import { loadAudit, saveAudit } from "@/lib/audit-session";
import { evaluateTask, TASK_TEMPLATES, templatesFor } from "@/lib/tasks/evaluate";

type Input = Record<string, unknown> | undefined;

async function analyze(url: string) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Analysis failed");
  saveAudit(data);
  return data;
}

export function ConsoleWebmcp() {
  useEffect(() => {
    const ctx = getModelContext();
    if (!ctx) return;
    const controller = new AbortController();

    const handlers: Record<string, (input?: Input) => Promise<unknown>> = {
      analyze_website: async (input) => {
        const url = String(input?.url || "");
        const report = await analyze(url);
        return {
          url: report.url,
          score: report.score,
          rating: report.rating,
          categories: report.categories,
          issueCount: report.issues.length,
          webmcp: report.webmcp,
        };
      },
      get_agent_score: async () => {
        const report = loadAudit();
        if (!report) return { error: "No analysis in this session. Call analyze_website first." };
        return {
          url: report.url,
          score: report.score,
          rating: report.rating,
          categories: report.categories,
          disclaimer: "This is an Agent Search Console assessment score, not an industry standard.",
        };
      },
      get_issues: async (input) => {
        const report = loadAudit();
        if (!report) return { error: "No analysis in this session. Call analyze_website first." };
        const severity = input?.severity ? String(input.severity) : "";
        const issues = severity
          ? report.issues.filter((issue) => issue.severity === severity)
          : report.issues;
        return issues.map((issue) => ({
          id: issue.id,
          severity: issue.severity,
          title: issue.title,
          recommendation: issue.recommendation,
          source: issue.source,
        }));
      },
      get_recommendations: async () => {
        const report = loadAudit();
        if (!report) return { error: "No analysis in this session. Call analyze_website first." };
        return report.recommendations;
      },
      generate_webmcp_plan: async () => {
        const report = loadAudit();
        if (!report) return { error: "No analysis in this session. Call analyze_website first." };
        return {
          purpose: report.ai.purpose,
          tools: report.generatedTools,
        };
      },
      run_agent_test: async (input) => {
        const report = loadAudit();
        if (!report) return { error: "No analysis in this session. Call analyze_website first." };
        const declared = report.tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        }));
        const template =
          TASK_TEMPLATES.find((t) => t.id === input?.taskId) || templatesFor(report.siteKind)[0];
        if (!template) return { error: "No task template available." };
        return evaluateTask(template, declared, report.workflows);
      },
    };

    for (const tool of CONSOLE_TOOLS) {
      void ctx
        .registerTool(
          {
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            annotations: { readOnlyHint: tool.name !== "analyze_website" && tool.name !== "run_agent_test" },
            execute: (input) => handlers[tool.name](input as Input),
          },
          registerToolOptions(controller.signal),
        )
        .catch(() => {});
    }

    return () => controller.abort();
  }, []);

  return null;
}
