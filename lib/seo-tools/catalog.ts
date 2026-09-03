export const SEO_TOOL_NAMES = [
  "check_indexability",
  "check_schema",
  "check_robots_txt",
  "check_sitemap",
  "check_redirects",
  "check_http_headers",
  "check_headings",
  "check_meta_tags",
  "check_broken_links",
  "preview_serp_snippet",
] as const;

export type SeoToolName = (typeof SEO_TOOL_NAMES)[number];

export type SeoToolPage = {
  name: SeoToolName;
  slug: string;
  title: string;
  headline: string;
  summary: string;
  description: string;
  intro: string;
  why: string;
  checks: string[];
  button: string;
  placeholder: string;
};

export const SEO_TOOL_PAGES: SeoToolPage[] = [
  {
    name: "check_indexability",
    slug: "indexability",
    title: "Indexability checker",
    headline: "Can search engines index this URL?",
    summary: "Status, robots.txt, noindex, canonical, and redirects",
    description:
      "Determine whether a URL looks indexable: HTTP status, robots.txt, noindex, redirects, and canonical. Use when the user asks if a page can be indexed.",
    intro:
      "Indexability is the first technical SEO question. If a URL returns an error, redirects away, is blocked in robots.txt, carries noindex, or points its canonical elsewhere, crawlers will not treat it as the page you meant to rank.",
    why: "Most “why isn’t this ranking?” cases start here. Content quality does not matter if Google is not allowed to index the URL. Run this before you chase titles, links, or schema.",
    checks: [
      "HTTP status on the requested URL",
      "robots.txt Disallow rules for the path",
      "meta robots and X-Robots-Tag noindex",
      "Whether the URL redirects to another address",
      "Canonical tag vs the URL you asked about",
    ],
    button: "Check indexability",
    placeholder: "https://example.com/page",
  },
  {
    name: "check_schema",
    slug: "schema",
    title: "Schema / JSON-LD checker",
    headline: "See what structured data crawlers actually get",
    summary: "JSON-LD, microdata, and rich-result eligibility",
    description:
      "Extract schema.org JSON-LD and microdata from a public URL. Use when the user asks about structured data, rich results, Product/Article/FAQ markup, or missing @type properties.",
    intro:
      "Schema tells Google what a page is: a local business, an article, a product, an FAQ. Invalid JSON-LD, missing required properties, or duplicate entities mean rich results never show — even if the markup looks fine in the source.",
    why: "Titles get you a blue link. Working schema can get stars, FAQs, and sitelinks. This checker parses the same JSON-LD blocks crawlers read and flags missing fields, conflicts, and rich-result gaps.",
    checks: [
      "JSON-LD script blocks and microdata types",
      "Entity graph, nested types, and duplicate entities",
      "Required vs recommended properties for common rich results",
      "Opportunity score and recommendations from the original analyzer",
    ],
    button: "Check schema",
    placeholder: "https://example.com",
  },
  {
    name: "check_robots_txt",
    slug: "robots-txt",
    title: "robots.txt tester",
    headline: "See what you allow crawlers to fetch",
    summary: "Crawl rules and sitemap directives",
    description:
      "Fetch and parse robots.txt for a site. Use when the user asks whether crawlers are allowed, which paths are disallowed, or where sitemaps are declared.",
    intro:
      "Googlebot reads robots.txt before it reads your content. A stray Disallow: / , a missing Sitemap line, or rules that only apply to * while Googlebot is open can waste crawl budget or hide the site entirely.",
    why: "This file is the gate. If it is missing, empty, or wrong, you are guessing how bots treat /api/, /admin/, and parameter URLs. Fetch it, parse Allow/Disallow by user-agent, and confirm sitemap locations.",
    checks: [
      "Whether /robots.txt returns HTTP 200",
      "User-agent groups, Allow, and Disallow paths",
      "Sitemap: directives",
      "The raw file, with real line breaks",
    ],
    button: "Test robots.txt",
    placeholder: "https://example.com",
  },
  {
    name: "check_sitemap",
    slug: "sitemap",
    title: "Sitemap analyzer",
    headline: "Audit the URL list you send to crawlers",
    summary: "XML sitemap or sitemap index",
    description:
      "Find and parse a sitemap.xml (or a sitemap listed in robots.txt). Use when the user asks which URLs are in the sitemap, whether it is an index, or if listed URLs look broken.",
    intro:
      "A sitemap is a hint, not a command — but a sitemap full of 404s, redirects, or noindex URLs is a bad hint. Paste a sitemap.xml URL (or a sitemap index) and see what is listed and which sampled URLs respond.",
    why: "If important URLs are missing, or junk URLs are included, you are spending crawl budget on the wrong inventory. This tool parses urlset and sitemapindex files the same way the original checker does.",
    checks: [
      "Valid XML urlset vs sitemap index",
      "loc, lastmod, changefreq, priority",
      "HTTP status for the first 50 listed URLs (not child sitemaps)",
      "Counts of valid vs broken sampled URLs",
    ],
    button: "Analyze sitemap",
    placeholder: "https://example.com/sitemap.xml",
  },
  {
    name: "check_redirects",
    slug: "redirects",
    title: "Redirect checker",
    headline: "Trace every hop from request to destination",
    summary: "Redirect chain, loops, and hop count",
    description:
      "Trace the HTTP redirect chain for a URL without following automatically. Use when the user asks about 301/302 hops, redirect loops, or the final destination.",
    intro:
      "One hop is fine. Chains of 302s, HTTP→HTTPS→www→trailing-slash stacks, and loops burn crawl budget and dilute link equity. This checker follows Location headers hop by hop, including servers that block HEAD.",
    why: "Migrations, domain changes, and CMS canonical plugins create chains you never see in the browser. Trace the status codes and timing before you assume a 301 did what you think.",
    checks: [
      "Each hop’s URL, status code, and time",
      "Final destination",
      "Redirect loops and hop limits",
      "HEAD with GET fallback when HEAD is blocked",
    ],
    button: "Trace redirects",
    placeholder: "http://example.com",
  },
  {
    name: "check_http_headers",
    slug: "http-headers",
    title: "HTTP headers checker",
    headline: "Inspect crawl and security headers on the wire",
    summary: "Status, X-Robots-Tag, cache, and security headers",
    description:
      "Inspect response headers for a public URL, including X-Robots-Tag, cache, and common security headers. Use for header-level SEO and crawl directives.",
    intro:
      "Headers can noindex a page (X-Robots-Tag), force HTTPS, or tell caches how long to keep HTML. They also show Server, Content-Type, and common security policies. This is the response Googlebot sees, not the rendered DOM.",
    why: "A meta robots tag in HTML and an X-Robots-Tag on the response can disagree. Caching HTML too aggressively can serve stale titles. Check the wire.",
    checks: [
      "Status, server, and Content-Type",
      "X-Robots-Tag and cache headers",
      "HSTS, CSP, X-Frame-Options, and related security headers",
      "The full header list",
    ],
    button: "Inspect headers",
    placeholder: "https://example.com",
  },
  {
    name: "check_headings",
    slug: "headings",
    title: "Heading structure",
    headline: "Map the H1–H6 outline crawlers extract",
    summary: "Heading hierarchy and skipped levels",
    description:
      "Extract heading outline (H1–H6) from a page. Use when the user asks about H1 count, heading hierarchy, or skipped heading levels.",
    intro:
      "Headings are the outline of the page. Missing H1s, multiple H1s, and jumps from H2 to H4 make the document harder for users and extractors to parse. This tool lists headings in document order.",
    why: "You do not rank because you have an H1. You rank more reliably when the outline matches the topic and is not a dump of styled divs. Fix structure before you rewrite copy.",
    checks: [
      "All H1–H6 in source order",
      "Counts per level",
      "Missing or multiple H1s",
      "Skipped heading levels",
    ],
    button: "Check headings",
    placeholder: "https://example.com",
  },
  {
    name: "check_meta_tags",
    slug: "meta-tags",
    title: "Title & meta analyzer",
    headline: "Audit the tags that become the SERP snippet",
    summary: "Title, description, canonical, Open Graph, robots",
    description:
      "Check title, meta description, canonical, robots, Open Graph, Twitter card, hreflang, and viewport tags. Use for on-page SEO metadata.",
    intro:
      "Title and meta description are still the storefront in search results. Canonical tells crawlers which URL is the original. Open Graph controls the unfurl on social. Missing or oversized tags are the cheapest wins in technical SEO.",
    why: "If two URLs share a title, or the canonical is wrong, you are splitting signals. If description is empty, Google will invent a snippet. Check the tags on the URL you care about.",
    checks: [
      "Title length (aim 30–60 characters)",
      "Meta description length (aim 120–160)",
      "Canonical URL",
      "Open Graph and Twitter card tags",
      "Meta robots, if present",
    ],
    button: "Analyze meta tags",
    placeholder: "https://example.com",
  },
  {
    name: "check_broken_links",
    slug: "broken-links",
    title: "Broken link checker",
    headline: "Find links that waste crawl paths and frustrate visitors",
    summary: "Internal and external link status checks",
    description:
      "Fetch a public page, extract crawlable links, and check whether sampled destinations return healthy HTTP statuses. Use for 404s, blocked links, redirecting links, and maintenance audits.",
    intro:
      "Broken links are quiet technical debt. They interrupt users, waste crawler time, and can strand important pages. This checker reads the links from one URL, resolves relative paths, and verifies a safe sample of destinations.",
    why: "Search engines discover pages through links. If important links point to errors, redirects, or blocked destinations, crawlers get a weaker map of the site and people get a worse path through it.",
    checks: [
      "Anchor hrefs resolved against the page URL",
      "Internal vs external link classification",
      "HTTP status for up to 40 unique links",
      "Broken, warning, redirected, and skipped destinations",
    ],
    button: "Check links",
    placeholder: "https://example.com/page",
  },
  {
    name: "preview_serp_snippet",
    slug: "serp-preview",
    title: "SERP snippet preview",
    headline: "See the search result your metadata is asking for",
    summary: "Title, description, URL, truncation, and rewrite risk",
    description:
      "Create a structured Google-style search snippet preview from a public URL. Use when the user asks how a page title or meta description may appear in search results.",
    intro:
      "The search result is often the first impression of a page. This preview pulls the title, meta description, canonical, Open Graph title, and H1, then estimates whether the snippet is likely to truncate or invite a title rewrite.",
    why: "A technically valid title can still be too long, too short, duplicated with boilerplate, or disconnected from the H1. Preview the snippet before rewriting copy or chasing deeper ranking issues.",
    checks: [
      "Title and meta description text",
      "Estimated pixel width and truncation",
      "Canonical URL and display URL",
      "Title rewrite risk from length, H1, and Open Graph mismatch",
    ],
    button: "Preview snippet",
    placeholder: "https://example.com/page",
  },
];

