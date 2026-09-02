import * as cheerio from "cheerio";
import type { DeclaredWebMcpTool, ExtractedForm, PageExtract } from "@/types/audit";

function textOf($el: { text: () => string }) {
  return $el.text().replace(/\s+/g, " ").trim();
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function asTools(value: unknown): DeclaredWebMcpTool[] {
  if (!value) return [];
  const list = Array.isArray(value)
    ? value
    : typeof value === "object" && value && "tools" in value
      ? (value as { tools: unknown }).tools
      : [value];
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const rec = item as Record<string, unknown>;
      const name = String(rec.name ?? rec.toolName ?? "").trim();
      if (!name) return [];
      return [
        {
          name,
          description: String(rec.description ?? rec.toolDescription ?? ""),
          inputSchema:
            rec.inputSchema && typeof rec.inputSchema === "object"
              ? (rec.inputSchema as Record<string, unknown>)
              : undefined,
          annotations:
            rec.annotations && typeof rec.annotations === "object"
              ? (rec.annotations as Record<string, unknown>)
              : undefined,
        } satisfies DeclaredWebMcpTool,
      ];
    });
}

function collectSignals(html: string, $: cheerio.CheerioAPI) {
  const signals: string[] = [];
  const scriptHints: string[] = [];
  const sample = html.slice(0, 120_000);

  if (/document\.modelContext/i.test(sample)) signals.push("document.modelContext");
  if (/navigator\.modelContext/i.test(sample)) signals.push("navigator.modelContext");
  if (/registerTool\s*\(/i.test(sample)) signals.push("registerTool");
  if (/@mcp-b\/webmcp-polyfill/i.test(sample)) signals.push("@mcp-b/webmcp-polyfill");
  if (/initializeWebMCPPolyfill/i.test(sample)) signals.push("initializeWebMCPPolyfill");
  if (/application\/webmcp\+json/i.test(sample)) signals.push("application/webmcp+json");
  if (/toolname=/i.test(sample)) signals.push("declarative toolname");

  $("script").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    const body = $(el).text();
    if (/webmcp|modelcontext|mcp-b/i.test(src)) scriptHints.push(src);
    if (/registerTool|modelContext/.test(body)) {
      scriptHints.push("inline registerTool");
    }
  });

  return { signals: [...new Set(signals)], scriptHints: [...new Set(scriptHints)] };
}

export function extractPage(html: string, url: string, status: number): PageExtract {
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim() || $("h1").first().text().trim();
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    "";

  const headings = $("h1,h2,h3,h4,h5,h6")
    .toArray()
    .slice(0, 40)
    .map((el) => ({
      level: Number(el.tagName.replace("h", "")) || 1,
      text: textOf($(el)).slice(0, 180),
    }))
    .filter((h) => h.text);

  const links = $("a[href]")
    .toArray()
    .slice(0, 80)
    .map((el) => ({
      href: $(el).attr("href") || "",
      text: textOf($(el)).slice(0, 120),
    }))
    .filter((l) => l.href);

  const buttons = $("button, [role='button'], input[type='submit']")
    .toArray()
    .slice(0, 40)
    .map((el) => ({
      text: textOf($(el)).slice(0, 80) || String($(el).attr("value") ?? ""),
      type: $(el).attr("type") || el.tagName,
      ariaLabel: $(el).attr("aria-label") || "",
    }));

  const forms: ExtractedForm[] = $("form")
    .toArray()
    .slice(0, 12)
    .map((el) => {
      const $form = $(el);
      const inputs = $form
        .find("input, select, textarea")
        .toArray()
        .filter((input) => ($(input).attr("type") || "").toLowerCase() !== "hidden")
        .slice(0, 20)
        .map((input) => {
          const $input = $(input);
          const id = $input.attr("id");
          const label = id ? textOf($(`label[for='${id}']`)) : textOf($input.closest("label"));
          return {
            name: $input.attr("name") || $input.attr("id") || "",
            type: $input.attr("type") || input.tagName,
            label,
            required: $input.is("[required]"),
            placeholder: $input.attr("placeholder") || "",
          };
        });
      return {
        action: $form.attr("action") || "",
        method: ($form.attr("method") || "get").toLowerCase(),
        toolName: $form.attr("toolname") || $form.attr("data-tool-name") || "",
        toolDescription: $form.attr("tooldescription") || "",
        inputs,
      };
    });

  const navItems = $("nav a")
    .toArray()
    .slice(0, 30)
    .map((el) => textOf($(el)))
    .filter(Boolean);

  const landmarks = ["header", "nav", "main", "footer", "aside", "search"]
    .filter((tag) => $(tag).length > 0 || $(`[role='${tag}']`).length > 0);

  const jsonLdTypes: string[] = [];
  const declaredTools: DeclaredWebMcpTool[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    const data = parseJson($(el).text());
    if (data && typeof data === "object") {
      const type = (data as { "@type"?: string })["@type"];
      if (type) jsonLdTypes.push(type);
    }
  });

  $('script[type="application/webmcp+json"], script#webmcp-manifest').each((_, el) => {
    declaredTools.push(...asTools(parseJson($(el).text())));
  });

  $("[toolname]").each((_, el) => {
    const name = $(el).attr("toolname");
    if (!name) return;
    if (!declaredTools.some((t) => t.name === name)) {
      declaredTools.push({
        name,
        description: $(el).attr("tooldescription") || "",
      });
    }
  });

  const ariaLabels = $("[aria-label]")
    .toArray()
    .slice(0, 40)
    .map((el) => $(el).attr("aria-label") || "")
    .filter(Boolean);

  const { signals, scriptHints } = collectSignals(html, $);
  const textSample = $("body").text().replace(/\s+/g, " ").trim().slice(0, 2500);

  return {
    url,
    status,
    title,
    metaDescription,
    headings,
    links,
    buttons,
    forms,
    navItems,
    landmarks,
    jsonLdTypes,
    ariaLabels,
    tables: $("table").length,
    declaredTools,
    webmcpSignals: signals,
    scriptHints,
    textSample,
  };
}

export function candidateCrawlUrls(page: PageExtract, origin: string) {
  const originUrl = new URL(origin);
  const seen = new Set<string>([page.url]);
  const out: string[] = [];
  for (const link of page.links) {
    let resolved: URL;
    try {
      resolved = new URL(link.href, page.url);
    } catch {
      continue;
    }
    if (resolved.origin !== originUrl.origin) continue;
    if (!["http:", "https:"].includes(resolved.protocol)) continue;
    resolved.hash = "";
    if (/\.(png|jpe?g|gif|webp|svg|pdf|zip|css|js|woff2?|mp4)$/i.test(resolved.pathname)) continue;
    if (/logout|signin|login|admin|cdn-cgi/i.test(resolved.pathname)) continue;
    const href = resolved.toString();
    if (seen.has(href)) continue;
    seen.add(href);
    out.push(href);
    if (out.length >= 8) break;
  }
  return out;
}
