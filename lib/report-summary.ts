import type { AuditReport } from "@/types/audit";
import { siteKindLabel } from "@/lib/scoring/engine";

export function plainSummary(report: AuditReport): { headline: string; points: string[] } {
  const kind = siteKindLabel(report.siteKind).toLowerCase();
  const points: string[] = [];

  if (report.categories.discoverability >= 16) {
    points.push(
      "People (and search engines) can already tell what this site is: titles, headings, and navigation are in good shape.",
    );
  } else {
    points.push("The page structure is weak, so even finding what the site is about is hard for an agent.");
  }

  if (report.tools.length === 0) {
    points.push(
      "An AI agent cannot complete the important jobs as clean operations. It would have to click buttons and fill forms, and guess what they do.",
    );
  } else {
    points.push(
      `The site declares ${report.tools.length} WebMCP tool${report.tools.length === 1 ? "" : "s"} — named actions an agent can call instead of clicking around.`,
    );
  }

  const gaps = report.issues
    .filter((issue) => issue.category === "webmcp")
    .map((issue) => issue.affectedWorkflow.toLowerCase());
  if (gaps.length > 0) {
    points.push(
      `Those jobs still exist for humans (${gaps.join(", ")}), but there is no published tool an agent can invoke.`,
    );
  }

  points.push(
    "WebMCP is the missing layer: the website tells the agent “you can do this, with these inputs,” the same way SEO tells a search engine what a page is about.",
  );

  const headline =
    report.tools.length === 0
      ? `${report.host} works for humans. It is not set up for AI agents yet.`
      : `${report.host} already exposes some agent tools, with room to cover more ${kind} workflows.`;

  return { headline, points };
}

export function taskStatusLabel(status: string) {
  if (status === "success") return "Passed";
  if (status === "partial") return "Partial";
  return "Failed";
}

export function taskStatusHint(status: string) {
  if (status === "success") return "Expected tools are declared (simulation).";
  if (status === "partial") return "A person can do this on the site. Expected tools are not fully declared.";
  return "This workflow is not declared as a tool, and the page UI is not enough either.";
}
