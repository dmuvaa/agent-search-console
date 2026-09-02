import { DEMO_TOOLS } from "@/lib/webmcp/catalog";

export type DemoWebmcpMode = "off" | "partial" | "full";

const PARTIAL_NAMES = new Set(["search_products", "get_product"]);

export function parseWebmcpParam(value: string | null | undefined): DemoWebmcpMode {
  if (value === "partial") return "partial";
  if (value === "full" || value === "on" || value === "1") return "full";
  return "off";
}

export function parseWebmcpHeader(value: string | null | undefined): DemoWebmcpMode {
  if (value === "partial" || value === "full") return value;
  if (value === "1") return "full";
  return "off";
}

export function demoToolsForMode(mode: DemoWebmcpMode) {
  if (mode === "off") return [];
  if (mode === "partial") return DEMO_TOOLS.filter((tool) => PARTIAL_NAMES.has(tool.name));
  return [...DEMO_TOOLS];
}

export function modeLabel(mode: DemoWebmcpMode) {
  if (mode === "partial") return "Partial";
  if (mode === "full") return "Full";
  return "Off";
}
