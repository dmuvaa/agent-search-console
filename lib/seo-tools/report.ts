import { checkBrokenLinks } from "@/lib/seo-tools/broken-links";
import { SEO_TOOL_META, SEO_TOOL_NAMES, type SeoToolName } from "@/lib/seo-tools/catalog";
import { checkHeadings } from "@/lib/seo-tools/headings";
import { checkHttpHeaders } from "@/lib/seo-tools/headers";
import { checkIndexability } from "@/lib/seo-tools/indexability";
import { checkMetaTags } from "@/lib/seo-tools/meta";
import { checkRedirects } from "@/lib/seo-tools/redirects";
import { checkRobotsTxt } from "@/lib/seo-tools/robots";
import { checkSchema } from "@/lib/seo-tools/schema";
import { previewSerpSnippet } from "@/lib/seo-tools/serp-preview";
import { checkSitemap } from "@/lib/seo-tools/sitemap";
import { SeoToolError, parseSafeUrl } from "@/lib/seo-tools/http";

type ReportStatus = "pass" | "warning" | "fail";
type ToolResult = Record<string, unknown>;
type ActionPriority = "high" | "medium" | "low";
type OwnerHint = "developer" | "seo" | "content" | "platform";

export type SeoReportSection = {
  tool: SeoToolName;
  title: string;
  status: ReportStatus;
  score: number;
  summary: string;
  metrics: Record<string, string | number | boolean | null>;
  findings: string[];
};

export type SeoReportAction = {
  priority: ActionPriority;
  tool: SeoToolName;
  title: string;
  action: string;
  why: string;
  evidence: string;
  ownerHint: OwnerHint;
};

async function runReportTool(name: SeoToolName, url: string, requestHost: string) {
  switch (name) {
    case "check_schema":
      return checkSchema(url, requestHost);
    case "check_robots_txt":
      return checkRobotsTxt(url, requestHost);
    case "check_sitemap":
      return checkSitemap(url, requestHost);
    case "check_redirects":
      return checkRedirects(url, requestHost);
    case "check_http_headers":
      return checkHttpHeaders(url, requestHost);
    case "check_headings":
      return checkHeadings(url, requestHost);
    case "check_meta_tags":
      return checkMetaTags(url, requestHost);
    case "check_indexability":
      return checkIndexability(url, requestHost);
    case "check_broken_links":
      return checkBrokenLinks(url, requestHost);
    case "preview_serp_snippet":
      return previewSerpSnippet(url, requestHost);
    default:
      throw new SeoToolError("Unknown SEO tool.", 400);
  }
}

export async function generateSeoReport(rawUrl: string, requestHost: string) {
  const parsed = await parseSafeUrl(rawUrl, requestHost);
  const url = parsed.toString();

  const settled = await Promise.allSettled(
    SEO_TOOL_NAMES.map(async (tool) => ({
      tool,
      result: await runReportTool(tool, url, requestHost),
    })),
  );

  const results: Partial<Record<SeoToolName, ToolResult>> = {};
  const sections = settled.map((item, index) => {
    const tool = SEO_TOOL_NAMES[index];
    if (item.status === "rejected") {
      const message = item.reason instanceof Error ? item.reason.message : "This check failed.";
      const result = { success: false, error: message };
      results[tool] = result;
      return failedSection(tool, message);
    }

    results[item.value.tool] = item.value.result;
    return sectionFor(item.value.tool, item.value.result);
  });
  const agentActionPlan = buildAgentActionPlan(sections, results);

  const overallScore = Math.round(
    sections.reduce((sum, section) => sum + section.score, 0) / Math.max(1, sections.length),
  );
  const failed = sections.filter((section) => section.status === "fail").length;
  const warnings = sections.filter((section) => section.status === "warning").length;
  const passed = sections.filter((section) => section.status === "pass").length;

  return {
    success: true,
    url,
    generatedAt: new Date().toISOString(),
    overallScore,
    grade: gradeFor(overallScore),
    summary: {
      toolCount: sections.length,
      passed,
      warnings,
      failed,
      findingCount: sections.reduce((sum, section) => sum + section.findings.length, 0),
    },
    executiveSummary: executiveSummary(overallScore, passed, warnings, failed),
    agentCapabilities: [
      "Run all ten technical SEO checks from one public URL.",
      "Return a prioritized action plan with evidence and owner hints.",
      "Expose both summarized report sections and raw checker output for follow-up agent work.",
    ],
    agentActionPlan,
    sections,
    results,
  };
}

