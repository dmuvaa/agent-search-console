import type { DeclaredWebMcpTool, PageExtract, WebMcpVerification } from "@/types/audit";

export function mergeDeclaredTools(pages: PageExtract[], extra: DeclaredWebMcpTool[] = []) {
  const map = new Map<string, DeclaredWebMcpTool>();
  for (const tool of extra) map.set(tool.name, tool);
  for (const page of pages) {
    for (const tool of page.declaredTools) map.set(tool.name, tool);
  }
  return [...map.values()];
}

export function webmcpStatus(pages: PageExtract[], declared: DeclaredWebMcpTool[]) {
  const signals = [...new Set(pages.flatMap((p) => [...p.webmcpSignals, ...p.scriptHints]))];
  if (declared.length > 0) {
    return {
      verification: "declared" as WebMcpVerification,
      note: "WebMCP tools were declared in page markup or a machine-readable manifest. Runtime execution was not observed by the server-side analyzer.",
      declaredCount: declared.length,
      signals,
    };
  }
  if (signals.some((s) => /registerTool|modelContext|webmcp/i.test(s))) {
    return {
      verification: "script_signal" as WebMcpVerification,
      note: "The page source mentions WebMCP APIs, but no tool schema was available to the crawler. Unable to verify runtime WebMCP tools.",
      declaredCount: 0,
      signals,
    };
  }
  return {
    verification: "unverified" as WebMcpVerification,
    note: "Unable to verify runtime WebMCP tools. The server-side crawler did not observe document.modelContext registrations. This does not prove the site has no WebMCP implementation.",
    declaredCount: 0,
    signals,
  };
}
