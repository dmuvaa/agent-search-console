import { FETCH_LIMITS, UrlSafetyError, assertSafeUrl } from "@/lib/security/url";

const UA =
  "AgentSearchConsole/1.0 (+https://github.com/agent-search-console; hackathon analyzer)";

export class FetchError extends Error {
  code: "unavailable" | "timeout" | "too_large" | "blocked";
  constructor(message: string, code: FetchError["code"]) {
    super(message);
    this.code = code;
  }
}

export async function fetchHtml(url: URL, requestHost: string): Promise<{ html: string; finalUrl: string; status: number }> {
  await assertSafeUrl(url, requestHost);

  let current = url;
  for (let hop = 0; hop <= FETCH_LIMITS.maxRedirects; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_LIMITS.timeoutMs);
    try {
      const response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent": UA,
        },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) break;
        const next = new URL(location, current);
        await assertSafeUrl(next, requestHost);
        current = next;
        continue;
      }
      if (response.status >= 400) {
        throw new FetchError(
          "We couldn't access this website. Check that the URL is publicly accessible.",
          "unavailable",
        );
      }
      const length = Number(response.headers.get("content-length") || "0");
      if (length > FETCH_LIMITS.maxBytes) {
        throw new FetchError("The website response is too large to analyze.", "too_large");
      }
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > FETCH_LIMITS.maxBytes) {
        throw new FetchError("The website response is too large to analyze.", "too_large");
      }
      const html = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
      return { html, finalUrl: current.toString(), status: response.status };
    } catch (error) {
      if (error instanceof UrlSafetyError || error instanceof FetchError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new FetchError("The website took too long to respond.", "timeout");
      }
      throw new FetchError(
        "We couldn't access this website. Check that the URL is publicly accessible.",
        "unavailable",
      );
    } finally {
      clearTimeout(timer);
    }
  }
  throw new FetchError("The website redirected too many times.", "blocked");
}

export async function fetchOptionalJson(url: URL, requestHost: string) {
  try {
    await assertSafeUrl(url, requestHost);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": UA },
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!response.ok) return null;
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}
