import { hash } from "bcrypt";
import { isAfter } from "date-fns";
import { NextResponse } from "next/server";
import { writeAuthAuditLog } from "@/lib/auth-audit";
import { sendPasswordChangedEmail } from "@/lib/email";
import { hashPasswordResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import {
  clientIpFromHeaders,
  enforceRateLimit,
  rejectIfCrossOrigin,
  userAgentFromHeaders,
} from "@/lib/security";
import { resetPasswordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const crossOriginBlocked = rejectIfCrossOrigin(request);
  if (crossOriginBlocked) return crossOriginBlocked;

  const ip = clientIpFromHeaders(request.headers);
  const userAgent = userAgentFromHeaders(request.headers);

  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      await writeAuthAuditLog({
        event: "password_reset_invalid_input",
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

    const tokenHash = hashPasswordResetToken(parsed.data.token);
    const rateLimit = enforceRateLimit({
      key: `password-reset-consume:${ip}:${tokenHash.slice(0, 12)}`,
      limit: 8,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.ok) {
      await writeAuthAuditLog({
        event: "password_reset_rate_limited",
        success: false,
        reason: "too_many_requests",
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: "Too many reset attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    });

    if (!resetToken) {
      await writeAuthAuditLog({
        event: "password_reset_token_invalid",
        success: false,
        reason: "token_not_found",
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: "This reset link is invalid.", code: "token_invalid" },
        { status: 400 },
      );
    }

    if (resetToken.usedAt) {
      await writeAuthAuditLog({
        event: "password_reset_token_invalid",
        success: false,
        reason: "token_used",
        email: resetToken.user.email,
        userId: resetToken.user.id,
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: "This reset link has already been used.", code: "token_used" },
        { status: 400 },
      );
    }

    if (isAfter(new Date(), resetToken.expiresAt)) {
      await writeAuthAuditLog({
        event: "password_reset_token_invalid",
        success: false,
        reason: "token_expired",
        email: resetToken.user.email,
        userId: resetToken.user.id,
        ip,
        userAgent,
      });
      return NextResponse.json(
        { error: "This reset link has expired.", code: "token_expired" },
        { status: 400 },
      );
    }

    const passwordHash = await hash(parsed.data.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: passwordHash,
          passwordChangedAt: new Date(),
          sessionVersion: { increment: 1 },
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
          id: { not: resetToken.id },
        },
      }),
      prisma.loginOtpChallenge.deleteMany({
        where: { userId: resetToken.userId, consumedAt: null },
      }),
    ]);

    await writeAuthAuditLog({
      event: "password_reset_success",
      success: true,
      email: resetToken.user.email,
      userId: resetToken.user.id,
      ip,
      userAgent,
    });

    try {
      await sendPasswordChangedEmail({
        to: resetToken.user.email,
      });
    } catch (error) {
      console.error("Password changed email failed:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can sign in now.",
    });
  } catch (error) {
    console.error("Reset password API failed:", error);
    await writeAuthAuditLog({
      event: "password_reset_error",
      success: false,
      reason: error instanceof Error ? error.message : "unknown_error",
      ip,
      userAgent,
    });
    return NextResponse.json(
      { error: "Could not reset password." },
      { status: 500 },
    );
  }
}
