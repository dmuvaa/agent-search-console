import type {
  AiAnalysis,
  CategoryKey,
  Issue,
  Recommendation,
  SiteKind,
  ToolQualityFinding,
  WorkflowSignal,
} from "@/types/audit";
import type { DeclaredWebMcpTool, PageExtract } from "@/types/audit";
import { generateToolImplementation } from "@/lib/webmcp/codegen";

const GENERIC_LINK = /^(click here|here|learn more|read more|more|link|this)$/i;
const GENERIC_TOOL = /^(doThing|action|process|handle|run|tool|test|foo|bar)$/i;

function safePath(url: string) {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function copyBlob(pages: PageExtract[]) {
  return pages
    .map((p) => [p.title, p.metaDescription, p.textSample, p.headings.map((h) => h.text).join(" ")].join(" "))
    .join(" ")
    .toLowerCase();
}

function uiBlob(pages: PageExtract[]) {
  return pages
    .map((p) =>
      [
        ...p.navItems,
        ...p.buttons.map((b) => `${b.text} ${b.ariaLabel}`),
        ...p.forms.flatMap((f) => [
          f.action,
          f.toolName,
          ...f.inputs.map((i) => `${i.name} ${i.type} ${i.label} ${i.placeholder}`),
        ]),
        ...p.links.map((l) => l.text),
        ...p.headings.map((h) => h.text),
      ].join(" "),
    )
    .join(" ")
    .toLowerCase();
}

export function detectSiteKind(pages: PageExtract[]): SiteKind {
  const copy = copyBlob(pages);
  const ui = uiBlob(pages);
  const jsonLd = pages.flatMap((p) => p.jsonLdTypes).join(" ").toLowerCase();

  let commerce = 0;
  let services = 0;
  let saas = 0;
  let booking = 0;
  let content = 0;

  if (/\b(product|offer|store|itemlist)\b/.test(jsonLd)) commerce += 4;
  if (/\b(professionalservice|localbusiness|organization|service)\b/.test(jsonLd)) services += 2;

  if (/add to cart|add to bag|shopping cart|buy now/.test(ui)) commerce += 6;
  if (/proceed to checkout|\byour cart\b/.test(`${ui} ${copy}`)) commerce += 3;
  if (/\bsku\b|product catalog|shop now/.test(ui)) commerce += 2;
  if (pages.some((p) => /\/(products?|cart|checkout)(\/|\?|$)/i.test(safePath(p.url)))) commerce += 4;
  if (/\$\d/.test(`${ui} ${copy}`) && /\bcart\b/i.test(ui)) commerce += 3;

  // Marketing sites that *build* stores are not storefronts.
  if (
    /ecommerce website development|we (build|develop|create|offer|deliver).{0,80}ecommerce|do you build ecommerce|ecommerce functionality/.test(
      copy,
    )
  ) {
    commerce -= 8;
    services += 4;
  }

  if (/get a quote|request a quote|free consultation|tell us about your project/.test(`${ui} ${copy}`)) {
    services += 4;
  }
  if (/our services|website development|web (design|agency)|we (build|deliver|offer|provide)/.test(copy)) {
    services += 3;
  }
  if (/contact us|get in touch|whatsapp/.test(ui)) services += 1;

  if (/start (a )?free trial|pricing plans|request a demo/.test(`${ui} ${copy}`)) saas += 4;
  if (/\bsaas\b/.test(copy)) saas += 2;

  if (/book (an )?appointment|check availability|schedule a/.test(`${ui} ${copy}`)) booking += 4;
  if (/\bbooking\b|\breservation\b/.test(ui)) booking += 2;

  if (/\b(blog|documentation|docs|article|guide)\b/.test(`${ui} ${copy}`)) content += 2;

  const ranked: [SiteKind, number][] = [
    ["commerce", commerce],
    ["services", services],
    ["saas", saas],
    ["booking", booking],
    ["content", content],
  ];
  ranked.sort((a, b) => b[1] - a[1]);
  const best = ranked[0];
  const second = ranked[1];
  if (best && second && best[1] >= 3 && best[1] > second[1]) return best[0];
  if (services >= 2) return "services";
  return "unknown";
}

export function detectWorkflows(pages: PageExtract[], kind: SiteKind): WorkflowSignal[] {
  const ui = uiBlob(pages);
  const hasSearchControl = pages.some((p) =>
    p.forms.some((f) =>
      f.inputs.some(
        (i) =>
          i.type === "search" ||
          /search|query|^q$/i.test(i.name) ||
          /search/i.test(`${i.label} ${i.placeholder}`),
      ),
    ),
  );
  const hasContact =
    pages.some((p) => p.forms.some((f) => f.inputs.some((i) => /email|message|name|phone/i.test(`${i.name} ${i.label}`)))) ||
    /contact|whatsapp|get a quote/i.test(ui);
  const hasRegister = /sign.?up|register|create account/i.test(ui);
  const hasCart = /add to cart|add to bag|shopping cart|\bview cart\b|\bcart\s*\(/.test(ui);
  const hasCheckout = /proceed to checkout|\bcheckout\b/.test(ui);
  const hasCompare = /\bcompare\b/.test(ui);
  const hasFilter = pages.some((p) =>
    p.forms.some((f) => f.inputs.some((i) => /filter|category|minprice|maxprice|price/i.test(`${i.name} ${i.label}`))),
  );

  const base: WorkflowSignal[] = [
    { id: "search", label: "Search", present: hasSearchControl, evidence: "Search field in the UI" },
    { id: "contact", label: "Contact", present: hasContact, evidence: "Contact or inquiry form" },
    { id: "register", label: "Registration", present: hasRegister, evidence: "Account creation language" },
  ];

  if (kind === "commerce") {
    return [
      ...base,
      { id: "filter", label: "Product filtering", present: hasFilter, evidence: "Filter controls" },
      { id: "compare", label: "Product comparison", present: hasCompare, evidence: "Compare UI" },
      { id: "cart", label: "Add to cart", present: hasCart, evidence: "Cart actions" },
      { id: "checkout", label: "Checkout", present: hasCheckout, evidence: "Checkout flow" },
      { id: "product", label: "Product details", present: /product/i.test(ui), evidence: "Product pages or cards" },
    ];
  }
  if (kind === "booking") {
    return [
      ...base,
      { id: "availability", label: "Find availability", present: /availab/i.test(ui), evidence: "Availability language" },
      { id: "book", label: "Book appointment", present: /book|appointment/i.test(ui), evidence: "Booking language" },
    ];
  }
  if (kind === "saas") {
    return [
      ...base,
      { id: "pricing", label: "Find pricing", present: /pricing|plan/i.test(ui), evidence: "Pricing language" },
      { id: "trial", label: "Start a trial", present: /trial/i.test(ui), evidence: "Trial language" },
    ];
  }
  return [
    ...base,
    { id: "quote", label: "Request a quote", present: /quote|consultation|proposal/i.test(ui), evidence: "Quote language" },
    {
      id: "services",
      label: "List services",
      present: /services|what we do|our work/i.test(ui),
      evidence: "Services navigation or headings",
    },
  ];
}

function clamp(n: number, max = 20) {
  return Math.max(0, Math.min(max, Math.round(n)));
}

export function scoreDiscoverability(pages: PageExtract[]): { score: number; notes: string[] } {
  const primary = pages[0];
  if (!primary) return { score: 0, notes: ["No pages fetched"] };
  let score = 0;
  const notes: string[] = [];
  if (primary.title.length > 8) {
    score += 3;
  } else notes.push("Missing or weak page title");
  if (primary.metaDescription.length > 40) score += 2;
  else notes.push("Missing meta description");
  if (primary.headings.some((h) => h.level === 1)) score += 3;
  else notes.push("No H1 heading");
  if (primary.headings.length >= 3) score += 2;
  if (primary.navItems.length >= 3) score += 3;
  else notes.push("Navigation is thin or unlabeled");
  const descriptive = primary.links.filter((l) => l.text && !GENERIC_LINK.test(l.text)).length;
  if (descriptive >= 5) score += 2;
  else notes.push("Links are sparse or non-descriptive");
  if (primary.landmarks.includes("main") && primary.landmarks.includes("nav")) score += 2;
  else notes.push("Missing semantic landmarks");
    const labeled = primary.buttons.filter((b) => (b.text || b.ariaLabel).trim().length > 1).length;
    if (labeled >= 1) score += 3;
    else notes.push("Interactive elements lack accessible names");
  return { score: clamp(score), notes };
}

export function scoreWorkflow(pages: PageExtract[], workflows: WorkflowSignal[]): { score: number; notes: string[] } {
  const present = workflows.filter((w) => w.present).length;
  const coverage = workflows.length ? (present / workflows.length) * 12 : 6;
  const labeledInputs = pages.flatMap((p) => p.forms.flatMap((f) => f.inputs)).filter((i) => i.label || i.placeholder);
  const forms = pages.reduce((n, p) => n + p.forms.length, 0);
  let score = coverage;
  const notes: string[] = [];
  if (forms > 0) score += 4;
  else notes.push("No forms detected");
  if (labeledInputs.length >= 2) score += 4;
  else notes.push("Form inputs are missing labels");
  if (pages.length > 1) score += 2;
  return { score: clamp(score), notes };
}

export function expectedTools(kind: SiteKind): { name: string; workflow: string; workflowId: string }[] {
  if (kind === "commerce") {
    return [
      { name: "search_products", workflow: "Product search", workflowId: "search" },
      { name: "filter_products", workflow: "Product filtering", workflowId: "filter" },
      { name: "get_product", workflow: "Product details", workflowId: "product" },
      { name: "compare_products", workflow: "Product comparison", workflowId: "compare" },
      { name: "add_to_cart", workflow: "Cart", workflowId: "cart" },
      { name: "prepare_checkout", workflow: "Checkout", workflowId: "checkout" },
    ];
  }
  if (kind === "booking") {
    return [
      { name: "find_availability", workflow: "Availability", workflowId: "availability" },
      { name: "book_appointment", workflow: "Booking", workflowId: "book" },
    ];
  }
  if (kind === "saas") {
    return [
      { name: "get_plans", workflow: "Pricing", workflowId: "pricing" },
      { name: "start_trial", workflow: "Trial", workflowId: "trial" },
      { name: "get_pricing", workflow: "Pricing", workflowId: "pricing" },
    ];
  }
  if (kind === "content") {
    return [{ name: "search_content", workflow: "Find content", workflowId: "search" }];
  }
  return [
    { name: "contact_provider", workflow: "Contact", workflowId: "contact" },
    { name: "request_quote", workflow: "Quote", workflowId: "quote" },
    { name: "get_services", workflow: "List services", workflowId: "services" },
  ];
}

export function scoreWebmcp(
  declared: DeclaredWebMcpTool[],
  kind: SiteKind,
  verification: string,
): { score: number; notes: string[] } {
  const expected = expectedTools(kind);
  const names = new Set(declared.map((t) => t.name));
  const covered = expected.filter((e) =>
    [...names].some((n) => n === e.name || n.includes(e.name.split("_")[0])),
  ).length;
  const notes: string[] = [];
  if (declared.length === 0) {
    if (verification === "unverified") {
      notes.push("No declared tools; runtime WebMCP could not be verified");
      return { score: 4, notes };
    }
    notes.push("No WebMCP tools were declared for important workflows");
    return { score: 2, notes };
  }
  const coverage = expected.length ? (covered / expected.length) * 16 : Math.min(16, declared.length * 4);
  const extra = Math.min(4, declared.length);
  return { score: clamp(coverage + extra * 0.5 + 2), notes };
}

export function scoreToolQuality(declared: DeclaredWebMcpTool[]): {
  score: number;
  tools: ToolQualityFinding[];
} {
  if (declared.length === 0) return { score: 0, tools: [] };
  const tools = declared.map((tool) => {
    const problems: string[] = [];
    let score = 0;
    if (/^[a-z][a-z0-9_]*$/.test(tool.name) && tool.name.includes("_") && !GENERIC_TOOL.test(tool.name)) {
      score += 5;
    } else {
      problems.push("Use a verb_noun name such as search_products");
    }
    if (tool.description.trim().length >= 40) score += 5;
    else problems.push("Description is missing or too short to guide an agent");
    const schema = tool.inputSchema;
    const properties =
      schema && typeof schema === "object" && schema.properties && typeof schema.properties === "object"
        ? (schema.properties as Record<string, { description?: string; type?: string }>)
        : null;
    const propCount = properties ? Object.keys(properties).length : 0;
    if (propCount > 0) score += 5;
    else if (!schema || propCount === 0) {
      // Zero-argument tools are valid.
      score += 5;
    } else {
      problems.push("Input schema is missing structured properties");
    }
    const required = schema && Array.isArray((schema as { required?: unknown }).required)
      ? ((schema as { required: unknown[] }).required)
      : [];
    if (propCount === 0 || required.length > 0 || propCount > 0) {
      score += 3;
    }
    const described = properties
      ? Object.values(properties).filter((p) => p && p.description && p.description.length > 8).length
      : 0;
    if (propCount === 0 || described > 0) score += 2;
    else problems.push("Schema fields lack descriptions");
    return {
      name: tool.name,
      score: clamp(score),
      description: tool.description,
      inputSchema: tool.inputSchema,
      problems,
    };
  });
  const avg = tools.reduce((s, t) => s + t.score, 0) / tools.length;
  return { score: clamp(avg), tools };
}

export function ratingFor(score: number) {
  if (score >= 90) return "Excellent" as const;
  if (score >= 75) return "Strong" as const;
  if (score >= 60) return "Good" as const;
  if (score >= 40) return "Needs improvement" as const;
  return "Poor" as const;
}

export function buildIssues(args: {
  kind: SiteKind;
  pages: PageExtract[];
  workflows: WorkflowSignal[];
  declared: DeclaredWebMcpTool[];
  tools: ToolQualityFinding[];
  discoverNotes: string[];
  workflowNotes: string[];
  webmcpNotes: string[];
}): Issue[] {
  const issues: Issue[] = [];
  const names = new Set(args.declared.map((t) => t.name));
  const expected = expectedTools(args.kind);

  for (const note of args.discoverNotes) {
    issues.push({
      id: slug(`discover-${note}`),
      severity: "medium",
      category: "discoverability",
      title: note,
      problem: note,
      whyItMatters: "Agents rely on titles, headings, and labeled controls to understand what a page is for.",
      recommendation: "Use semantic HTML, a unique H1, and descriptive link and button text.",
      affectedWorkflow: "Discovery",
      implementation: "Prefer landmarks, labeled inputs, and headings that name real tasks.",
      source: "detected",
    });
  }

  for (const expectedTool of expected) {
    const workflow = args.workflows.find((w) => w.id === expectedTool.workflowId);
    if (!workflow?.present) continue;
    const hasTool = [...names].some((n) => n === expectedTool.name || n.replace(/-/g, "_") === expectedTool.name);
    if (!hasTool) {
      issues.push({
        id: slug(`missing-${expectedTool.name}`),
        severity: expectedTool.name.includes("checkout") || expectedTool.name.includes("book") ? "critical" : "high",
        category: "webmcp",
        title: `${expectedTool.workflow} is not agent-accessible`,
        problem: `Agents can often see the ${expectedTool.workflow.toLowerCase()} UI, but there is no structured WebMCP tool named ${expectedTool.name}.`,
        whyItMatters:
          "Without a registered tool, an agent has to guess at buttons and forms. That is slow, brittle, and fails on dynamic interfaces.",
        recommendation: `Expose a ${expectedTool.name} WebMCP tool.`,
        affectedWorkflow: expectedTool.workflow,
        suggestedTool: {
          name: expectedTool.name,
          description: `Perform the ${expectedTool.workflow.toLowerCase()} workflow with structured inputs.`,
          inputs: defaultInputs(expectedTool.name),
        },
        implementation: generateToolImplementation(expectedTool.name, `Perform the ${expectedTool.workflow.toLowerCase()} workflow.`, defaultSchema(expectedTool.name)),
        source: "detected",
      });
    }
  }

  for (const tool of args.tools) {
    if (tool.problems.length === 0) continue;
    issues.push({
      id: slug(`quality-${tool.name}`),
      severity: "medium",
      category: "toolQuality",
      title: `${tool.name} has schema or naming issues`,
      problem: tool.problems.join(" "),
      whyItMatters: "Agents choose tools from names and descriptions. Vague tools get skipped or called incorrectly.",
      recommendation: "Use verb_noun names, say when to call the tool, and describe every input field.",
      affectedWorkflow: tool.name,
      implementation: generateToolImplementation(tool.name, tool.description || `Run ${tool.name}.`, tool.inputSchema ?? defaultSchema(tool.name)),
      source: "detected",
    });
  }

  if (args.pages.some((p) => p.forms.some((f) => f.inputs.some((i) => i.type !== "hidden" && !i.label && !i.placeholder)))) {
    issues.push({
      id: "unlabeled-inputs",
      severity: "high",
      category: "workflow",
      title: "Form inputs are missing labels",
      problem: "At least one form control has no associated label or placeholder.",
      whyItMatters: "Agents and assistive tech cannot tell what unlabeled fields mean.",
      recommendation: "Associate a <label> with every input and keep the accessible name specific.",
      affectedWorkflow: "Forms",
      implementation: "Use for/id labels, not placeholder-only fields.",
      source: "detected",
    });
  }

  return issues;
}

export function buildRecommendations(args: {
  kind: SiteKind;
  issues: Issue[];
  ai: AiAnalysis;
  declared: DeclaredWebMcpTool[];
}): Recommendation[] {
  const detected: Recommendation[] = args.issues
    .filter((i) => i.severity === "critical" || i.severity === "high")
    .map((issue) => ({
      id: `rec-${issue.id}`,
      title: issue.recommendation,
      detail: issue.problem,
      source: "detected" as const,
      toolName: issue.suggestedTool?.name,
    }));

  const commerceName = /search_products|filter_products|get_product|compare_products|add_to_cart|prepare_checkout/;
  const aiRecs: Recommendation[] = args.ai.recommendedTools
    .filter((tool) => args.kind === "commerce" || !commerceName.test(tool.name))
    .map((tool, index) => ({
      id: `ai-${index}-${tool.name}`,
      title: `Consider ${tool.name}`,
      detail: `${tool.reason} ${tool.description}`,
      source: "ai",
      toolName: tool.name,
    }));

  return [...detected, ...aiRecs].slice(0, 12);
}

export function generatedFromIssues(issues: Issue[]) {
  const seen = new Set<string>();
  return issues
    .filter((i) => i.suggestedTool)
    .map((issue) => {
      const tool = issue.suggestedTool!;
      const schema = defaultSchema(tool.name);
      return {
        name: tool.name,
        description: tool.description,
        schema,
        implementation: issue.implementation,
      };
    })
    .filter((tool) => {
      if (seen.has(tool.name)) return false;
      seen.add(tool.name);
      return true;
    });
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function defaultInputs(name: string) {
  if (name.includes("search")) {
    return [{ name: "query", type: "string", description: "Natural-language search query", required: true }];
  }
  if (name.includes("filter")) {
    return [
      { name: "minPrice", type: "number", description: "Minimum price", required: false },
      { name: "maxPrice", type: "number", description: "Maximum price", required: false },
      { name: "category", type: "string", description: "Category slug", required: false },
    ];
  }
  if (name.includes("compare")) {
    return [{ name: "ids", type: "array", description: "Two or more product ids", required: true }];
  }
  if (name.includes("cart")) {
    return [
      { name: "id", type: "string", description: "Product id", required: true },
      { name: "quantity", type: "number", description: "Quantity to add", required: false },
    ];
  }
  if (name.includes("quote")) {
    return [
      { name: "name", type: "string", description: "Requester name", required: true },
      { name: "email", type: "string", description: "Requester email", required: true },
      { name: "project", type: "string", description: "What they need quoted", required: true },
    ];
  }
  if (name.includes("contact")) {
    return [
      { name: "name", type: "string", description: "Sender name", required: true },
      { name: "email", type: "string", description: "Sender email", required: true },
      { name: "message", type: "string", description: "Message body", required: true },
    ];
  }
  if (name.includes("services") || name.includes("get_site") || name === "get_plans" || name === "get_pricing") {
    return [];
  }
  if (name.includes("get_") || name.includes("product")) {
    return [{ name: "id", type: "string", description: "Record id", required: true }];
  }
  if (name.includes("book")) {
    return [
      { name: "providerId", type: "string", description: "Provider or staff id", required: true },
      { name: "date", type: "string", description: "Date (YYYY-MM-DD)", required: true },
      { name: "time", type: "string", description: "Time (HH:MM)", required: true },
      { name: "customerName", type: "string", description: "Customer name", required: true },
      { name: "customerEmail", type: "string", description: "Customer email", required: true },
    ];
  }
  return [{ name: "query", type: "string", description: "Task input", required: true }];
}

export function defaultSchema(name: string): Record<string, unknown> {
  const inputs = defaultInputs(name);
  return {
    type: "object",
    properties: Object.fromEntries(
      inputs.map((input) => [
        input.name,
        {
          type: input.type === "array" ? "array" : input.type,
          description: input.description,
          ...(input.type === "array" ? { items: { type: "string" } } : {}),
        },
      ]),
    ),
    required: inputs.filter((i) => i.required).map((i) => i.name),
  };
}

export function categoryMeta(): { key: CategoryKey; label: string; blurb: string }[] {
  return [
    { key: "discoverability", label: "Discoverability", blurb: "Can an agent tell what this site is? 0–20" },
    { key: "workflow", label: "Workflow access", blurb: "Are the human tasks visible? 0–20" },
    { key: "webmcp", label: "Agent tools", blurb: "Are those tasks published as WebMCP tools? 0–20" },
    { key: "toolQuality", label: "Tool quality", blurb: "Are the tools clearly named and typed? 0–20" },
    { key: "taskSuccess", label: "Task simulation", blurb: "Are the expected tools declared for typical jobs? 0–20" },
  ];
}

export function siteKindLabel(kind: SiteKind) {
  if (kind === "commerce") return "Storefront";
  if (kind === "saas") return "Software product";
  if (kind === "booking") return "Booking";
  if (kind === "services") return "Service business";
  if (kind === "content") return "Content";
  return "General website";
}
