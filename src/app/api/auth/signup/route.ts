import { hash } from "bcrypt";
import { NextResponse } from "next/server";
import { writeAuthAuditLog } from "@/lib/auth-audit";
import { prisma } from "@/lib/prisma";
import {
  clientIpFromHeaders,
  enforceRateLimit,
  rejectIfCrossOrigin,
  userAgentFromHeaders,
} from "@/lib/security";
import { signupSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const crossOriginBlocked = rejectIfCrossOrigin(request);
  if (crossOriginBlocked) return crossOriginBlocked;

  const ip = clientIpFromHeaders(request.headers);
  const userAgent = userAgentFromHeaders(request.headers);

  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      await writeAuthAuditLog({
        event: "signup_invalid_input",
        success: false,
        reason: "validation_failed",
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const rateLimit = enforceRateLimit({
      key: `signup:${ip}:${email}`,
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimit.ok) {
      await writeAuthAuditLog({
        event: "signup_rate_limited",
        success: false,
        email,
        reason: "too_many_requests",
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: "Too many signup attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      await writeAuthAuditLog({
        event: "signup_conflict",
        success: false,
        email,
        userId: existing.id,
        reason: "email_already_exists",
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await hash(parsed.data.password, 12);

    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        password: passwordHash,
      },
    });

    await writeAuthAuditLog({
      event: "signup_success",
      success: true,
      email,
      ip,
      userAgent,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Signup API error:", error);
    await writeAuthAuditLog({
      event: "signup_error",
      success: false,
      reason: error instanceof Error ? error.message : "unknown_error",
      ip,
      userAgent,
    });
    const message =
      process.env.NODE_ENV === "development"
        ? error instanceof Error
          ? error.message
          : "Unknown server error"
        : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
