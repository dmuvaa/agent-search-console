"use client";

import { useEffect } from "react";
import { initializeWebMCPPolyfill } from "@mcp-b/webmcp-polyfill";

export function WebMcpRuntime() {
  useEffect(() => {
    initializeWebMCPPolyfill();
  }, []);
  return null;
}

export function getModelContext() {
  if (typeof document === "undefined") return undefined;
  initializeWebMCPPolyfill();
  const doc = document as Document & {
    modelContext?: {
      registerTool: (
        tool: {
          name: string;
          description: string;
          inputSchema?: object;
          execute: (input?: Record<string, unknown>) => unknown;
          annotations?: Record<string, unknown>;
        },
        options?: { signal?: AbortSignal; exposedTo?: string[] },
      ) => Promise<void>;
      getTools?: () => Promise<unknown[]>;
    };
  };
  return doc.modelContext;
}
