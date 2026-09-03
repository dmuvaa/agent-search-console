import { parseSafeUrl, SeoToolError } from "@/lib/seo-tools/http";

export async function checkRedirects(rawUrl: string, requestHost: string) {
  const start = await parseSafeUrl(rawUrl, requestHost);
  let validUrl = start.toString();
  if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://")) {
    validUrl = "https://" + validUrl;
  }

  const chain: { url: string; status: number; timeMs: number }[] = [];
  let currentUrl = validUrl;
  let totalTimeMs = 0;
  let loopDetected = false;
  const maxRedirects = 10;
  const visitedUrls = new Set<string>();

  for (let i = 0; i <= maxRedirects; i++) {
    if (visitedUrls.has(currentUrl)) {
      loopDetected = true;
      break;
    }
    visitedUrls.add(currentUrl);
    await parseSafeUrl(currentUrl, requestHost);

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(currentUrl, {
        method: "HEAD",
        redirect: "manual",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Agent Search Console; +https://agent-search-console.vercel.app)",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const timeMs = Date.now() - startTime;
      totalTimeMs += timeMs;

      chain.push({
        url: currentUrl,
        status: response.status,
        timeMs,
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          break;
        }

        try {
          currentUrl = new URL(location, currentUrl).href;
        } catch {
          currentUrl = location;
        }
      } else {
        break;
      }
    } catch (e: unknown) {
      clearTimeout(timeoutId);

      if (e instanceof Error && e.name !== "AbortError" && i === 0 && chain.length === 0) {
        const getStartTime = Date.now();
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), 5000);
        try {
          const getResponse = await fetch(currentUrl, {
            method: "GET",
            redirect: "manual",
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; Agent Search Console; +https://agent-search-console.vercel.app)",
            },
            signal: getController.signal,
          });
          clearTimeout(getTimeoutId);
          const getTimeMs = Date.now() - getStartTime;
          totalTimeMs += getTimeMs;

          chain.push({
            url: currentUrl,
            status: getResponse.status,
            timeMs: getTimeMs,
          });

          if (getResponse.status >= 300 && getResponse.status < 400) {
            const location = getResponse.headers.get("location");
            if (location) {
              try {
                currentUrl = new URL(location, currentUrl).href;
              } catch {
                currentUrl = location;
              }
              continue;
            }
          }
          break;
        } catch (getErr: unknown) {
          throw new SeoToolError(
            `Failed to fetch URL: ${getErr instanceof Error ? getErr.message : "unknown error"}`,
          );
        }
      } else {
        throw new SeoToolError(
          `Failed to fetch URL: ${e instanceof Error ? e.message : "unknown error"}`,
        );
      }
    }
  }

  if (chain.length === maxRedirects + 1 && String(chain[chain.length - 1].status).startsWith("3")) {
    loopDetected = true;
  }

  return {
    url: validUrl,
    success: true,
    finalUrl: chain[chain.length - 1]?.url,
    chain,
    totalTimeMs,
    loopDetected,
  };
}
