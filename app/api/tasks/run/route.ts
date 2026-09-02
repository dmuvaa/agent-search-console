import { NextRequest } from "next/server";
import { analyzeWebsite } from "@/lib/analyzer";
import { evaluateTask, TASK_TEMPLATES, templatesFor } from "@/lib/tasks/evaluate";
import { FetchError } from "@/lib/analyzer/fetch";
import { UrlSafetyError } from "@/lib/security/url";

export async function POST(request: NextRequest) {
  const host = request.headers.get("host") || "localhost";
  const body = (await request.json()) as { url?: string; taskId?: string; task?: string };

  try {
    const report = await analyzeWebsite(body.url || "", host);
    const templates = templatesFor(report.siteKind);
    const template =
      TASK_TEMPLATES.find((t) => t.id === body.taskId) ||
      templates.find((t) => t.prompt === body.task) ||
      templates[0];
    if (!template) {
      return Response.json({ error: "No matching task template." }, { status: 400 });
    }
    const declared = report.tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));
    const result = evaluateTask(template, declared, report.workflows);
    return Response.json(result);
  } catch (error) {
    if (error instanceof UrlSafetyError || error instanceof FetchError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Task evaluation failed." }, { status: 500 });
  }
}
