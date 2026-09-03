import {
  FETCH_LIMITS,
  UrlSafetyError,
  assertSafeUrl,
  normalizeInputUrl,
} from "@/lib/security/url";

export const SEO_UA =
  "AgentSearchConsole/1.0 (+https://github.com/dmuvaa/agent-search-console)";

export class SeoToolError extends Error {
  status: number;
  constructor(message: string, status = 422) {
    super(message);
    this.name = "SeoToolError";
    this.status = status;
  }
}

export async function parseSafeUrl(raw: string, requestHost: string): Promise<URL> {
  let url: URL;
  try {
    url = normalizeInputUrl(raw);
  } catch (error) {
    if (error instanceof UrlSafetyError) throw new SeoToolError(error.message, 400);
    throw new SeoToolError("Please enter a valid URL.", 400);
  }
  try {
    await assertSafeUrl(url, requestHost);
  } catch (error) {
    if (error instanceof UrlSafetyError) throw new SeoToolError(error.message, 400);
    throw error;
  }
  return url;
}

export function headerMap(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export function getHeader(headers: Record<string, string>, name: string) {
  const lower = name.toLowerCase();
  const key = Object.keys(headers).find((k) => k.toLowerCase() === lower);
  return key ? headers[key] : undefined;
}

type FetchOnceOptions = {
  method?: "GET" | "HEAD";
  timeoutMs?: number;
  maxBytes?: number;
};

export async function fetchOnce(
  url: URL,
  requestHost: string,
  options: FetchOnceOptions = {},
): Promise<{
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  redirectedTo: string | null;
}> {
  await assertSafeUrl(url, requestHost);
  const method = options.method ?? "GET";
  const timeoutMs = options.timeoutMs ?? FETCH_LIMITS.timeoutMs;
  const maxBytes = options.maxBytes ?? FETCH_LIMITS.maxBytes;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
        "User-Agent": SEO_UA,
      },
    });

    const headers = headerMap(response.headers);
    let redirectedTo: string | null = null;
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (location) {
        try {
          redirectedTo = new URL(location, url).href;
        } catch {
          redirectedTo = location;
        }
      }
    }

    let body = "";
    if (method === "GET") {
      const length = Number(response.headers.get("content-length") || "0");
      if (length > maxBytes) {
        throw new SeoToolError("The website response is too large to analyze.");
      }
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > maxBytes) {
        throw new SeoToolError("The website response is too large to analyze.");
      }
      body = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    }

    return {
      url: url.toString(),
      status: response.status,
      statusText: response.statusText,
      headers,
      body,
      redirectedTo,
    };
  } catch (error) {
    if (error instanceof UrlSafetyError) throw new SeoToolError(error.message, 400);
    if (error instanceof SeoToolError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new SeoToolError("The website took too long to respond.", 504);
    }
    throw new SeoToolError("We couldn't access this website. Check that the URL is publicly accessible.");
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchBytes(
  url: URL,
  requestHost: string,
  options: { timeoutMs?: number; maxBytes?: number } = {},
): Promise<{
  url: string;
  status: number;
  headers: Record<string, string>;
  bytes: Uint8Array;
  redirectedTo: string | null;
}> {
  await assertSafeUrl(url, requestHost);
  const timeoutMs = options.timeoutMs ?? FETCH_LIMITS.timeoutMs;
  const maxBytes = options.maxBytes ?? FETCH_LIMITS.maxBytes;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        Accept: "application/xml,text/xml,application/gzip,*/*;q=0.8",
        "User-Agent": SEO_UA,
      },
    });
    const headers = headerMap(response.headers);
    let redirectedTo: string | null = null;
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (location) {
        try {
          redirectedTo = new URL(location, url).href;
        } catch {
          redirectedTo = location;
        }
      }
    }
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.byteLength > maxBytes) {
      throw new SeoToolError("The website response is too large to analyze.");
    }
    return { url: url.toString(), status: response.status, headers, bytes: buffer, redirectedTo };
  } catch (error) {
    if (error instanceof UrlSafetyError) throw new SeoToolError(error.message, 400);
    if (error instanceof SeoToolError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new SeoToolError("The website took too long to respond.", 504);
    }
    throw new SeoToolError("We couldn't access this website. Check that the URL is publicly accessible.");
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchDocument(
  start: URL,
  requestHost: string,
  options: { timeoutMs?: number; maxHops?: number } = {},
): Promise<{
  requestedUrl: string;
  finalUrl: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  redirected: boolean;
}> {
  const maxHops = options.maxHops ?? FETCH_LIMITS.maxRedirects;
  let current = start;
  let last = await fetchOnce(current, requestHost, { method: "GET", timeoutMs: options.timeoutMs });

  for (let hop = 0; hop < maxHops && last.redirectedTo; hop++) {
    current = new URL(last.redirectedTo);
    last = await fetchOnce(current, requestHost, { method: "GET", timeoutMs: options.timeoutMs });
  }

  return {
    requestedUrl: start.toString(),
    finalUrl: last.url,
    status: last.status,
    statusText: last.statusText,
    headers: last.headers,
    body: last.body,
    redirected: last.url !== start.toString(),
  };
}

export async function fetchHeadOrGet(url: URL, requestHost: string, timeoutMs = 5000) {
  try {
    const head = await fetchOnce(url, requestHost, { method: "HEAD", timeoutMs });
    if (head.status === 405 || head.status === 501) {
      return fetchOnce(url, requestHost, { method: "GET", timeoutMs });
    }
    return head;
  } catch {
    return fetchOnce(url, requestHost, { method: "GET", timeoutMs });
  }
}
