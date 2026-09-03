import { parseSafeUrl, SeoToolError } from "@/lib/seo-tools/http";

export async function checkHttpHeaders(rawUrl: string, requestHost: string) {
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
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Agent Search Console; +https://agent-search-console.vercel.app)",
      },
      signal: controller.signal,
    });
  } catch (e: unknown) {
    clearTimeout(timeoutId);
    if (e instanceof Error && e.name === "AbortError") throw new SeoToolError("Connection timed out.");
    throw new SeoToolError(`Failed to fetch URL: ${e instanceof Error ? e.message : "unknown error"}`);
  } finally {
    clearTimeout(timeoutId);
  }

  const allHeaders: { name: string; value: string }[] = [];
  response.headers.forEach((value, key) => {
    allHeaders.push({ name: key, value });
  });

  const getHeader = (name: string) => {
    return allHeaders.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;
  };

  const securityHeaders = [
    {
      name: "Strict-Transport-Security",
      description: "Enforces secure (HTTP over SSL/TLS) connections to the server.",
      present: !!getHeader("Strict-Transport-Security"),
      value: getHeader("Strict-Transport-Security"),
    },
    {
      name: "Content-Security-Policy",
      description: "Prevents XSS and other code injection attacks by defining approved sources of content.",
      present: !!getHeader("Content-Security-Policy"),
      value: getHeader("Content-Security-Policy"),
    },
    {
      name: "X-Frame-Options",
      description: "Protects against clickjacking by controlling whether the site can be framed.",
      present: !!getHeader("X-Frame-Options"),
      value: getHeader("X-Frame-Options"),
    },
    {
      name: "X-Content-Type-Options",
      description: "Prevents the browser from interpreting files as a different MIME type.",
      present: !!getHeader("X-Content-Type-Options"),
      value: getHeader("X-Content-Type-Options"),
    },
    {
      name: "Referrer-Policy",
      description:
        "Controls how much referrer information (sent via the Referer header) should be included with requests.",
      present: !!getHeader("Referrer-Policy"),
      value: getHeader("Referrer-Policy"),
    },
    {
      name: "Permissions-Policy",
      description: "Allows a site to control which features and APIs can be used in the browser.",
      present: !!getHeader("Permissions-Policy") || !!getHeader("Feature-Policy"),
      value: getHeader("Permissions-Policy") || getHeader("Feature-Policy"),
    },
  ];

  return {
    url: validUrl,
    success: true,
    status: response.status,
    statusText: response.statusText,
    server: getHeader("Server"),
    contentType: getHeader("Content-Type"),
    headers: allHeaders.sort((a, b) => a.name.localeCompare(b.name)),
    securityHeaders,
  };
}