function failedSection(tool: SeoToolName, message: string): SeoReportSection {
  return {
    tool,
    title: SEO_TOOL_META[tool].title,
    status: "fail",
    score: 0,
    summary: message,
    metrics: {},
    findings: [message],
  };
}

function sectionFor(tool: SeoToolName, result: ToolResult): SeoReportSection {
  if (result.success === false) {
    return failedSection(tool, String(result.error || "This check failed."));
  }

  if (tool === "check_indexability") return indexabilitySection(tool, result);
  if (tool === "check_schema") return schemaSection(tool, result);
  if (tool === "check_robots_txt") return robotsSection(tool, result);
  if (tool === "check_sitemap") return sitemapSection(tool, result);
  if (tool === "check_redirects") return redirectsSection(tool, result);
  if (tool === "check_http_headers") return headersSection(tool, result);
  if (tool === "check_headings") return headingsSection(tool, result);
  if (tool === "check_meta_tags") return metaSection(tool, result);
  if (tool === "check_broken_links") return brokenLinksSection(tool, result);
  return serpSection(tool, result);
}

function baseSection(
  tool: SeoToolName,
  status: ReportStatus,
  score: number,
  summary: string,
  metrics: SeoReportSection["metrics"],
  findings: string[] = [],
): SeoReportSection {
  return {
    tool,
    title: SEO_TOOL_META[tool].title,
    status,
    score,
    summary,
    metrics,
    findings,
  };
}

function indexabilitySection(tool: SeoToolName, result: ToolResult) {
  const summary = objectValue(result.summary);
  const blocked = numberValue(summary.blocked) + numberValue(summary.errors);
  const noindex = numberValue(summary.noindex);
  const indexable = numberValue(summary.indexable);
  const status: ReportStatus = blocked > 0 ? "fail" : noindex > 0 || indexable === 0 ? "warning" : "pass";
  return baseSection(
    tool,
    status,
    status === "pass" ? 100 : status === "warning" ? 65 : 20,
    indexable > 0 ? "The requested URL appears indexable." : "The requested URL has indexability blockers.",
    {
      indexable,
      noindex,
      blocked: numberValue(summary.blocked),
      errors: numberValue(summary.errors),
      redirected: numberValue(summary.redirected),
    },
    collectFindings(result),
  );
}

function schemaSection(tool: SeoToolName, result: ToolResult) {
  const score = clamp(numberValue(result.opportunityScore), 0, 100);
  const pagesWithSchema = numberValue(result.pagesWithSchema);
  const pagesWithErrors = numberValue(result.pagesWithErrors);
  const schemaTypes = Object.keys(objectValue(result.schemaTypeDistribution));
  const findings = collectFindings(result);
  const status: ReportStatus = pagesWithErrors > 0 ? "fail" : findings.length > 0 || score < 75 ? "warning" : "pass";
  return baseSection(
    tool,
    status,
    score || (pagesWithSchema ? 80 : 35),
    pagesWithSchema ? `${schemaTypes.length} schema type detected.` : "No schema markup was detected.",
    {
      pagesWithSchema,
      pagesWithErrors,
      schemaTypes: schemaTypes.join(", ") || null,
      jsonLdBlocks: firstPageJsonLdCount(result),
    },
    findings,
  );
}

function robotsSection(tool: SeoToolName, result: ToolResult) {
  const sitemaps = Array.isArray(result.sitemaps) ? result.sitemaps.length : 0;
  const rules = Array.isArray(result.rules) ? result.rules.length : 0;
  return baseSection(
    tool,
    sitemaps > 0 ? "pass" : "warning",
    sitemaps > 0 ? 100 : 75,
    sitemaps > 0 ? "robots.txt is readable and declares sitemap locations." : "robots.txt is readable, but does not declare a sitemap.",
    { status: numberValue(result.status), rules, sitemaps },
    collectFindings(result),
  );
}

