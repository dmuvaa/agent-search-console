import { parseStringPromise } from "xml2js";
import { parseSafeUrl, SeoToolError } from "@/lib/seo-tools/http";

const USER_AGENT = "Mozilla/5.0 (compatible; Agent Search Console; +https://agent-search-console.vercel.app)";

function isLikelySitemapUrl(url: URL) {
  const pathname = url.pathname.toLowerCase();
  return pathname.includes("sitemap") || pathname.endsWith(".xml");
}

function looksXml(contentType: string, body: string) {
  const trimmed = body.trimStart();
  return (
    contentType.includes("xml") ||
    contentType.includes("text/plain") ||
    trimmed.startsWith("<?xml") ||
    trimmed.startsWith("<urlset") ||
    trimmed.startsWith("<sitemapindex")
  );
}

async function fetchWithTimeout(url: string, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function sitemapCandidates(input: URL, requestHost: string) {
  const candidates: string[] = [];
  const add = async (value: string) => {
    try {
      const parsed = await parseSafeUrl(value, requestHost);
      const url = parsed.toString();
      if (!candidates.includes(url)) candidates.push(url);
    } catch {
      // Ignore unsafe or malformed discovery candidates.
    }
  };

  if (isLikelySitemapUrl(input)) {
    await add(input.toString());
  }

  const robotsUrl = new URL("/robots.txt", input).toString();
  try {
    const robotsResponse = await fetchWithTimeout(robotsUrl, 8000);
    if (robotsResponse.ok) {
      const robots = await robotsResponse.text();
      for (const line of robots.split(/\r?\n/)) {
        const cleanLine = line.split("#")[0].trim();
        if (cleanLine.toLowerCase().startsWith("sitemap:")) {
          await add(cleanLine.substring(8).trim());
        }
      }
    }
  } catch {
    // Fall back to the conventional /sitemap.xml location below.
  }

  await add(new URL("/sitemap.xml", input).toString());
  await add(input.toString());
  return candidates;
}

export async function checkSitemap(rawUrl: string, requestHost: string) {
  const parsed = await parseSafeUrl(rawUrl, requestHost);

  let validUrl = "";
  let xml = "";
  const tried = await sitemapCandidates(parsed, requestHost);

  try {
    for (const candidate of tried) {
      const response = await fetchWithTimeout(candidate);
      if (!response.ok) continue;

      const body = await response.text();
      const contentType = response.headers.get("content-type") || "";
      if (!looksXml(contentType, body)) continue;

      validUrl = candidate;
      xml = body;
      break;
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, error: "Request timed out." };
    }
    throw new SeoToolError(error instanceof Error ? error.message : "Failed to analyze sitemap");
  }

  if (!validUrl || !xml) {
    return {
      success: false,
      error: `Could not find a readable XML sitemap. Tried: ${tried.join(", ")}`,
    };
  }

  let result: Record<string, unknown>;

  try {
    result = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: true });
  } catch {
    return {
      success: false,
      error: "Invalid XML format.",
    };
  }

  let urlSet: Array<{
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: string;
    isSitemap?: boolean;
  }> = [];

  const sitemapindex = result.sitemapindex as { sitemap?: unknown } | undefined;
  const urlset = result.urlset as { url?: unknown } | undefined;

  if (sitemapindex && sitemapindex.sitemap) {
    const sitemaps = Array.isArray(sitemapindex.sitemap)
      ? sitemapindex.sitemap
      : [sitemapindex.sitemap];
    urlSet = sitemaps.map((s: { loc?: string; lastmod?: string }) => ({
      loc: s.loc || "",
      lastmod: s.lastmod,
      isSitemap: true,
    }));
  } else if (urlset && urlset.url) {
    urlSet = Array.isArray(urlset.url) ? urlset.url : [urlset.url];
  } else {
    return {
      success: false,
      error: "Could not find<urlset> or <sitemapindex> in the XML.",
    };
  }

  const totalUrls = urlSet.length;

  const checkLimit = 50;
  const urlsToCheck = urlSet.slice(0, checkLimit);
  let validUrls = 0;
  let brokenUrls = 0;

  const checkPromises = urlsToCheck.map(async (u) => {
    let status: number | null = null;
    if (!u.isSitemap) {
      try {
        await parseSafeUrl(u.loc, requestHost);
        const headReq = await fetch(u.loc, {
          method: "HEAD",
          headers: {
            "User-Agent": USER_AGENT,
          },
        });
        status = headReq.status;
      } catch {
        status = 500;
      }

      if (status === 200) validUrls++;
      else brokenUrls++;
    }

    return {
      loc: u.loc,
      lastmod: u.lastmod,
      changefreq: u.changefreq,
      priority: u.priority,
      status,
    };
  });

  const checkedResults = await Promise.all(checkPromises);

  const unchecked = urlSet.slice(checkLimit, 100).map((u) => ({
    loc: u.loc,
    lastmod: u.lastmod,
    changefreq: u.changefreq,
    priority: u.priority,
    status: null as number | null,
  }));

  const finalUrls = [...checkedResults, ...unchecked];
  const checkedCount = urlSet[0]?.isSitemap ? 0 : checkedResults.length;

  return {
    url: validUrl,
    success: true,
    summary: {
      total: totalUrls,
      checked: checkedCount,
      valid: validUrls,
      broken: brokenUrls,
    },
    urls: finalUrls,
  };
}
