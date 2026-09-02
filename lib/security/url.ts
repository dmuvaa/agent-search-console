const PRIVATE_V4 = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./,
];

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "metadata.google.internal",
  "metadata.internal",
  "metadata",
]);

export class UrlSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UrlSafetyError";
  }
}

function isIpv4(host: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

function isPrivateIpv4(host: string) {
  return PRIVATE_V4.some((re) => re.test(host));
}

function isIpv6(host: string) {
  return host.includes(":");
}

function isPrivateIpv6(host: string) {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  return (
    h === "::1" ||
    h.startsWith("fc") ||
    h.startsWith("fd") ||
    h.startsWith("fe80")
  );
}

function hostnameOf(url: URL) {
  return url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
}

function requestHostname(requestHost: string) {
  return requestHost.split(":")[0].replace(/^\[|\]$/g, "").toLowerCase();
}

function requestPort(requestHost: string) {
  const remainder = requestHost.includes("]") ? requestHost.split("]")[1] || "" : requestHost;
  if (remainder.includes(":")) return remainder.split(":").pop() || "";
  return "";
}

function urlPort(url: URL) {
  if (url.port) return url.port;
  return url.protocol === "https:" ? "443" : "80";
}

function sameAppOrigin(url: URL, requestHost: string) {
  const host = hostnameOf(url);
  const self = requestHostname(requestHost);
  const incomingPort = requestPort(requestHost) || (url.protocol === "https:" ? "443" : "80");
  const targetPort = urlPort(url);
  const loopbackOk = isLoopback(host) && isLoopback(self) && incomingPort === targetPort;
  return host === self && incomingPort === targetPort || loopbackOk;
}

function isLoopback(host: string) {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "0.0.0.0"
  );
}

export function normalizeInputUrl(raw: string): URL {
  const trimmed = raw.trim();
  if (!trimmed) throw new UrlSafetyError("Please enter a valid URL.");
  let parsed: URL;
  try {
    parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new UrlSafetyError("Please enter a valid URL.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UrlSafetyError("Only http and https URLs are allowed.");
  }
  return parsed;
}

export async function assertSafeUrl(url: URL, requestHost: string) {
  const host = hostnameOf(url);
  const self = requestHostname(requestHost);

  if (BLOCKED_HOSTS.has(host) || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    if (sameAppOrigin(url, requestHost)) return;
    throw new UrlSafetyError("That address is not publicly reachable and cannot be analyzed.");
  }

  if (isIpv4(host) && isPrivateIpv4(host)) {
    if (sameAppOrigin(url, requestHost)) return;
    throw new UrlSafetyError("Private network addresses cannot be analyzed.");
  }

  if (isIpv6(host) && isPrivateIpv6(host)) {
    throw new UrlSafetyError("Private network addresses cannot be analyzed.");
  }

  if (host === self) return;

  try {
    const dns = await import("node:dns/promises");
    const records = await dns.lookup(host, { all: true });
    for (const record of records) {
      const address = record.address;
      if (isIpv4(address) && isPrivateIpv4(address)) {
        throw new UrlSafetyError("That hostname resolved to a private address.");
      }
      if (isIpv6(address) && isPrivateIpv6(address)) {
        throw new UrlSafetyError("That hostname resolved to a private address.");
      }
    }
  } catch (error) {
    if (error instanceof UrlSafetyError) throw error;
  }
}

export const FETCH_LIMITS = {
  timeoutMs: 8000,
  maxBytes: 1_500_000,
  maxRedirects: 3,
  maxPages: 6,
};
