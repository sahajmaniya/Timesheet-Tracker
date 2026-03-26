import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const inMemoryBuckets = new Map<string, Bucket>();

export function clientIpFromHeaders(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") || "unknown";
}

export function userAgentFromHeaders(headers: Headers) {
  return headers.get("user-agent") || "unknown";
}

export function enforceRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const existing = inMemoryBuckets.get(key);

  if (!existing || now > existing.resetAt) {
    inMemoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false as const,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true as const, retryAfterSeconds: 0 };
}

export function rejectIfCrossOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const requestUrl = new URL(request.url);
  const expectedHost = requestUrl.host;

  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }

  if (originHost !== expectedHost) {
    return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 });
  }

  return null;
}

