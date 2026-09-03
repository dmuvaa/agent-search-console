import { NextRequest } from "next/server";
import { generateSeoReport } from "@/lib/seo-tools/report";
import { SeoToolError } from "@/lib/seo-tools/http";
import { UrlSafetyError } from "@/lib/security/url";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const limited = rateLimit(clientIp(request));
  if (!limited.ok) {
    return Response.json(
      { error: "Too many requests from this network. Try again in a bit." },
      { status: 429 },
    );
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON with url." }, { status: 400 });
  }

  const url = String(body.url || "");
  if (!url.trim()) {
    return Response.json({ error: "Please enter a valid URL." }, { status: 400 });
  }

  const host = request.headers.get("host") || "localhost";
  try {
    const report = await generateSeoReport(url, host);
    return Response.json({ tool: "generate_seo_report", ...report });
  } catch (error) {
    if (error instanceof UrlSafetyError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SeoToolError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "The SEO report failed unexpectedly." }, { status: 500 });
  }
}
