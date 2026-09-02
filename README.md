# Agent Search Console

**SEO for the Agentic Web.**

Agent Search Console audits **real public websites** for AI-agent readiness: can an agent discover, understand, and operate the site? It scores structure and workflows, inspects WebMCP tools, and generates starter `document.modelContext.registerTool` code for gaps.

This is a hackathon MVP. The Agent Readiness Score is an **Agent Search Console assessment**, not an industry standard.

## Analyze a real website

Paste any public `http` or `https` URL on the home page or at `/analyze`.

Live app: [https://agent-search-console.vercel.app/](https://agent-search-console.vercel.app/)

Examples:

- A live production site: `https://webprismio.com`
- This console (it publishes WebMCP tools): `https://agent-search-console.vercel.app/`

The analyzer fetches the page plus a few same-origin links, looks for WebMCP (`application/webmcp+json`, `toolname` attributes, script hints), then scores five categories out of 20 each (100 total).

Task simulation checks whether expected tool **names** are declared. It does not run an agent, invoke remote tools, or click the live UI. Tools registered only after JavaScript runs are not visible to the server-side crawler.

Website HTML is processed in memory. Nothing is stored as a permanent copy of crawled pages.

## Add WebMCP to your own site

1. Analyze your production URL.
2. Open **Issues** and **Starter code** (`/generator`) for missing operations.
3. Register tools on your site with `document.modelContext.registerTool` (see Chrome’s [WebMCP docs](https://developer.chrome.com/docs/ai/webmcp)).
4. Re-analyze the same URL. Declared tools should raise WebMCP coverage, tool quality, and task simulation.

This console itself is a WebMCP site. In ChatGPT’s in-app browser (or Chrome 149+ with `chrome://flags/#enable-webmcp-testing`), open the deployed app and ask:

*Analyze https://example.com for agent readiness.*

It should call `analyze_website`.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional: set `AI_API_KEY` or `OPENAI_API_KEY` for LLM interpretation. Without a key, recommendations still run from deterministic heuristics.

## Console WebMCP tools

The app registers:

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

The analyzer only allows `http:` and `https:`. It blocks private IP ranges, metadata hosts, and most localhost targets, with an exception so this app can analyze its own origin. Requests time out, cap response size, and limit crawl depth. In production, analysis is rate-limited (default 60 per IP per hour; override with `ANALYZE_RATE_LIMIT`). Development has no analysis cap.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `AI_API_KEY` or `OPENAI_API_KEY` | No | OpenAI API key for extra interpretation via the Responses API |
| `AI_MODEL` | No | Defaults to `gpt-5.6-terra`. Also valid: `gpt-5.6-luna` (cheaper) or `gpt-5.6` / `gpt-5.6-sol` (flagship) |

Never commit real keys.

## Deploy

Vercel is the intended host. Live: [https://agent-search-console.vercel.app/](https://agent-search-console.vercel.app/). Paste any public URL into Analyze. To confirm WebMCP on this app, analyze that same origin.

## License

MIT
