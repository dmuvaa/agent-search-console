import { SEO_REPORT_TOOL, SEO_TOOLS } from "@/lib/seo-tools/catalog";

export const AGENT_SEO_TOOLS = SEO_TOOLS.filter((tool) => tool.name !== "preview_serp_snippet");

export const ALL_WEBMCP_TOOLS = [SEO_REPORT_TOOL, ...AGENT_SEO_TOOLS];

export const WEBMCP_MANIFEST = {
  name: "Agent Search Console",
  description: "Technical SEO reports and checkers for humans and agents.",
  tools: ALL_WEBMCP_TOOLS,
};
