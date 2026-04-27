import { NextResponse } from "next/server";
import { writeAuthAuditLog } from "@/lib/auth-audit";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  generatePasswordResetToken,
  getPasswordResetExpiryDate,
  hashPasswordResetToken,
  PASSWORD_RESET_EXPIRES_MINUTES,
} from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import {
  clientIpFromHeaders,
  enforceRateLimit,
  rejectIfCrossOrigin,
  userAgentFromHeaders,
} from "@/lib/security";
import { forgotPasswordSchema } from "@/lib/validators";

const genericSuccessMessage =
  "If that email exists, we sent a password reset link.";

export async function POST(request: Request) {
  const crossOriginBlocked = rejectIfCrossOrigin(request);
  if (crossOriginBlocked) return crossOriginBlocked;

  const ip = clientIpFromHeaders(request.headers);
  const userAgent = userAgentFromHeaders(request.headers);

  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      await writeAuthAuditLog({
        event: "password_reset_request_invalid_input",
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
      key: `password-reset:${ip}:${parsed.data.email}`,
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimit.ok) {
      await writeAuthAuditLog({
        event: "password_reset_request_rate_limited",
        success: false,
        email: parsed.data.email,
        reason: "too_many_requests",
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: "Too many reset requests. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, email: true },
    });

    if (!user) {
      await writeAuthAuditLog({
        event: "password_reset_request_unknown_email",
        success: true,
        email: parsed.data.email,
        reason: "masked_response",
        ip,
        userAgent,
      });
      return NextResponse.json(
        { success: true, message: genericSuccessMessage },
        { status: 200 },
      );
    }

    const rawToken = generatePasswordResetToken();
    const tokenHash = hashPasswordResetToken(rawToken);
    const expiresAt = getPasswordResetExpiryDate();

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      token: rawToken,
    });

    await writeAuthAuditLog({
      event: "password_reset_request_sent",
      success: true,
      email: user.email,
      userId: user.id,
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: genericSuccessMessage,
      expiresInMinutes: PASSWORD_RESET_EXPIRES_MINUTES,
      ...(emailResult.devMode && process.env.NODE_ENV === "development"
        ? { devResetUrl: emailResult.resetUrl }
        : {}),
    });
  } catch (error) {
    console.error("Forgot password API failed:", error);
    await writeAuthAuditLog({
      event: "password_reset_request_error",
      success: false,
      reason: error instanceof Error ? error.message : "unknown_error",
      ip,
      userAgent,
    });
    return NextResponse.json(
      { error: "Could not process password reset request." },
      { status: 500 },
    );
  }
}
