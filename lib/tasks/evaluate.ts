import type { DeclaredWebMcpTool, SiteKind, TaskResult, WorkflowSignal } from "@/types/audit";

export interface TaskTemplate {
  id: string;
  title: string;
  prompt: string;
  kind: SiteKind | "any";
  requiredTools: string[];
  fallbackSignals: string[];
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: "commerce-find",
    title: "Find a product under $1,000 with at least 16GB RAM",
    prompt: "Find a laptop under $1,000 with at least 16GB of RAM.",
    kind: "commerce",
    requiredTools: ["search_products", "get_product"],
    fallbackSignals: ["search", "filter", "product"],
  },
  {
    id: "commerce-compare",
    title: "Compare the three best matching products",
    prompt: "Compare the three best laptops under $1,000 with at least 16GB RAM.",
    kind: "commerce",
    requiredTools: ["filter_products", "compare_products"],
    fallbackSignals: ["compare", "product"],
  },
  {
    id: "commerce-cart",
    title: "Add a matching product to the cart",
    prompt: "Add a matching laptop to the cart without completing purchase.",
    kind: "commerce",
    requiredTools: ["get_product", "add_to_cart"],
    fallbackSignals: ["cart"],
  },
  {
    id: "saas-plan",
    title: "Find a plan that matches requirements",
    prompt: "Find a plan that supports SSO and a team of 10.",
    kind: "saas",
    requiredTools: ["get_plans", "get_pricing"],
    fallbackSignals: ["pricing"],
  },
  {
    id: "saas-trial",
    title: "Start a trial",
    prompt: "Start a trial without committing to a paid plan.",
    kind: "saas",
    requiredTools: ["start_trial"],
    fallbackSignals: ["trial", "register"],
  },
  {
    id: "services-quote",
    title: "Request a quote",
    prompt: "Request a quote from a provider.",
    kind: "services",
    requiredTools: ["request_quote"],
    fallbackSignals: ["quote", "contact"],
  },
  {
    id: "services-contact",
    title: "Contact the business",
    prompt: "Find how to contact this business or start an inquiry.",
    kind: "services",
    requiredTools: ["contact_provider"],
    fallbackSignals: ["contact"],
  },
  {
    id: "services-list",
    title: "List the services offered",
    prompt: "What services does this business offer?",
    kind: "services",
    requiredTools: ["get_services"],
    fallbackSignals: ["services"],
  },
  {
    id: "unknown-contact",
    title: "Contact the business",
    prompt: "Find how to contact this website.",
    kind: "unknown",
    requiredTools: ["contact_provider"],
    fallbackSignals: ["contact"],
  },
  {
    id: "content-search",
    title: "Find relevant content",
    prompt: "Find the main article or documentation for a topic.",
    kind: "content",
    requiredTools: ["search_content"],
    fallbackSignals: ["search"],
  },
  {
    id: "booking-find",
    title: "Find availability",
    prompt: "Find the next available appointment.",
    kind: "booking",
    requiredTools: ["find_availability"],
    fallbackSignals: ["availability"],
  },
  {
    id: "booking-book",
    title: "Book an appointment",
    prompt: "Book an appointment with an available provider.",
    kind: "booking",
    requiredTools: ["book_appointment"],
    fallbackSignals: ["book"],
  },
];

function hasTool(declared: DeclaredWebMcpTool[], name: string) {
  return declared.some((t) => t.name === name || t.name.replace(/-/g, "_") === name);
}

export function templatesFor(kind: SiteKind) {
  const matched = TASK_TEMPLATES.filter((t) => t.kind === kind);
  if (matched.length > 0) return matched;
  return TASK_TEMPLATES.filter((t) => t.kind === "unknown" || t.kind === "services").slice(0, 2);
}

export function evaluateTask(
  template: TaskTemplate,
  declared: DeclaredWebMcpTool[],
  workflows: WorkflowSignal[],
): TaskResult {
  const started = Date.now();
  const steps = [];
  const toolsUsed: string[] = [];
  let failed: { point: string; reason: string } | null = null;

  for (const [index, tool] of template.requiredTools.entries()) {
    const ok = hasTool(declared, tool);
    if (ok) toolsUsed.push(tool);
    steps.push({
      order: index + 1,
      action: tool.replaceAll("_", " "),
      tool,
      ok,
      detail: ok ? `Declared tool ${tool}` : `No ${tool} tool is declared`,
    });
    if (!ok && !failed) {
      failed = {
        point: tool.replaceAll("_", " "),
        reason: `The website does not expose a structured ${tool} operation.`,
      };
    }
  }

  if (failed) {
    const fallback = template.fallbackSignals.every((id) => workflows.find((w) => w.id === id)?.present);
    if (fallback) {
      return {
        id: template.id,
        title: template.title,
        template: template.prompt,
        status: "partial",
        durationMs: Date.now() - started + 400,
        toolsUsed,
        steps,
        result: "The human UI appears to contain this workflow, but the expected WebMCP tools are not declared.",
        failurePoint: failed.point,
        reason: failed.reason,
      };
    }
    return {
      id: template.id,
      title: template.title,
      template: template.prompt,
      status: "failed",
      durationMs: Date.now() - started + 280,
      toolsUsed,
      steps,
      result: "Task simulation failed: required WebMCP tool names are not declared.",
      failurePoint: failed.point,
      reason: failed.reason,
    };
  }

  return {
    id: template.id,
    title: template.title,
    template: template.prompt,
    status: "success",
    durationMs: Date.now() - started + 900 + template.requiredTools.length * 220,
    toolsUsed,
    steps,
    result:
      template.id === "commerce-find"
        ? "Task simulation passed: search_products and get_product are declared. Tools were not invoked."
        : "Task simulation passed: required WebMCP tool names are declared. Tools were not invoked.",
  };
}

export function scoreTasks(results: TaskResult[]) {
  if (results.length === 0) return 8;
  const values = results.map((r) => (r.status === "success" ? 20 : r.status === "partial" ? 8 : 2));
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}
