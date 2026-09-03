# Agent Search Console

## Tagline

SEO for the Agentic Web.

## Project summary

Agent Search Console is a WebMCP-powered technical SEO report generator. A human can paste a URL and get a PDF-ready audit. An agent can call `generate_seo_report` and receive the same structured report with scores, evidence, raw checker output, and a prioritized action plan.

The core product is ten technical SEO checks:

- Indexability
- Schema
- robots.txt
- Sitemap
- Redirects
- HTTP headers
- Headings
- Meta tags
- Broken links
- SERP snippet preview

## Why this is a strong fit for WebMCP

Technical SEO is already about making websites understandable to machine users: search engines, crawlers, rich-result parsers, and now AI agents. WebMCP lets the site expose those diagnostics as structured tools instead of forcing an agent to visually inspect a UI or scrape arbitrary HTML.

The best demo is simple: ask ChatGPT to generate an SEO report for `https://webprismio.com/`. The browser can call `generate_seo_report`, run the technical suite, and return a prioritized work plan an agent can use for follow-up tasks.

## Better user experience

For humans, the app provides familiar SEO-tool pages and a report view that can be saved as PDF. For agents, every checker has a declared input schema and structured output. The full report tool combines those checks into an executive summary, score, detailed sections, and an `agentActionPlan` with priority, evidence, and owner hints.

That means a marketer can review the report while an agent uses the same data to file tasks, draft metadata, inspect schema, or prepare implementation notes.

## What people and agents can do together

A person can say: "Audit my homepage and tell me what to fix first." The agent can run the report through WebMCP, cite the exact evidence from the checkers, and produce a work order. The person can approve or adjust the plan, then the agent can continue with focused tasks instead of guessing from screenshots or page text.

This is difficult in a normal web app because the agent has to infer where to click, how to interpret visual output, and how to extract machine-readable evidence. Here, the app exposes the diagnostics directly.

## How WebMCP is implemented

The app registers tools on `document.modelContext` in the browser. The WebMCP surface is capped at ten tools total: `generate_seo_report` plus nine direct technical SEO checkers. The full report still runs all ten checks, including SERP snippet preview.

Relevant files:

- `components/webmcp/console-tools.tsx`
- `lib/webmcp/catalog.ts`
- `lib/seo-tools/catalog.ts`
- `lib/seo-tools/report.ts`
- `app/api/seo-tools/route.ts`
- `app/api/seo-report/route.ts`

## Judge test script

1. Open `https://agent-search-console.vercel.app/seo/report` in ChatGPT's in-app browser.
2. Ask: `Generate an SEO report for https://webprismio.com/`.
3. Confirm the browser calls `generate_seo_report`.
4. Review the returned score, sections, raw results, and `agentActionPlan`.
5. Open the same page as a human and generate the report from the form to compare the UI and agent output.

## Demo video outline

Target length: under 3 minutes.

1. 0:00-0:20 - Introduce the problem: SEO tools are built for humans, but agents need structured diagnostics.
2. 0:20-0:50 - Show the report page and run `https://webprismio.com/`.
3. 0:50-1:30 - Show the generated report: score, executive summary, action plan, detailed checks, raw JSON.
4. 1:30-2:15 - In ChatGPT's in-app browser, ask for the same report and show WebMCP calling `generate_seo_report`.
5. 2:15-2:50 - Explain why this matters: humans review, agents act from structured evidence.
6. 2:50-3:00 - Close with "SEO for the Agentic Web."

## Submission URLs

- Live app: `https://agent-search-console.vercel.app/`
- Report page: `https://agent-search-console.vercel.app/seo/report`
- Code repository: `https://github.com/dmuvaa/agent-search-console`
