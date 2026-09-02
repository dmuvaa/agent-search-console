export const AGENT_ORIGINS = ["https://chatgpt.com", "https://chat.openai.com"] as const;

export const TOOLS_PERMISSIONS_POLICY = `tools=(self ${AGENT_ORIGINS.map((origin) => `"${origin}"`).join(" ")})`;

export function registerToolOptions(signal: AbortSignal) {
  return {
    signal,
    exposedTo: [...AGENT_ORIGINS],
  };
}