function sitemapSection(tool: SeoToolName, result: ToolResult) {
  const summary = objectValue(result.summary);
  const broken = numberValue(summary.broken);
  const total = numberValue(summary.total);
  const status: ReportStatus = broken > 0 ? "fail" : total > 0 ? "pass" : "warning";
  return baseSection(
    tool,
    status,
    broken > 0 ? 45 : total > 0 ? 100 : 60,
    total > 0 ? `${total} sitemap URLs found; ${broken} broken in the checked sample.` : "No sitemap URLs were found.",
    {
      total,
      checked: numberValue(summary.checked),
      valid: numberValue(summary.valid),
      broken,
    },
    collectFindings(result),
  );
}

function redirectsSection(tool: SeoToolName, result: ToolResult) {
  const chain = Array.isArray(result.chain) ? result.chain : [];
  const hopCount = Math.max(0, chain.length - 1);
  const loopDetected = result.loopDetected === true;
  const status: ReportStatus = loopDetected ? "fail" : hopCount > 1 ? "warning" : "pass";
  return baseSection(
    tool,
    status,
    loopDetected ? 10 : hopCount > 1 ? 70 : 100,
    loopDetected ? "A redirect loop was detected." : hopCount > 0 ? `${hopCount} redirect hop detected.` : "The URL resolves directly.",
    {
      hops: hopCount,
      totalTimeMs: numberValue(result.totalTimeMs),
      loopDetected,
      finalUrl: typeof result.finalUrl === "string" ? result.finalUrl : null,
    },
    collectFindings(result),
  );
}

function headersSection(tool: SeoToolName, result: ToolResult) {
  const security = Array.isArray(result.securityHeaders)
    ? (result.securityHeaders as Array<{ present?: boolean; name?: string }>)
    : [];
  const missing = security.filter((header) => !header.present);
  const score = security.length ? Math.round(((security.length - missing.length) / security.length) * 100) : 70;
  return baseSection(
    tool,
    missing.length > 2 ? "warning" : "pass",
    score,
    missing.length ? `${missing.length} recommended security headers are missing.` : "Recommended security headers are present.",
    {
      status: numberValue(result.status),
      securityHeaders: security.length,
      missingSecurityHeaders: missing.length,
      contentType: typeof result.contentType === "string" ? result.contentType : null,
    },
    [...collectFindings(result), ...missing.slice(0, 5).map((header) => `Missing header: ${header.name || "unknown"}`)],
  );
}

function headingsSection(tool: SeoToolName, result: ToolResult) {
  const warnings = arrayStrings(result.warnings);
  const counts = objectValue(result.counts);
  return baseSection(
    tool,
    warnings.length ? "warning" : "pass",
    warnings.length ? 75 : 100,
    warnings.length ? `${warnings.length} heading structure warnings found.` : "Heading hierarchy looks clean.",
    {
      h1: numberValue(counts[1] ?? counts["1"]),
      h2: numberValue(counts[2] ?? counts["2"]),
      totalHeadings: Array.isArray(result.headings) ? result.headings.length : 0,
    },
    warnings,
  );
}

function metaSection(tool: SeoToolName, result: ToolResult) {
  const tags = Array.isArray(result.tags) ? (result.tags as Array<{ status?: string; tagName?: string; message?: string }>) : [];
  const errors = tags.filter((tag) => tag.status === "error");
  const warnings = tags.filter((tag) => tag.status === "warn");
  const status: ReportStatus = errors.length ? "fail" : warnings.length ? "warning" : "pass";
  return baseSection(
    tool,
    status,
    errors.length ? 45 : warnings.length ? 75 : 100,
    errors.length || warnings.length ? `${errors.length + warnings.length} metadata improvements found.` : "Core metadata is present.",
    {
      tags: tags.length,
      ok: tags.filter((tag) => tag.status === "ok").length,
      warnings: warnings.length,
      errors: errors.length,
    },
    [...errors, ...warnings].map((tag) => `${tag.tagName || "Meta tag"}: ${tag.message || tag.status}`),
  );
}

