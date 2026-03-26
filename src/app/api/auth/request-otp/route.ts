import { addMinutes } from "date-fns";
import { compare } from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAuthAuditLog } from "@/lib/auth-audit";
import { sendOtpEmail } from "@/lib/email";
import { generateOtpCode, hashOtpCode, OTP_EXPIRES_MINUTES } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { clientIpFromHeaders, enforceRateLimit, rejectIfCrossOrigin, userAgentFromHeaders } from "@/lib/security";

const requestOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const crossOriginBlocked = rejectIfCrossOrigin(request);
  if (crossOriginBlocked) return crossOriginBlocked;

  const ip = clientIpFromHeaders(request.headers);
  const userAgent = userAgentFromHeaders(request.headers);

  try {
    const body = await request.json();
    const parsed = requestOtpSchema.safeParse(body);

    if (!parsed.success) {
      await writeAuthAuditLog({
        event: "otp_request_invalid_input",
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

    const rateLimit = enforceRateLimit({
      key: `otp:${ip}:${parsed.data.email}`,
      limit: 8,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.ok) {
      await writeAuthAuditLog({
        event: "otp_request_rate_limited",
        success: false,
        email: parsed.data.email,
        reason: "too_many_requests",
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: "Too many OTP requests. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, email: true, password: true },
    });

    if (!user?.password) {
      await writeAuthAuditLog({
        event: "otp_request_auth_failed",
        success: false,
        email: parsed.data.email,
        reason: "user_not_found",
        ip,
        userAgent,
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const passwordOk = await compare(parsed.data.password, user.password);
    if (!passwordOk) {
      await writeAuthAuditLog({
        event: "otp_request_auth_failed",
        success: false,
        email: parsed.data.email,
        userId: user.id,
        reason: "password_mismatch",
        ip,
        userAgent,
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const code = generateOtpCode();
    const codeHash = hashOtpCode({ email: user.email, code });
    const expiresAt = addMinutes(new Date(), OTP_EXPIRES_MINUTES);

    await prisma.loginOtpChallenge.deleteMany({
      where: { userId: user.id, consumedAt: null },
    });

    const challenge = await prisma.loginOtpChallenge.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt,
      },
      select: { id: true },
    });

    const emailResult = await sendOtpEmail({ to: user.email, code });

    await writeAuthAuditLog({
      event: "otp_request_sent",
      success: true,
      email: user.email,
      userId: user.id,
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      challengeId: challenge.id,
      expiresInMinutes: OTP_EXPIRES_MINUTES,
      ...(emailResult.devMode && process.env.NODE_ENV === "development" ? { devOtp: code } : {}),
    });
  } catch (error) {
    console.error("Request OTP failed:", error);
    await writeAuthAuditLog({
      event: "otp_request_error",
      success: false,
      reason: error instanceof Error ? error.message : "unknown_error",
      ip,
      userAgent,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send OTP" },
      { status: 500 },
    );
  }
}
