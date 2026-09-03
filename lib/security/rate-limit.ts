type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX = Number(process.env.SEO_RATE_LIMIT || process.env.ANALYZE_RATE_LIMIT || 60);

export function rateLimit(ip: string) {
  if (process.env.NODE_ENV !== "production") {
    return { ok: true, remaining: MAX };
  }

  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || current.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX - 1 };
  }
  if (current.count >= MAX) {
    return { ok: false, remaining: 0, retryAt: current.resetAt };
  }
  current.count += 1;
  return { ok: true, remaining: MAX - current.count };
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}
