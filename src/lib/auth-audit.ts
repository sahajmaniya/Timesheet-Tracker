import { prisma } from "@/lib/prisma";

export async function writeAuthAuditLog(input: {
  event: string;
  success: boolean;
  reason?: string;
  email?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}) {
  try {
    await prisma.authAuditLog.create({
      data: {
        event: input.event,
        success: input.success,
        reason: input.reason,
        email: input.email,
        userId: input.userId,
        ip: input.ip,
        userAgent: input.userAgent,
      },
    });
  } catch (error) {
    console.error("Auth audit log failed:", error);
  }
}