function brokenLinksSection(tool: SeoToolName, result: ToolResult) {
  const summary = objectValue(result.summary);
  const broken = numberValue(summary.broken ?? summary.brokenCount);
  const redirects = numberValue(summary.redirects);
  const status: ReportStatus = broken > 0 ? "fail" : redirects > 0 ? "warning" : "pass";
  return baseSection(
    tool,
    status,
    broken > 0 ? 35 : redirects > 0 ? 80 : 100,
    broken > 0 ? `${broken} broken links found.` : redirects > 0 ? `${redirects} redirecting links found.` : "Checked links resolve without hard failures.",
    {
      checked: numberValue(summary.checked ?? summary.totalChecked),
      healthy: numberValue(summary.healthy ?? summary.okCount),
      broken,
      redirects,
      internal: numberValue(summary.internal),
      external: numberValue(summary.external),
    },
    collectFindings(result),
  );
}

function serpSection(tool: SeoToolName, result: ToolResult) {
  const analysis = objectValue(result.analysis);
  const risk = String(result.rewriteRisk || analysis.rewriteRisk || "unknown");
  const status: ReportStatus = risk === "high" ? "warning" : "pass";
  return baseSection(
    tool,
    status,
    risk === "high" ? 70 : risk === "medium" ? 82 : 100,
    risk === "high" ? "Snippet metadata is likely to truncate or be rewritten." : "Snippet metadata is unlikely to need major rewrites.",
    {
      rewriteRisk: risk,
      titleLength: numberValue(analysis.titleLength),
      descriptionLength: numberValue(analysis.descLength),
      canonical: typeof result.canonical === "string" && result.canonical ? result.canonical : null,
    },
    arrayStrings(result.rewriteReasons),
  );
}

function buildAgentActionPlan(
  sections: SeoReportSection[],
  results: Partial<Record<SeoToolName, ToolResult>>,
): SeoReportAction[] {
  const byTool = new Map(sections.map((section) => [section.tool, section]));
  const actions: SeoReportAction[] = [];

  const add = (action: SeoReportAction | null) => {
    if (action) actions.push(action);
  };

  add(indexabilityAction(byTool.get("check_indexability"), results.check_indexability));
  add(sitemapAction(byTool.get("check_sitemap"), results.check_sitemap));
  add(redirectsAction(byTool.get("check_redirects"), results.check_redirects));
  add(headersAction(byTool.get("check_http_headers"), results.check_http_headers));
  add(metaAction(byTool.get("check_meta_tags"), results.check_meta_tags));
  add(serpAction(byTool.get("preview_serp_snippet"), results.preview_serp_snippet));
  add(schemaAction(byTool.get("check_schema"), results.check_schema));
  add(headingsAction(byTool.get("check_headings"), results.check_headings));
  add(brokenLinksAction(byTool.get("check_broken_links"), results.check_broken_links));
  add(robotsAction(byTool.get("check_robots_txt"), results.check_robots_txt));

  return actions
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
    .slice(0, 8);
}

function indexabilityAction(section?: SeoReportSection, result?: ToolResult): SeoReportAction | null {
  if (!section || section.status === "pass") return null;
  const summary = objectValue(result?.summary);
  const blocked = numberValue(summary.blocked) + numberValue(summary.errors);
  const noindex = numberValue(summary.noindex);
  return {
    priority: blocked > 0 ? "high" : "medium",
    tool: "check_indexability",
    title: "Restore indexability before optimization work",
    action: "Remove noindex directives, crawl blocks, or fetch errors from the canonical URL.",
    why: "Search engines and agents cannot recommend a page reliably if the target URL cannot be crawled and indexed.",
    evidence: evidenceFrom(
      firstFinding(section),
      blocked > 0 ? `${blocked} indexability blocker(s) found.` : `${noindex} noindex signal(s) found.`,
      section.summary,
    ),
    ownerHint: "developer",
  };
}

