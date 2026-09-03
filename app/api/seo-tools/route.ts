import { NextRequest } from "next/server";
import { isSeoToolName, runSeoTool } from "@/lib/seo-tools";
import { SeoToolError } from "@/lib/seo-tools/http";
import { UrlSafetyError } from "@/lib/security/url";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const limited = rateLimit(clientIp(request));
  if (!limited.ok) {
    return Response.json(
      { error: "Too many requests from this network. Try again in a bit." },
      { status: 429 },
    );
  }

  let body: { tool?: string; url?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON with tool and url." }, { status: 400 });
  }

  const tool = String(body.tool || "");
  const url = String(body.url || "");
  if (!isSeoToolName(tool)) {
    return Response.json({ error: "Unknown SEO tool." }, { status: 400 });
  }
  if (!url.trim()) {
    return Response.json({ error: "Please enter a valid URL." }, { status: 400 });
  }

  const host = request.headers.get("host") || "localhost";
  try {
    const result = await runSeoTool(tool, url, host);
    return Response.json({ tool, ...result });
  } catch (error) {
    if (error instanceof UrlSafetyError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SeoToolError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "The SEO check failed unexpectedly." }, { status: 500 });
  }
}
