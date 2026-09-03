import * as cheerio from "cheerio";
import { analyzeSchemas } from "@/lib/schema/analyzer";
import { extractAllSchemas } from "@/lib/schema/extractor";
import { parseSafeUrl, SeoToolError } from "@/lib/seo-tools/http";

const UA = "Mozilla/5.0 (compatible; Agent Search Console; +https://agent-search-console.vercel.app)";

function extractSchemaTypes(html: string): {
  types: string[];
  errors: string[];
  warnings: string[];
  jsonLd: string[];
} {
  const $ = cheerio.load(html);
  const types: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const jsonLd: string[] = [];

  $("script[type='application/ld+json']").each((_, el) => {
    const raw = $(el).html() || "";
    jsonLd.push(raw);
    try {
      const parsed = JSON.parse(raw);
      if (!parsed["@context"]) {
        warnings.push("Missing @context in JSON-LD block.");
      }

      const items = Array.isArray(parsed) ? parsed : [parsed];
      items.forEach((item: { "@type"?: string | string[]; [key: string]: unknown }) => {
        if (item["@type"]) {
          const t = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
          types.push(...t);

          if (item["@type"] === "WebPage" && !item.name) {
            warnings.push("WebPage is missing the 'name' property.");
          }
          if (item["@type"] === "WebPage" && !item.description) {
            warnings.push("WebPage is missing the 'description' property.");
          }
          if (item["@type"] === "Offer" && item.position) {
            warnings.push("The property 'position' is not recognized by schema.org for an object of type Offer.");
          }
        } else {
          warnings.push("Object is missing '@type' identifier.");
        }
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Invalid JSON";
      errors.push(`Parse error: ${message.slice(0, 80)}`);
    }
  });

  $("[itemtype]").each((_, el) => {
    const itemtype = $(el).attr("itemtype") || "";
    const type = itemtype.split("/").pop();
    if (type) types.push(`${type} (microdata)`);
  });

  return { types: [...new Set(types)], errors, warnings, jsonLd };
}

export async function checkSchema(rawUrl: string, requestHost: string) {
  const url = await parseSafeUrl(rawUrl, requestHost);
  const validUrl = url.toString();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  let response: Response;
  try {
    response = await fetch(validUrl, {
      headers: { "User-Agent": UA },
      signal: controller.signal,
      redirect: "follow",
    });
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new SeoToolError("Connection timed out.", 504);
    }
    throw new SeoToolError(
      error instanceof Error ? error.message : "Failed to fetch URL",
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
  const coverage = extractSchemaTypes(html);
  const extracted = extractAllSchemas(html);
  const analysis = analyzeSchemas(extracted.jsonLd, validUrl);

  return {
    success: true,
    url: validUrl,
    pagesCrawled: 1,
    pagesWithSchema: coverage.types.length > 0 ? 1 : 0,
    pagesWithoutSchema: coverage.types.length > 0 ? 0 : 1,
    pagesWithErrors: coverage.errors.length > 0 ? 1 : 0,
    schemaTypeDistribution: Object.fromEntries(coverage.types.map((type) => [type, 1])),
    pages: [
      {
        url: validUrl,
        schemaTypes: coverage.types,
        jsonLd: coverage.jsonLd,
        errors: coverage.errors,
        warnings: coverage.warnings.length > 0 ? coverage.warnings : undefined,
        hasSchema: coverage.types.length > 0,
      },
    ],
    fetchedAt: analysis.fetchedAt,
    entities: analysis.entities,
    eligibleRichResults: analysis.eligibleRichResults,
    opportunityScore: analysis.opportunityScore,
    scoreBreakdown: analysis.scoreBreakdown,
    issues: analysis.issues,
    recommendations: analysis.recommendations,
    extracted,
  };
}