function sitemapAction(section?: SeoReportSection, result?: ToolResult): SeoReportAction | null {
  if (!section || section.status === "pass") return null;
  const summary = objectValue(result?.summary);
  const broken = numberValue(summary.broken);
  return {
    priority: broken > 0 ? "high" : "medium",
    tool: "check_sitemap",
    title: broken > 0 ? "Fix broken sitemap URLs" : "Publish or expose a sitemap",
    action: broken > 0 ? "Update the sitemap so every listed URL returns a healthy final response." : "Add a sitemap.xml and link it from robots.txt.",
    why: "Sitemaps give crawlers and agents a clean inventory of pages to inspect instead of relying on navigation discovery.",
    evidence: evidenceFrom(firstFinding(section), section.summary),
    ownerHint: "platform",
  };
}

function redirectsAction(section?: SeoReportSection, result?: ToolResult): SeoReportAction | null {
  if (!section || section.status === "pass") return null;
  const loopDetected = result?.loopDetected === true;
  return {
    priority: loopDetected ? "high" : "medium",
    tool: "check_redirects",
    title: loopDetected ? "Remove redirect loops" : "Shorten redirect chains",
    action: loopDetected ? "Change the redirect rules so the requested URL reaches one final canonical page." : "Point links and canonical references directly at the final URL.",
    why: "Long or broken redirect paths waste crawl budget and create inconsistent canonical signals.",
    evidence: evidenceFrom(firstFinding(section), section.summary),
    ownerHint: "developer",
  };
}

function headersAction(section?: SeoReportSection, result?: ToolResult): SeoReportAction | null {
  if (!section || section.status === "pass") return null;
  const headers = Array.isArray(result?.securityHeaders)
    ? (result.securityHeaders as Array<{ present?: boolean; name?: string }>)
    : [];
  const missing = headers.filter((header) => !header.present).map((header) => header.name).filter(Boolean);
  return {
    priority: missing.length >= 3 ? "high" : "medium",
    tool: "check_http_headers",
    title: "Add missing HTTP security headers",
    action: "Configure the hosting layer to return the missing headers on HTML responses.",
    why: "Security headers reduce browser risk and are a fast technical-quality signal for production sites.",
    evidence: evidenceFrom(
      missing.length ? `Missing headers: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ", ..." : ""}` : firstFinding(section),
      section.summary,
    ),
    ownerHint: "platform",
  };
}

function metaAction(section?: SeoReportSection, result?: ToolResult): SeoReportAction | null {
  if (!section || section.status === "pass") return null;
  const tags = Array.isArray(result?.tags)
    ? (result.tags as Array<{ status?: string; tagName?: string; message?: string; value?: string; content?: string }>)
    : [];
  const firstProblem = tags.find((tag) => tag.status === "error") || tags.find((tag) => tag.status === "warn");
  return {
    priority: section.status === "fail" ? "high" : "medium",
    tool: "check_meta_tags",
    title: "Rewrite metadata for search previews",
    action: "Update the title, meta description, canonical, and social preview fields that are missing or outside useful length ranges.",
    why: "Clean metadata improves click-through context for humans and gives agents a reliable page summary to cite.",
    evidence: evidenceFrom(
      firstProblem ? `${firstProblem.tagName || "Meta tag"}: ${firstProblem.message || firstProblem.status}` : firstFinding(section),
      section.summary,
    ),
    ownerHint: "content",
  };
}

function serpAction(section?: SeoReportSection, result?: ToolResult): SeoReportAction | null {
  if (!section || section.status === "pass") return null;
  const reasons = arrayStrings(result?.rewriteReasons);
  return {
    priority: "medium",
    tool: "preview_serp_snippet",
    title: "Reduce snippet rewrite risk",
    action: "Make the page title and description concise, unique, and aligned with the visible page content.",
    why: "When snippet rewrite risk is high, search engines may replace the copy users and agents expect to see.",
    evidence: evidenceFrom(reasons[0], firstFinding(section), section.summary),
    ownerHint: "seo",
  };
}

