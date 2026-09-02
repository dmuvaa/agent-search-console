import type { AiAnalysis, DeclaredWebMcpTool, PageExtract, SiteKind, WorkflowSignal } from "@/types/audit";
import { expectedTools } from "@/lib/scoring/engine";

export function heuristicAnalysis(
  kind: SiteKind,
  pages: PageExtract[],
  workflows: WorkflowSignal[],
  declared: DeclaredWebMcpTool[],
): AiAnalysis {
  const names = new Set(declared.map((t) => t.name));
  const purpose =
    kind === "commerce"
      ? "An e-commerce storefront where people browse, filter, compare, and purchase products."
      : kind === "saas"
        ? "A software product site organized around plans, trials, and account creation."
        : kind === "booking"
          ? "A booking site where people look up availability and schedule appointments."
          : kind === "services"
            ? "A service business site oriented around contact and quote requests."
            : `A public website titled “${pages[0]?.title || "Untitled"}”.`;

  const journeys = workflows.filter((w) => w.present).map((w) => w.label);
  const importantActions = pages[0]?.buttons.map((b) => b.text).filter(Boolean).slice(0, 8) ?? [];
  const missing = expectedTools(kind)
    .filter((t) => !names.has(t.name))
    .map((t) => t.workflow);

  const recommendedTools = expectedTools(kind)
    .filter((t) => !names.has(t.name))
    .map((t) => ({
      name: t.name,
      description: `Structured operation for ${t.workflow.toLowerCase()}.`,
      reason: `${t.workflow} is a likely agent task on a ${kind} site.`,
    }));

  return {
    purpose,
    journeys: journeys.length ? journeys : ["Primary content discovery"],
    importantActions,
    missingCapabilities: missing,
    recommendedTools,
    usedLlm: false,
  };
}

export async function interpretWebsite(
  kind: SiteKind,
  pages: PageExtract[],
  workflows: WorkflowSignal[],
  declared: DeclaredWebMcpTool[],
): Promise<AiAnalysis> {
  const fallback = heuristicAnalysis(kind, pages, workflows, declared);
  const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) return fallback;

  const compact = pages.map((p) => ({
    url: p.url,
    title: p.title,
    description: p.metaDescription,
    headings: p.headings.slice(0, 12),
    nav: p.navItems.slice(0, 12),
    buttons: p.buttons.map((b) => b.text).slice(0, 12),
    forms: p.forms.map((f) => ({
      toolName: f.toolName,
      inputs: f.inputs.map((i) => i.name || i.label),
    })),
    tools: p.declaredTools.map((t) => t.name),
  }));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You analyze websites for AI-agent readiness. Return JSON with keys: purpose (string), journeys (string[]), importantActions (string[]), missingCapabilities (string[]), recommendedTools ({name, description, reason}[]). Use verb_noun tool names. siteKind is a classifier hint. If it is services, content, or unknown, do not recommend ecommerce tools (search_products, add_to_cart, checkout, product filtering) unless the extracted UI clearly contains a storefront such as Add to cart or checkout. An agency that builds ecommerce sites is still a services business. Recommend tools that match actual journeys: contact, quote, services, booking, or content. Distinguish observations from suggestions. Do not claim WebMCP is absent if it was merely unverified.",
          },
          {
            role: "user",
            content: JSON.stringify({
              kind,
              declaredTools: declared.map((t) => t.name),
              workflows,
              pages: compact,
            }),
          },
        ],
      }),
    });
    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const err = (await response.json()) as { error?: { message?: string; code?: string } };
        if (err.error?.message) detail = err.error.message;
      } catch {
        // ignore parse failures
      }
      return { ...fallback, error: `AI analysis fell back to heuristics (${detail}).` };
    }
    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const parsed = JSON.parse(json.choices?.[0]?.message?.content || "{}") as Partial<AiAnalysis>;
    return {
      purpose: parsed.purpose || fallback.purpose,
      journeys: parsed.journeys?.length ? parsed.journeys : fallback.journeys,
      importantActions: parsed.importantActions?.length ? parsed.importantActions : fallback.importantActions,
      missingCapabilities: parsed.missingCapabilities?.length
        ? parsed.missingCapabilities
        : fallback.missingCapabilities,
      recommendedTools: parsed.recommendedTools?.length ? parsed.recommendedTools : fallback.recommendedTools,
      usedLlm: true,
    };
  } catch (error) {
    const detail = error instanceof Error && error.name === "AbortError" ? "request timed out" : "request failed";
    return { ...fallback, error: `AI analysis fell back to heuristics (${detail}).` };
  } finally {
    clearTimeout(timer);
  }
}
