import * as cheerio from "cheerio";
import { fetchDocument, getHeader, parseSafeUrl } from "@/lib/seo-tools/http";

function estimatePixelWidth(text: string, fontSize: 14 | 20) {
  let units = 0;
  for (const char of text) {
    if (char === " ") units += 3.5;
    else if ("il1|'.,:;!".includes(char)) units += 4;
    else if ("frt".includes(char)) units += 6;
    else if ("mwMW@#%".includes(char)) units += 13;
    else if (char >= "A" && char <= "Z") units += 10;
    else units += 7.5;
  }
  return Math.round(units * (fontSize / 14));
}

function truncateByPixels(text: string, limit: number, fontSize: 14 | 20) {
  if (estimatePixelWidth(text, fontSize) <= limit) return text;
  let output = "";
  for (const char of text) {
    if (estimatePixelWidth(`${output}${char}...`, fontSize) > limit) break;
    output += char;
  }
  return `${output.trimEnd()}...`;
}

function compareLoosely(a: string, b: string) {
  const left = a.toLowerCase().replace(/\s+/g, " ").trim();
  const right = b.toLowerCase().replace(/\s+/g, " ").trim();
  if (!left || !right) return true;
  return left.includes(right.slice(0, 24)) || right.includes(left.slice(0, 24));
}

export async function previewSerpSnippet(rawUrl: string, requestHost: string) {
  const start = await parseSafeUrl(rawUrl, requestHost);
  const document = await fetchDocument(start, requestHost, { timeoutMs: 10_000 });
  const $ = cheerio.load(document.body);

  const title = $("title").first().text().replace(/\s+/g, " ").trim();
  const description = $('meta[name="description"]').first().attr("content")?.replace(/\s+/g, " ").trim() || "";
  const canonicalRaw = $('link[rel="canonical"]').first().attr("href")?.trim() || "";
  const ogTitle = $('meta[property="og:title"]').first().attr("content")?.replace(/\s+/g, " ").trim() || "";
  const h1 = $("h1").first().text().replace(/\s+/g, " ").trim();
  const final = new URL(document.finalUrl);
  const canonical = canonicalRaw ? new URL(canonicalRaw, document.finalUrl).toString() : "";

  const titlePx = estimatePixelWidth(title, 20);
  const descriptionPx = estimatePixelWidth(description, 14);
  const titleLimitPx = 600;
  const descriptionLimitPx = 960;
  const titleTruncated = titlePx > titleLimitPx;
  const descriptionTruncated = descriptionPx > descriptionLimitPx;
  const rewriteReasons: string[] = [];

  if (!title) rewriteReasons.push("Missing title tag.");
  if (title && title.length < 30) rewriteReasons.push("Title is short enough that search engines may expand it.");
  if (titleTruncated) rewriteReasons.push("Title is likely to truncate on desktop search results.");
  if (ogTitle && title && !compareLoosely(title, ogTitle)) {
    rewriteReasons.push("Open Graph title does not closely match the title tag.");
  }
  if (h1 && title && !compareLoosely(title, h1)) {
    rewriteReasons.push("H1 does not closely match the title tag.");
  }
  if (!description) rewriteReasons.push("Missing meta description; search engines will choose page text.");
  if (descriptionTruncated) rewriteReasons.push("Meta description is likely to truncate.");

  const rewriteRisk = rewriteReasons.some((reason) => /missing title|truncate|Open Graph|H1/.test(reason))
    ? "high"
    : rewriteReasons.length > 0
      ? "medium"
      : "low";

  return {
    url: document.finalUrl,
    success: true,
    status: document.status,
    title,
    metaDesc: description,
    ogTitle,
    h1,
    canonical,
    snippet: {
      title,
      displayTitle: truncateByPixels(title || final.hostname, titleLimitPx, 20),
      description,
      displayDescription: truncateByPixels(description || "No meta description was found.", descriptionLimitPx, 14),
      displayUrl: `${final.hostname}${final.pathname === "/" ? "" : final.pathname}`,
      canonical,
    },
    analysis: {
      titleLength: title.length,
      titlePx,
      titleTruncated,
      truncatedTitle: titleTruncated ? truncateByPixels(title, titleLimitPx, 20) : null,
      descLength: description.length,
      descPx: descriptionPx,
      descTruncated: descriptionTruncated,
      rewriteRisk,
      rewriteReasons,
    },
    measurements: {
      titleLength: title.length,
      titlePx,
      titleLimitPx,
      titleTruncated,
      descriptionLength: description.length,
      descriptionPx,
      descriptionLimitPx,
      descriptionTruncated,
    },
    comparisons: {
      h1,
      ogTitle,
      canonicalMatchesFinalUrl: canonical ? canonical === document.finalUrl : null,
      xRobotsTag: getHeader(document.headers, "x-robots-tag") || "",
    },
    rewriteRisk,
    rewriteReasons,
    warnings: rewriteReasons,
  };
}
