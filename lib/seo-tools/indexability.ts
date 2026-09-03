import { parseSafeUrl } from "@/lib/seo-tools/http";

async function checkUrl(url: string, robotsRules: Array<{ path: string }>) {
  let finalUrl = url;
  let status = 0;
  let canonical = "";
  let noindex = false;
  let xRobotsNoindex = false;
  let isRedirect = false;
  let robotsBlocked = false;

  try {
    const u = new URL(url);
    robotsBlocked = robotsRules.some((r) => u.pathname.startsWith(r.path));
  } catch {
    /* ignore */
  }

  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Agent Search Console; +https://agent-search-console.vercel.app)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(10000),
    });

    status = res.status;
    finalUrl = res.url;
    isRedirect = finalUrl !== url;

    const xRobots = res.headers.get("x-robots-tag") || "";
    xRobotsNoindex = xRobots.toLowerCase().includes("noindex");

    const html = await res.text();
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    if (canonicalMatch) canonical = canonicalMatch[1];

    const metaRobots = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
    if (metaRobots) noindex = metaRobots[1].toLowerCase().includes("noindex");
  } catch {
    /* ignore */
  }

  const indexable =
    status >= 200 && status < 300 && !noindex && !xRobotsNoindex && !robotsBlocked && !isRedirect;

  return {
    url,
    finalUrl,
    status,
    canonical: canonical || "",
    noindex: noindex || xRobotsNoindex,
    robotsBlocked,
    isRedirect,
    indexable,
  };
}

export async function checkIndexability(rawUrl: string, requestHost: string) {
  const parsed = await parseSafeUrl(rawUrl, requestHost);
  let url = parsed.toString();
  if (!url.startsWith("http")) url = "https://" + url;

  const domain = new URL(url).hostname;
  let robotsRules: Array<{ path: string }> = [];
  try {
    const robotsUrl = `${new URL(url).origin}/robots.txt`;
    await parseSafeUrl(robotsUrl, requestHost);
    const r = await fetch(robotsUrl, { signal: AbortSignal.timeout(4000) });
    const text = await r.text();
    robotsRules = text
      .split("\n")
      .filter((l) => l.toLowerCase().startsWith("disallow:"))
      .map((l) => ({ path: l.split(":")[1]?.trim() || "" }))
      .filter((rule) => rule.path && rule.path !== "/");
  } catch {
    /* ignore */
  }

  const results = await Promise.all([checkUrl(url, robotsRules)]);

  const summary = {
    total: results.length,
    indexable: results.filter((r) => r.indexable).length,
    noindex: results.filter((r) => r.noindex).length,
    blocked: results.filter((r) => r.robotsBlocked).length,
    redirected: results.filter((r) => r.isRedirect).length,
    errors: results.filter((r) => r.status === 0 || r.status >= 400).length,
  };

  return { results, summary, domain };
}