export const SEO_TOOL_META: Record<SeoToolName, { title: string; summary: string; description: string }> =
  Object.fromEntries(
    SEO_TOOL_PAGES.map((page) => [
      page.name,
      { title: page.title, summary: page.summary, description: page.description },
    ]),
  ) as Record<SeoToolName, { title: string; summary: string; description: string }>;

const urlSchema = {
  type: "object" as const,
  properties: {
    url: { type: "string" as const, description: "Public http(s) URL to inspect" },
  },
  required: ["url"],
};

export const SEO_TOOLS = SEO_TOOL_PAGES.map((page) => ({
  name: page.name,
  description: page.description,
  inputSchema: {
    type: "object" as const,
    properties: { ...urlSchema.properties },
    required: ["url"],
  },
}));

export const SEO_REPORT_TOOL = {
  name: "generate_seo_report",
  description:
    "Run the core technical SEO checks for a public URL and assemble one structured report with score, sections, findings, metrics, raw tool results, and a prioritized agentActionPlan. Use when the user asks for an SEO report, audit report, action plan, or exportable technical SEO summary.",
  inputSchema: {
    type: "object" as const,
    properties: { ...urlSchema.properties },
    required: ["url"],
  },
};

export function isSeoToolName(value: string): value is SeoToolName {
  return (SEO_TOOL_NAMES as readonly string[]).includes(value);
}

export function seoToolBySlug(slug: string): SeoToolPage | undefined {
  return SEO_TOOL_PAGES.find((page) => page.slug === slug);
}

export function seoToolHref(name: SeoToolName) {
  const page = SEO_TOOL_PAGES.find((item) => item.name === name);
  return page ? `/seo/${page.slug}` : "/seo";
}
