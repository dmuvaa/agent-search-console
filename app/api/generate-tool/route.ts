import { NextRequest } from "next/server";
import { generateNamedTool } from "@/lib/webmcp/catalog";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    toolName?: string;
    description?: string;
    workflow?: { name?: string; description?: string };
  };
  const name = body.toolName || body.workflow?.name;
  if (!name) {
    return Response.json({ error: "Provide a tool name." }, { status: 400 });
  }
  const description =
    body.description ||
    body.workflow?.description ||
    `Structured WebMCP operation for ${name.replaceAll("_", " ")}.`;
  return Response.json(generateNamedTool(name, description));
}