function schemaAction(section?: SeoReportSection, result?: ToolResult): SeoReportAction | null {
  if (!section || section.status === "pass") return null;
  const schemaTypes = Object.keys(objectValue(result?.schemaTypeDistribution));
  return {
    priority: section.status === "fail" ? "high" : "medium",
    tool: "check_schema",
    title: "Clean up structured data",
    action: "Validate JSON-LD, remove duplicate entities, and add stable @id links between organization, website, and page entities.",
    why: "Structured data is one of the clearest machine-readable bridges between classic SEO and agent understanding.",
    evidence: evidenceFrom(firstFinding(section), schemaTypes.length ? `Detected schema types: ${schemaTypes.join(", ")}` : section.summary),
    ownerHint: "developer",
  };
}

function headingsAction(section?: SeoReportSection, result?: ToolResult): SeoReportAction | null {
  if (!section || section.status === "pass") return null;
  const warnings = arrayStrings(result?.warnings);
  return {
    priority: "medium",
    tool: "check_headings",
    title: "Repair heading hierarchy",
    action: "Keep one clear H1 and avoid skipped heading levels in the main content outline.",
    why: "Headings create a page outline that helps readers, screen readers, crawlers, and agents understand content priority.",
    evidence: evidenceFrom(warnings[0], firstFinding(section), section.summary),
    ownerHint: "content",
  };
}

function brokenLinksAction(section?: SeoReportSection, result?: ToolResult): SeoReportAction | null {
  if (!section || section.status === "pass") return null;
  const summary = objectValue(result?.summary);
  const broken = numberValue(summary.broken ?? summary.brokenCount);
  return {
    priority: broken > 0 ? "high" : "medium",
    tool: "check_broken_links",
    title: broken > 0 ? "Fix broken outbound and internal links" : "Point redirecting links at final destinations",
    action: broken > 0 ? "Replace or remove links that return errors." : "Update links so they go directly to their final canonical URLs.",
    why: "Broken and redirecting links slow agents down and dilute the reliability of a crawl graph.",
    evidence: evidenceFrom(firstFinding(section), section.summary),
    ownerHint: "content",
  };
}

function robotsAction(section?: SeoReportSection, result?: ToolResult): SeoReportAction | null {
  if (!section || section.status === "pass") return null;
  const sitemaps = Array.isArray(result?.sitemaps) ? result.sitemaps.length : 0;
  return {
    priority: "low",
    tool: "check_robots_txt",
    title: "Declare sitemap locations in robots.txt",
    action: "Add one or more Sitemap lines to robots.txt.",
    why: "A robots.txt sitemap hint lets crawlers and agents discover the canonical URL inventory quickly.",
    evidence: evidenceFrom(sitemaps === 0 ? "robots.txt does not declare a sitemap." : firstFinding(section), section.summary),
    ownerHint: "platform",
  };
}

function collectFindings(result: ToolResult) {
  const issues = Array.isArray(result.issues)
    ? (result.issues as Array<{ message?: string; detail?: string; type?: string }>)
    : [];
  return [
    ...issues.map((issue) => issue.message || issue.detail || issue.type || "Issue detected."),
    ...arrayStrings(result.warnings),
  ].filter(Boolean);
}

function firstPageJsonLdCount(result: ToolResult) {
  const pages = Array.isArray(result.pages) ? (result.pages as Array<{ jsonLd?: unknown[] }>) : [];
  return Array.isArray(pages[0]?.jsonLd) ? pages[0].jsonLd.length : 0;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function arrayStrings(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function firstFinding(section: SeoReportSection) {
  return section.findings.find(Boolean);
}

function evidenceFrom(...values: Array<string | undefined>) {
  const value = values.find((item) => item && item.trim());
  return truncate(value || "No extra evidence provided.", 220);
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function priorityRank(priority: ActionPriority) {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function gradeFor(score: number) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function executiveSummary(score: number, passed: number, warnings: number, failed: number) {
  if (failed > 0) {
    return `Technical SEO score is ${score}. ${failed} checks failed and should be fixed before deeper optimization work.`;
  }
  if (warnings > 0) {
    return `Technical SEO score is ${score}. The crawl foundation works, with ${warnings} checks needing cleanup.`;
  }
  return `Technical SEO score is ${score}. All ${passed} checks passed for the requested URL.`;
}
