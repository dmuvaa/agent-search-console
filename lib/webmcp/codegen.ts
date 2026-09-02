export function generateToolImplementation(
  name: string,
  description: string,
  schema: Record<string, unknown>,
) {
  const schemaLiteral = JSON.stringify(schema, null, 2);
  return `// Starting point — review before shipping.
// Requires a WebMCP runtime: native document.modelContext or @mcp-b/webmcp-polyfill.

await document.modelContext.registerTool({
  name: ${JSON.stringify(name)},
  description: ${JSON.stringify(description)},
  inputSchema: ${schemaLiteral},
  annotations: { readOnlyHint: ${String(!/cart|book|checkout|trial|quote/i.test(name))} },
  async execute(input) {
    // Replace this with your real application logic.
    // Keep consequential actions behind an explicit human confirmation step.
    if (!input) {
      throw new Error("Missing tool input");
    }
    return {
      ok: true,
      tool: ${JSON.stringify(name)},
      input,
      message: "Stub implementation. Wire this to your product, booking, or account APIs.",
    };
  },
});
`;
}
