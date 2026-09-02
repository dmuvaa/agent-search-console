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
