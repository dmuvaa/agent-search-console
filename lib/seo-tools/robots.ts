import { parseSafeUrl, SeoToolError } from "@/lib/seo-tools/http";

export async function checkRobotsTxt(rawUrl: string, requestHost: string) {
  const input = await parseSafeUrl(rawUrl, requestHost);
  const target = input.toString().replace(/^https?:\/\//, "").split("/")[0];
  const robotsUrl = `https://${target}/robots.txt`;
  await parseSafeUrl(robotsUrl, requestHost);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(robotsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Agent Search Console; +https://agent-search-console.vercel.app)",
      },
      signal: controller.signal,
    });
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    throw new SeoToolError(error instanceof Error ? error.message : "Failed to fetch robots.txt");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    return {
      success: false,
      status: response.status,
      error: `Failed to fetch robots.txt. HTTP Status: ${response.status}`,
    };
  }

  const content = await response.text();

  const lines = content.split("\n");
  const sitemaps: string[] = [];
  const rules: { userAgent: string; type: "allow" | "disallow"; path: string }[] = [];

  let currentUserAgent = "*";

  lines.forEach((line) => {
    const cleanLine = line.split("#")[0].trim();
    if (!cleanLine) return;

    const lowerLine = cleanLine.toLowerCase();

    if (lowerLine.startsWith("sitemap:")) {
      sitemaps.push(cleanLine.substring(8).trim());
    } else if (lowerLine.startsWith("user-agent:")) {
      currentUserAgent = cleanLine.substring(11).trim() || "*";
    } else if (lowerLine.startsWith("disallow:")) {
      const path = cleanLine.substring(9).trim();
      if (path) {
        rules.push({ userAgent: currentUserAgent, type: "disallow", path });
      }
    } else if (lowerLine.startsWith("allow:")) {
      const path = cleanLine.substring(6).trim();
      if (path) {
        rules.push({ userAgent: currentUserAgent, type: "allow", path });
      }
    }
  });

  return {
    url: robotsUrl,
    success: true,
    status: response.status,
    content,
    sitemaps,
    rules,
  };
}
