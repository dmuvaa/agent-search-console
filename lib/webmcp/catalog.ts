import type { AuditReport } from "@/types/audit";
import { generateToolImplementation } from "@/lib/webmcp/codegen";
import { defaultSchema } from "@/lib/scoring/engine";

export function generateNamedTool(name: string, description: string, report?: AuditReport) {
  const existing = report?.generatedTools.find((t) => t.name === name);
  if (existing) return existing;
  const schema = defaultSchema(name);
  return {
    name,
    description,
    schema,
    implementation: generateToolImplementation(name, description, schema),
  };
}

export const CONSOLE_TOOLS = [
  {
    name: "analyze_website",
    description:
      "Analyze a public website for AI-agent readiness. Use when the user wants an Agent Readiness Score, issues, or WebMCP coverage for a URL.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Public http(s) URL to analyze" },
      },
      required: ["url"],
    },
  },
  {
    name: "get_agent_score",
    description:
      "Return the Agent Readiness Score and category scores from the most recent analysis in this browser session.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_issues",
    description: "List detected agent-readiness issues from the most recent analysis, including severity and recommendations.",
    inputSchema: {
      type: "object",
      properties: {
        severity: {
          type: "string",
          description: "Optional severity filter: critical, high, medium, or low",
        },
      },
    },
  },
  {
    name: "get_recommendations",
    description: "Return WebMCP and markup recommendations from the most recent analysis. Detected facts and AI suggestions are labeled separately.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "generate_webmcp_plan",
    description: "Generate a starter WebMCP implementation plan (tool names, schemas, and sample registerTool code) from the most recent analysis.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "run_agent_test",
    description: "Simulate a predefined agent task against the most recent analysis by checking whether expected WebMCP tool names are declared. Does not run an agent or click the site.",
    inputSchema: {
      type: "object",
      properties: {
        taskId: {
          type: "string",
          description: "Optional template id such as commerce-find, commerce-compare, or booking-book",
        },
      },
    },
  },
] as const;

export const DEMO_TOOLS = [
  {
    name: "search_products",
    description:
      "Search the NovaShop catalog by natural-language query. Use when the user wants to find products by name, feature, or category words.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keywords, for example 'laptop 16GB'" },
      },
      required: ["query"],
    },
  },
  {
    name: "filter_products",
    description:
      "Filter the NovaShop catalog by category, price, rating, RAM, and availability. Use after search or instead of search when constraints are structured.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Optional keyword filter" },
        category: {
          type: "string",
          description: "laptops, headphones, monitors, keyboards, or cameras",
        },
        minPrice: { type: "number", description: "Minimum price in USD" },
        maxPrice: { type: "number", description: "Maximum price in USD" },
        minRating: { type: "number", description: "Minimum star rating" },
        minRam: { type: "number", description: "Minimum RAM in GB (laptops)" },
        availability: {
          type: "string",
          description: "in_stock, low_stock, or out_of_stock",
        },
      },
    },
  },
  {
    name: "get_product",
    description: "Retrieve one NovaShop product by id, including price, rating, availability, features, and specs.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Product id, for example novabook-air-14" },
      },
      required: ["id"],
    },
  },
  {
    name: "compare_products",
    description: "Compare two or more NovaShop products side by side. Use after identifying candidate product ids.",
    inputSchema: {
      type: "object",
      properties: {
        ids: {
          type: "array",
          items: { type: "string" },
          description: "Product ids to compare",
        },
      },
      required: ["ids"],
    },
  },
  {
    name: "add_to_cart",
    description:
      "Add a product to the shopper's cart in this browser. Does not complete a purchase. Prefer human confirmation before calling repeatedly.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Product id" },
        quantity: { type: "number", description: "Quantity, default 1" },
      },
      required: ["id"],
    },
  },
  {
    name: "prepare_checkout",
    description:
      "Summarize the current cart so a human can review totals before paying. Does not capture payment or place an order.",
    inputSchema: { type: "object", properties: {} },
  },
] as const;
