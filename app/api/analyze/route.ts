import { NextRequest } from "next/server";
import { analyzeWebsite } from "@/lib/analyzer";
import { FetchError } from "@/lib/analyzer/fetch";
import { UrlSafetyError } from "@/lib/security/url";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(clientIp(request));
  if (!limited.ok) {
    return Response.json(
      { error: "Too many analyses from this network. Try again in a bit." },
      { status: 429 },
    );
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Please enter a valid URL." }, { status: 400 });
  }

  const host = request.headers.get("host") || "localhost";
  try {
    const report = await analyzeWebsite(body.url || "", host);
    return Response.json(report);
  } catch (error) {
    if (error instanceof UrlSafetyError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof FetchError) {
      const status = error.code === "timeout" ? 504 : 422;
      return Response.json({ error: error.message, code: error.code }, { status });
    }
    return Response.json({ error: "Analysis failed unexpectedly." }, { status: 500 });
  }
}
