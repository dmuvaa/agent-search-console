# Agent Search Console

**SEO for the Agentic Web.**

Agent Search Console audits websites for AI-agent readiness: can an agent discover, understand, and operate the site? It scores structure and workflows, inspects WebMCP tools, recommends missing operations, and ships with a demo store you can use for a before/after demo.

This is a hackathon MVP. The Agent Readiness Score is an **Agent Search Console assessment**, not an industry standard.

## What it does

- Fetch a public URL (plus a few same-origin links)
- Extract headings, navigation, forms, buttons, and structured signals
- Detect declared WebMCP tools (`application/webmcp+json`, `toolname` attributes, script hints)
- Score five categories out of 20 each (100 total)
- List issues and starter `document.modelContext.registerTool` implementations
- Simulate whether template agent tasks have the expected WebMCP tool names declared
- Expose WebMCP tools on the console itself and on the NovaShop demo

Task simulation checks declared tool names. It does not run an agent, invoke remote tools, or click the live UI. The server-side analyzer also cannot see tools registered only after JavaScript runs.

Website HTML is processed in memory for analysis. The MVP does not keep a permanent copy of crawled pages.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional: set `AI_API_KEY` or `OPENAI_API_KEY` for LLM interpretation. Without a key, recommendations still run from deterministic heuristics.

## Demo store (NovaShop)

NovaShop is **not a real retailer**. It is a fictional catalog built into this app at `/demo` so you can prove the product on a site you control: same store, WebMCP off / partial / full.

[http://localhost:3000/demo](http://localhost:3000/demo)

The store header has three WebMCP modes. Typical scores:

1. **Off** (`/demo`) — no tools. Score around **51**.
2. **Partial** (`/demo?webmcp=partial`) — `search_products` and `get_product` only. Score around **79**. Find-task simulation passes; compare and cart still fail.
3. **Full** (`/demo?webmcp=full`) — search, filter, compare, cart, and checkout prep. Score around **99**. `?webmcp=on` is an alias for full.

Then, in a WebMCP-capable agent, ask: *Find me a laptop under $1,000 with at least 16GB of RAM and compare the three best options.*

Full mode registers:

- `search_products`
- `filter_products`
- `get_product`
- `compare_products`
- `add_to_cart`
- `prepare_checkout`

Purchase is never completed by an agent. `prepare_checkout` only summarizes the cart for a person.

## Console WebMCP tools

On console pages (not `/demo`), the app registers:

- `analyze_website`
- `get_agent_score`
- `get_issues`
- `get_recommendations`
- `generate_webmcp_plan`
- `run_agent_test` (task simulation: declared tool names only)

These use `@mcp-b/webmcp-polyfill` so `document.modelContext` works in browsers without native WebMCP.

## API

`POST /api/analyze` `{ "url": "https://example.com" }`

`POST /api/tasks/run` `{ "url": "...", "taskId": "commerce-find" }`

`POST /api/generate-tool` `{ "toolName": "search_products", "description": "..." }`

## Security

The analyzer only allows `http:` and `https:`. It blocks private IP ranges, metadata hosts, and most localhost targets, with an exception so this app can analyze its own origin (needed for the local demo). Requests time out, cap response size, and limit crawl depth. In production, analysis is rate-limited (default 60 per IP per hour; override with `ANALYZE_RATE_LIMIT`). Development has no analysis cap.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `AI_API_KEY` or `OPENAI_API_KEY` | No | OpenAI-compatible chat completions for extra interpretation |
| `AI_MODEL` | No | Defaults to `gpt-4o-mini` |

Never commit real keys.

## Deploy

Vercel is the intended host. After deploy, analyze `https://<your-app>/demo`, `https://<your-app>/demo?webmcp=partial`, and `https://<your-app>/demo?webmcp=full`.

## License

MIT
