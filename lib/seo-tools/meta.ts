import * as cheerio from "cheerio";
import { parseSafeUrl, SeoToolError } from "@/lib/seo-tools/http";

export async function checkMetaTags(rawUrl: string, requestHost: string) {
  const url = await parseSafeUrl(rawUrl, requestHost);
  let validUrl = url.toString();
  if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://")) {
    validUrl = "https://" + validUrl;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(validUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: controller.signal,
    });
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    throw new SeoToolError(error instanceof Error ? error.message : "Failed to analyze URL");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    return {
      success: false,
      error: `Failed to fetch URL. Status: ${response.status}`,
    };
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const tags: { tagName: string; value: string; status: string; message: string }[] = [];

  const title = $("title").text().trim();
  if (title) {
    tags.push({
      tagName: "Title",
      value: title,
      status: title.length >= 30 && title.length <= 60 ? "ok" : "warn",
      message:
        title.length < 30
          ? "Title is too short (< 30 chars)."
          : title.length > 60
            ? "Title is too long (> 60 chars)."
            : "Optimal length.",
    });
  } else {
    tags.push({ tagName: "Title", value: "", status: "error", message: "Missing title tag." });
  }

  const description = $('meta[name="description"]').attr("content")?.trim();
  if (description) {
    tags.push({
      tagName: "Meta Description",
      value: description,
      status: description.length >= 120 && description.length <= 160 ? "ok" : "warn",
      message:
        description.length < 120
          ? "Description is too short (< 120 chars)."
          : description.length > 160
            ? "Description is too long (> 160 chars)."
            : "Optimal length.",
    });
  } else {
    tags.push({
      tagName: "Meta Description",
      value: "",
      status: "error",
      message: "Missing meta description.",
    });
  }

  const canonical = $('link[rel="canonical"]').attr("href")?.trim();
  if (canonical) {
    tags.push({
      tagName: "Canonical",
      value: canonical,
      status: "ok",
      message: "Canonical tag is set.",
    });
  } else {
    tags.push({
      tagName: "Canonical",
      value: "",
      status: "warn",
      message: "Missing canonical URL. This can lead to duplicate content issues.",
    });
  }

  const ogImage = $('meta[property="og:image"]').attr("content")?.trim();
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const ogDesc = $('meta[property="og:description"]').attr("content")?.trim();

  tags.push({
    tagName: "OpenGraph Metadata",
    value: ogTitle ? `Title: ${ogTitle}\nDesc: ${ogDesc}\nImage: ${ogImage}` : "",
    status: ogTitle && ogImage ? "ok" : "warn",
    message:
      ogTitle && ogImage
        ? "OG tags present."
        : "Missing essential OpenGraph tags (title/image) for social sharing.",
  });

  const twitterCard = $('meta[name="twitter:card"]').attr("content")?.trim();
  const twitterTitle = $('meta[name="twitter:title"]').attr("content")?.trim();

  tags.push({
    tagName: "Twitter Cards",
    value: twitterCard ? `Card: ${twitterCard}\nTitle: ${twitterTitle}` : "",
    status: twitterCard ? "ok" : "warn",
    message: twitterCard ? "Twitter card tags present." : "Missing Twitter card tags.",
  });

  const robots = $('meta[name="robots"]').attr("content")?.trim();
  if (robots) {
    tags.push({
      tagName: "Robots Directive",
      value: robots,
      status: robots.toLowerCase().includes("noindex") ? "warn" : "ok",
      message: robots.toLowerCase().includes("noindex")
        ? "Warning: Page is set to noindex."
        : "Search engines can index this page.",
    });
  }

  return { url: validUrl, success: true, tags };
}
