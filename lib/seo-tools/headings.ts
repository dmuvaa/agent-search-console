import * as cheerio from "cheerio";
import { parseSafeUrl, SeoToolError } from "@/lib/seo-tools/http";

export async function checkHeadings(rawUrl: string, requestHost: string) {
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
      },
      signal: controller.signal,
    });
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    throw new SeoToolError(
      error instanceof Error ? error.message : "Failed to analyze heading structure",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    return {
      success: false,
      error: `Failed to fetch URL. HTTP Status: ${response.status}`,
    };
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const headings: { level: number; text: string }[] = [];
  const counts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const tagName = "tagName" in el ? String(el.tagName) : $(el).prop("tagName") || "";
    const level = parseInt(tagName.replace("h", ""), 10);
    const text = $(el).text().trim().replace(/\s+/g, " ");

    if (text) {
      headings.push({ level, text });
      counts[level]++;
    }
  });

  const warnings: string[] = [];

  if (counts[1] === 0) {
    warnings.push("Missing H1 tag. Your page should have a main heading.");
  } else if (counts[1] > 1) {
    warnings.push(
      `Found ${counts[1]} H1 tags. It is generally best practice to have only one H1 per page.`,
    );
  }

  let currentMaxLevel = 1;
  headings.forEach((h, index) => {
    if (index === 0 && h.level !== 1) {
      warnings.push(`First heading is an H${h.level}, but should ideally be an H1.`);
      currentMaxLevel = h.level;
    } else if (index > 0) {
      if (h.level > currentMaxLevel + 1) {
        warnings.push(
          `Skipped heading level detected: Jumped from H${currentMaxLevel} to H${h.level}. ("${h.text}")`,
        );
      }
      if (h.level > currentMaxLevel) {
        currentMaxLevel = h.level;
      } else {
        currentMaxLevel = h.level;
      }
    }
  });

  const uniqueWarnings = Array.from(new Set(warnings));

  return {
    url: validUrl,
    success: true,
    headings,
    counts,
    warnings: uniqueWarnings,
  };
}
