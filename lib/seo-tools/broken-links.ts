import * as cheerio from "cheerio";
import { fetchDocument, fetchOnce, parseSafeUrl } from "@/lib/seo-tools/http";

type LinkStatus = "ok" | "redirect" | "warning" | "broken" | "skipped";

function linkKind(pageUrl: URL, href: string) {
  try {
    const target = new URL(href);
    return target.hostname === pageUrl.hostname || target.hostname.endsWith(`.${pageUrl.hostname}`)
      ? "internal"
      : "external";
  } catch {
    return "external";
  }
}

function shouldSkipHref(href: string) {
  const value = href.trim().toLowerCase();
  return (
    !value ||
    value.startsWith("#") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("sms:") ||
    value.startsWith("javascript:")
  );
}

async function checkLink(url: URL, requestHost: string): Promise<{
  status: LinkStatus;
  statusCode: number | null;
  finalUrl: string | null;
  note: string;
}> {
  try {
    let response = await fetchOnce(url, requestHost, { method: "HEAD", timeoutMs: 5000 });
    if ([405, 403].includes(response.status)) {
      response = await fetchOnce(url, requestHost, { method: "GET", timeoutMs: 5000, maxBytes: 120_000 });
    }

    if (response.status >= 200 && response.status < 300) {
      return { status: "ok", statusCode: response.status, finalUrl: response.url, note: "Healthy response." };
    }
    if (response.status >= 300 && response.status < 400) {
      return {
        status: "redirect",
        statusCode: response.status,
        finalUrl: response.redirectedTo,
        note: "Link redirects. Consider linking to the final URL when it is stable.",
      };
    }
    if ([401, 403, 429].includes(response.status)) {
      return {
        status: "warning",
        statusCode: response.status,
        finalUrl: response.url,
        note: "Destination responded, but access was restricted for the checker.",
      };
    }
    return {
      status: "broken",
      statusCode: response.status,
      finalUrl: response.url,
      note: "Destination returned an error status.",
    };
  } catch (error) {
    return {
      status: "skipped",
      statusCode: null,
      finalUrl: null,
      note: error instanceof Error ? error.message : "The link could not be checked safely.",
    };
  }
}

export async function checkBrokenLinks(rawUrl: string, requestHost: string) {
  const start = await parseSafeUrl(rawUrl, requestHost);
  const document = await fetchDocument(start, requestHost, { timeoutMs: 10_000 });
  const $ = cheerio.load(document.body);
  const pageUrl = new URL(document.finalUrl);
  const seen = new Set<string>();
  const links: Array<{ href: string; text: string; kind: "internal" | "external" }> = [];

  $("a[href]").each((_, element) => {
    const rawHref = $(element).attr("href") || "";
    if (shouldSkipHref(rawHref)) return;
    let href: string;
    try {
      const resolved = new URL(rawHref, document.finalUrl);
      resolved.hash = "";
      href = resolved.toString();
    } catch {
      return;
    }
    if (seen.has(href)) return;
    seen.add(href);
    links.push({
      href,
      text: $(element).text().replace(/\s+/g, " ").trim().slice(0, 140),
      kind: linkKind(pageUrl, href),
    });
  });

  const limit = 40;
  const sampled = links.slice(0, limit);
  const checked = await Promise.all(
    sampled.map(async (link) => {
      const target = new URL(link.href);
      const result = await checkLink(target, requestHost);
      return { ...link, ...result };
    }),
  );

  const counts = checked.reduce(
    (acc, link) => {
      acc[link.status] += 1;
      acc[link.kind] += 1;
      return acc;
    },
    {
      ok: 0,
      redirect: 0,
      warning: 0,
      broken: 0,
      skipped: 0,
      internal: 0,
      external: 0,
    },
  );

  const issues = checked
    .filter((link) => link.status === "broken" || link.status === "redirect")
    .slice(0, 12)
    .map((link) => ({
      severity: link.status === "broken" ? "high" : "medium",
      message: `${link.status === "broken" ? "Broken" : "Redirecting"} link: ${link.href}`,
    }));

  return {
    url: document.finalUrl,
    success: true,
    status: document.status,
    summary: {
      total: links.length,
      checked: checked.length,
      healthy: counts.ok,
      okCount: counts.ok,
      broken: counts.broken,
      brokenCount: counts.broken,
      redirects: counts.redirect,
      warnings: counts.warning,
      skipped: counts.skipped,
      internal: counts.internal,
      external: counts.external,
      totalChecked: checked.length,
    },
    links: checked,
    issues,
    warnings:
      links.length > limit
        ? [`Checked the first ${limit} unique links out of ${links.length}.`]
        : [],
  };
}
