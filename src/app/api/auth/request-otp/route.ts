import { addMinutes } from "date-fns";
import { compare } from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendOtpEmail } from "@/lib/email";
import { generateOtpCode, hashOtpCode, OTP_EXPIRES_MINUTES } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

const requestOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, email: true, password: true },
    });

    if (!user?.password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const passwordOk = await compare(parsed.data.password, user.password);
    if (!passwordOk) {
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

    return NextResponse.json({
      success: true,
      challengeId: challenge.id,
      expiresInMinutes: OTP_EXPIRES_MINUTES,
      ...(emailResult.devMode && process.env.NODE_ENV === "development" ? { devOtp: code } : {}),
    });
  } catch (error) {
    console.error("Request OTP failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send OTP" },
      { status: 500 },
    );
  }
}

