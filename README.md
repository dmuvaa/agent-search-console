# Agent Search Console

**SEO for the Agentic Web** - technical SEO reports and checkers that humans and agents can run on the same public URL.

Agent Search Console fetches crawler-visible signals from a live `http` or `https` page, then turns them into structured technical SEO diagnostics. Humans get focused checker pages and a PDF-ready audit. Agents get the same report through WebMCP on `document.modelContext`.

Live app: [https://agent-search-console.vercel.app/](https://agent-search-console.vercel.app/)

Repository: [https://github.com/dmuvaa/agent-search-console](https://github.com/dmuvaa/agent-search-console)

Scores and grades are Agent Search Console assessments. They are not Google rankings, Search Console data, CrUX data, or an industry standard.

## What It Does

1. Runs ten technical SEO checks for a public URL: indexability, schema, robots.txt, sitemap, redirects, HTTP headers, headings, meta tags, broken links, and SERP snippet preview.
2. Generates one report with section scores, metrics, findings, raw checker output, and a prioritized `agentActionPlan`.
3. Registers a capped set of ten WebMCP tools so ChatGPT's in-app browser, or Chrome with WebMCP testing enabled, can call the same diagnostics directly.

Nothing is stored as a permanent copy of crawled pages. HTML, headers, robots.txt, and sitemap XML are processed in memory for the request.

## Try It

### Human Flow

1. Open [https://agent-search-console.vercel.app/seo/report](https://agent-search-console.vercel.app/seo/report).
2. Enter `https://example.com/` or another public URL.
3. Review the score, executive summary, agent action plan, detailed sections, and raw JSON.
4. Open [/seo](https://agent-search-console.vercel.app/seo) for focused checker pages.

### Agent Flow

1. Open [https://agent-search-console.vercel.app/seo/report](https://agent-search-console.vercel.app/seo/report) in ChatGPT's in-app browser.
2. Ask:

```text
Generate an SEO report for https://example.com/
```

3. Confirm the browser calls `generate_seo_report`.
4. Follow up with a narrower request, such as:

```text
Is that URL indexable?
```

That should call `check_indexability`.

For Chrome testing outside ChatGPT, enable `chrome://flags/#enable-webmcp-testing` and relaunch Chrome. Chrome's WebMCP docs describe this local testing flow, and the current WebMCP draft defines `document.modelContext.registerTool`.

## Pages

| Path | Purpose |
| --- | --- |
| `/` | Homepage with the SEO report pitch and links to the tools |
| `/seo` | Index of the report and all checker pages |
| `/seo/report` | Full technical SEO report with PDF-oriented UI |
| `/seo/indexability` | Indexability checker |
| `/seo/schema` | Schema / JSON-LD checker |
| `/seo/robots-txt` | robots.txt tester |
| `/seo/sitemap` | Sitemap analyzer |
| `/seo/redirects` | Redirect checker |
| `/seo/http-headers` | HTTP headers checker |
| `/seo/headings` | Heading structure checker |
| `/seo/meta-tags` | Title and meta analyzer |
| `/seo/broken-links` | Broken link checker |
| `/seo/serp-preview` | SERP snippet preview |

Checker pages accept `?url=` so a single check can be shared directly:

```text
https://agent-search-console.vercel.app/seo/robots-txt?url=https://example.com/
```

## Report Generator

**Page:** [/seo/report](https://agent-search-console.vercel.app/seo/report)  
**WebMCP tool:** `generate_seo_report`  
**API route:** `POST /api/seo-report`  
**Route limit:** `maxDuration = 60`

`generate_seo_report` runs all ten checkers in parallel with `Promise.allSettled`. If one checker fails, the report still completes and turns that checker into a failed section.

### Report Shape

| Field | Meaning |
| --- | --- |
| `success` | `true` when the report object was assembled |
| `tool` | Present on the API response as `generate_seo_report` |
| `url` | Normalized URL that was audited |
| `generatedAt` | ISO timestamp |
| `overallScore` | Average of section scores from 0 to 100 |
| `grade` | `A` for 90+, `B` for 80-89, `C` for 70-79, `D` for 60-69, otherwise `F` |
| `summary` | Counts for tools, passed sections, warnings, failures, and findings |
| `executiveSummary` | One-sentence technical SEO judgment |
| `agentCapabilities` | Short list describing what an agent can do with the payload |
| `agentActionPlan` | Prioritized fixes with `priority`, `tool`, `title`, `action`, `why`, `evidence`, and `ownerHint` |
| `sections` | Per-check summaries with `status`, `score`, `metrics`, and `findings` |
| `results` | Raw checker outputs keyed by tool name |

## Checkers

Each checker has a human page and an API tool. Nine direct checkers are also exposed through WebMCP. SERP preview is omitted from the direct WebMCP list to keep the browser tool surface at ten total, but it still runs inside `generate_seo_report`.

All checker inputs use this shape:

```json
{ "url": "https://example.com" }
```

| Page | Tool name | What it inspects |
| --- | --- | --- |
| [/seo/indexability](https://agent-search-console.vercel.app/seo/indexability) | `check_indexability` | HTTP status, robots.txt path rules, noindex signals, redirects, and canonical URL |
| [/seo/schema](https://agent-search-console.vercel.app/seo/schema) | `check_schema` | JSON-LD, microdata, entity graph, rich-result eligibility, and duplicate entities |
| [/seo/robots-txt](https://agent-search-console.vercel.app/seo/robots-txt) | `check_robots_txt` | HTTPS root `/robots.txt`, User-agent groups, Allow, Disallow, and Sitemap lines |
| [/seo/sitemap](https://agent-search-console.vercel.app/seo/sitemap) | `check_sitemap` | Sitemap URLs from the input, robots.txt, or `/sitemap.xml`; parses `urlset` or `sitemapindex` |
| [/seo/redirects](https://agent-search-console.vercel.app/seo/redirects) | `check_redirects` | Redirect hops, loops, status codes, final URL, and timing |
| [/seo/http-headers](https://agent-search-console.vercel.app/seo/http-headers) | `check_http_headers` | Status, content type, `X-Robots-Tag`, cache-related headers, security headers, and full header list |
| [/seo/headings](https://agent-search-console.vercel.app/seo/headings) | `check_headings` | H1-H6 headings in source order, counts, skipped levels, missing H1, and multiple H1s |
| [/seo/meta-tags](https://agent-search-console.vercel.app/seo/meta-tags) | `check_meta_tags` | Title, description, canonical, Open Graph, Twitter card, and meta robots |
| [/seo/broken-links](https://agent-search-console.vercel.app/seo/broken-links) | `check_broken_links` | Crawlable `a[href]` values, internal/external classification, and status checks for up to 40 unique links |
| [/seo/serp-preview](https://agent-search-console.vercel.app/seo/serp-preview) | `preview_serp_snippet` | Title and description length, display URL, canonical URL, and rewrite risk vs H1/Open Graph |

Sitemap status checks inspect up to 50 listed page URLs. For sitemap indexes, child sitemap URLs are listed but not recursively crawled.

## WebMCP Tools

The browser-exposed WebMCP surface is capped at ten tools:

- `generate_seo_report`
- `check_indexability`
- `check_schema`
- `check_robots_txt`
- `check_sitemap`
- `check_redirects`
- `check_http_headers`
- `check_headings`
- `check_meta_tags`
- `check_broken_links`

All registered tools use `annotations.readOnlyHint: true`.

Implementation files:

- `app/layout.tsx` emits the inline WebMCP manifest script and mounts the WebMCP runtime.
- `components/webmcp/runtime.tsx` initializes `@mcp-b/webmcp-polyfill`.
- `components/webmcp/console-tools.tsx` registers tools with `document.modelContext.registerTool`.
- `lib/webmcp/catalog.ts` caps the WebMCP catalog at ten tools.
- `lib/webmcp/agent-access.ts` sets `exposedTo` origins and the `tools` Permissions-Policy value.
- `app/webmcp.json/route.ts` and `app/.well-known/webmcp.json/route.ts` expose the same catalog for static discovery probes.

Responses set:

```http
Permissions-Policy: tools=(self "https://chatgpt.com" "https://chat.openai.com")
Origin-Agent-Cluster: ?1
```

## API

Local base URL: `http://localhost:3000`  
Production base URL: `https://agent-search-console.vercel.app`

### `POST /api/seo-report`

```json
{ "url": "https://example.com" }
```

Returns the full report object described above.

Example:

```bash
curl -sS -X POST https://agent-search-console.vercel.app/api/seo-report \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com/"}'
```

### `POST /api/seo-tools`

```json
{ "tool": "check_indexability", "url": "https://example.com" }
```

`tool` must be one of:

```text
check_indexability
check_schema
check_robots_txt
check_sitemap
check_redirects
check_http_headers
check_headings
check_meta_tags
check_broken_links
preview_serp_snippet
```

Checker-level crawl failures may return a `200` response with `"success": false` and an `"error"` field, so the UI can render the failed diagnostic inside the focused checker page. Invalid JSON, unknown tools, unsafe URLs, rate limits, upstream timeouts, and unexpected server failures use HTTP errors such as `400`, `422`, `429`, `500`, or `504`.

## Quick Start

Requires Node.js 20+.

```bash
git clone https://github.com/dmuvaa/agent-search-console.git
cd agent-search-console
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | Command |
| --- | --- |
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Production server | `npm run start` |
| Lint | `npm run lint` |

## Environment Variables

Copy `.env.example` to `.env.local`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `SEO_RATE_LIMIT` | No | Production API requests per IP per hour. Default `60`. Ignored in development. |

For backward compatibility, `ANALYZE_RATE_LIMIT` is still honored if `SEO_RATE_LIMIT` is unset.

## Security And Limits

The server only accepts `http:` and `https:` URLs. Before fetch, shared URL validation:

- Blocks `localhost`, loopback, `.internal`, and `.local` hosts, except for the app's own local origin during development.
- Blocks private IPv4 and IPv6 ranges.
- Blocks common metadata hosts such as `169.254.169.254` and `metadata.google.internal`.
- Resolves DNS and rejects hostnames that resolve to private addresses.

Fetch and product limits:

- Shared document fetch timeout defaults to 8 seconds.
- Individual checkers use timeouts between 4 and 15 seconds depending on the request type.
- Shared document response size is capped at about 1.5 MB.
- Broken-link checks inspect up to 40 unique links.
- Sitemap status checks inspect up to 50 listed page URLs.
- The report route has a 60 second max duration; individual checker API route has 30 seconds.
- Production rate limiting is in-memory per server instance.

This is not Google Search Console, a Lighthouse audit, a rendered-DOM JavaScript SEO crawler, a log-file analyzer, or a full sitewide crawl. JavaScript-only metadata that never appears in the initial HTML may be missed.

## Architecture

```text
app/
  favicon.ico              Branded multi-size favicon
  icon.svg                 Branded browser/app icon
  apple-icon.tsx           Generated Apple touch icon
  page.tsx                 Homepage
  seo/page.tsx             Tool index
  seo/report/page.tsx      Report UI
  seo/[slug]/page.tsx      One page per checker
  webmcp.json/route.ts     Static WebMCP discovery manifest
  .well-known/webmcp.json/ Static WebMCP discovery manifest alias
  api/seo-tools/route.ts   Individual checker API
  api/seo-report/route.ts  Full report API
  layout.tsx               WebMCP manifest + runtime hooks
proxy.ts                   Permissions-Policy / Origin-Agent-Cluster
components/
  brand-mark.tsx           Inline header mark
  seo-report-runner.tsx    Human report form and report rendering
  seo-tools-runner.tsx     Human checker forms and result rendering
  webmcp/                  Polyfill and registerTool wiring
lib/
  schema/                  JSON-LD extraction and schema analysis
  security/                URL safety and rate limiting
  seo-tools/               Checker implementations and report assembly
  webmcp/                  Tool catalog and agent access policy
public/
  agent-search-console-mark.svg
  agent-search-console-wordmark.svg
```

Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Cheerio, xml2js, and `@mcp-b/webmcp-polyfill`.

## Submission Checklist

| Requirement | Status |
| --- | --- |
| Working live URL | [https://agent-search-console.vercel.app/](https://agent-search-console.vercel.app/) |
| ChatGPT / Chrome WebMCP test page | [https://agent-search-console.vercel.app/seo/report](https://agent-search-console.vercel.app/seo/report) |
| Public source repository | [https://github.com/dmuvaa/agent-search-console](https://github.com/dmuvaa/agent-search-console) |
| Open-source license | MIT, see [LICENSE](LICENSE) |
| WebMCP implementation in source | `components/webmcp/console-tools.tsx` registers tools with `document.modelContext.registerTool` |
| Static WebMCP discovery | `/webmcp.json` and `/.well-known/webmcp.json` |
| Text description | See [DEVPOST_SUBMISSION.md](DEVPOST_SUBMISSION.md) |

## License

MIT. See [LICENSE](LICENSE).
