import { randomUUID } from "node:crypto";
import { FETCH_LIMITS, normalizeInputUrl } from "@/lib/security/url";
import { extractPage, candidateCrawlUrls } from "@/lib/analyzer/extract";
import { fetchHtml, fetchOptionalJson } from "@/lib/analyzer/fetch";
import { mergeDeclaredTools, webmcpStatus } from "@/lib/analyzer/webmcp";
import {
  buildIssues,
  buildRecommendations,
  detectSiteKind,
  detectWorkflows,
  generatedFromIssues,
  ratingFor,
  scoreDiscoverability,
  scoreToolQuality,
  scoreWebmcp,
  scoreWorkflow,
} from "@/lib/scoring/engine";
import { interpretWebsite } from "@/lib/ai/interpret";
import { evaluateTask, scoreTasks, templatesFor } from "@/lib/tasks/evaluate";
import type { AuditReport, DeclaredWebMcpTool, PageExtract } from "@/types/audit";

function extraToolsFromManifest(value: unknown): DeclaredWebMcpTool[] {
  if (!value || typeof value !== "object") return [];
  const rec = value as { tools?: unknown };
  if (!Array.isArray(rec.tools)) return [];
  return rec.tools.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const tool = item as Record<string, unknown>;
      const name = String(tool.name ?? "").trim();
      if (!name) return [];
      return [
        {
          name,
          description: String(tool.description ?? ""),
          inputSchema:
            tool.inputSchema && typeof tool.inputSchema === "object"
              ? (tool.inputSchema as Record<string, unknown>)
              : undefined,
        } satisfies DeclaredWebMcpTool,
      ];
    });
}

export async function analyzeWebsite(rawUrl: string, requestHost: string): Promise<AuditReport> {
  const url = normalizeInputUrl(rawUrl);
  const warnings: string[] = [];
  const pages: PageExtract[] = [];

  const first = await fetchHtml(url, requestHost);
  pages.push(extractPage(first.html, first.finalUrl, first.status));

  const extraUrls = candidateCrawlUrls(pages[0], first.finalUrl).slice(0, FETCH_LIMITS.maxPages - 1);
  for (const href of extraUrls) {
    try {
      const next = await fetchHtml(new URL(href), requestHost);
      pages.push(extractPage(next.html, next.finalUrl, next.status));
    } catch {
      warnings.push(`Linked page could not be fetched: ${href}`);
    }
  }

  const origin = new URL(first.finalUrl).origin;
  const manifests = await Promise.all([
    fetchOptionalJson(new URL("/.well-known/webmcp.json", origin), requestHost),
    fetchOptionalJson(new URL("/webmcp.json", origin), requestHost),
  ]);
  const extraDeclared = manifests.flatMap(extraToolsFromManifest);

  const jsHeavy = first.html.length < 800 && pages[0].buttons.length + pages[0].forms.length < 2;
  if (jsHeavy) {
    warnings.push(
      "Some interactive functionality could not be evaluated from the initial page response. Treat this analysis as incomplete, not definitive.",
    );
  }

  const declared = mergeDeclaredTools(pages, extraDeclared);
  const webmcp = webmcpStatus(pages, declared);
  const siteKind = detectSiteKind(pages);
  const workflows = detectWorkflows(pages, siteKind);
  const discover = scoreDiscoverability(pages);
  const workflow = scoreWorkflow(pages, workflows);
  const coverage = scoreWebmcp(declared, siteKind, webmcp.verification);
  const quality = scoreToolQuality(declared);
  const tasks = templatesFor(siteKind).map((template) => evaluateTask(template, declared, workflows));
  const taskSuccess = scoreTasks(tasks);
  const ai = await interpretWebsite(siteKind, pages, workflows, declared);
  if (ai.error) warnings.push(ai.error);
  const issues = buildIssues({
    kind: siteKind,
    pages,
    workflows,
    declared,
    tools: quality.tools,
    discoverNotes: discover.notes,
    workflowNotes: workflow.notes,
    webmcpNotes: coverage.notes,
  });
  const recommendations = buildRecommendations({ kind: siteKind, issues, ai, declared });
  const categories = {
    discoverability: discover.score,
    workflow: workflow.score,
    webmcp: coverage.score,
    toolQuality: quality.score,
    taskSuccess,
  };
  const score =
    categories.discoverability +
    categories.workflow +
    categories.webmcp +
    categories.toolQuality +
    categories.taskSuccess;

  return {
    id: randomUUID(),
    url: first.finalUrl,
    host: new URL(first.finalUrl).host,
    analyzedAt: new Date().toISOString(),
    siteKind,
    score,
    rating: ratingFor(score),
    categories,
    issues,
    recommendations,
    workflows,
    tools: quality.tools,
    webmcp,
    pages: pages.map((p) => ({ url: p.url, title: p.title, status: p.status })),
    warnings,
    ai,
    tasks,
    generatedTools: generatedFromIssues(issues),
  };
}
