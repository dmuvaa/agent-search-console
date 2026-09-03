"use client";

import { useEffect } from "react";
import { getModelContext } from "@/components/webmcp/runtime";
import { ALL_WEBMCP_TOOLS } from "@/lib/webmcp/catalog";
import { SEO_TOOL_NAMES } from "@/lib/seo-tools/catalog";
import { registerToolOptions } from "@/lib/webmcp/agent-access";

type Input = Record<string, unknown> | undefined;

async function runSeoTool(name: string, input?: Input) {
  const url = String(input?.url || "");
  const response = await fetch("/api/seo-tools", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool: name, url }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "SEO check failed");
  return data;
}

async function generateSeoReport(input?: Input) {
  const url = String(input?.url || "");
  const response = await fetch("/api/seo-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "SEO report failed");
  return data;
}

export function ConsoleWebmcp() {
  useEffect(() => {
    const ctx = getModelContext();
    if (!ctx) return;
    const controller = new AbortController();
    const handlers: Record<string, (input?: Input) => Promise<unknown>> = {};

    for (const name of SEO_TOOL_NAMES) {
      handlers[name] = (input) => runSeoTool(name, input);
    }
    handlers.generate_seo_report = generateSeoReport;

    for (const tool of ALL_WEBMCP_TOOLS) {
      // WebMCP imperative registration: document.modelContext.registerTool({ ... }).
      void ctx
        .registerTool(
          {
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            annotations: { readOnlyHint: true },
            execute: (input) => handlers[tool.name](input as Input),
          },
          registerToolOptions(controller.signal),
        )
        .catch(() => {});
    }

    return () => controller.abort();
  }, []);

  return null;
}
