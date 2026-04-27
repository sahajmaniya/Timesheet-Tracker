import { compare, hash } from "bcrypt";
import { randomUUID } from "crypto";
import { isAfter } from "date-fns";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { writeAuthAuditLog } from "@/lib/auth-audit";
import { hashOtpCode, OTP_MAX_ATTEMPTS } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  otp: z.string().trim().regex(/^\d{6}$/),
  challengeId: z.string().trim().min(1).optional(),
});

async function getUserSessionSnapshot(params: {
  id?: string | null;
  email?: string | null;
}) {
  if (params.id) {
    const byId = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, email: true, image: true, sessionVersion: true },
    });
    if (byId) return byId;
  }

  if (params.email) {
    return prisma.user.findUnique({
      where: { email: params.email.toLowerCase() },
      select: { id: true, name: true, email: true, image: true, sessionVersion: true },
    });
  }

  return null;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  debug: process.env.NEXTAUTH_DEBUG === "true",
  logger: {
    error(code, metadata) {
      console.error("[NextAuth][error]", code, metadata);
    },
    warn(code) {
      console.warn("[NextAuth][warn]", code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === "development") {
        console.info("[NextAuth][debug]", code, metadata);
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
        challengeId: { label: "Challenge Id", type: "text" },
      },
      async authorize(credentials) {
        await writeAuthAuditLog({
          event: "signin_attempt",
          success: true,
          email: typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : undefined,
        });

        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          await writeAuthAuditLog({
            event: "signin_invalid_input",
            success: false,
            reason: "validation_failed",
          });
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.password) {
          await writeAuthAuditLog({
            event: "signin_failed",
            success: false,
            email: parsed.data.email,
            reason: "user_not_found",
          });
          return null;
        }

        const passwordOk = await compare(parsed.data.password, user.password);
        if (!passwordOk) {
          await writeAuthAuditLog({
            event: "signin_failed",
            success: false,
            email: user.email,
            userId: user.id,
            reason: "password_mismatch",
          });
          return null;
        }

        const activeChallenges = await prisma.loginOtpChallenge.findMany({
          where: {
            userId: user.id,
            consumedAt: null,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        });

        const challenge =
          (parsed.data.challengeId
            ? activeChallenges.find((item) => item.id === parsed.data.challengeId)
            : null) ?? activeChallenges[0];

        if (!challenge) {
          await writeAuthAuditLog({
            event: "signin_failed",
            success: false,
            email: user.email,
            userId: user.id,
            reason: "otp_challenge_missing",
          });
          return null;
        }
        if (isAfter(new Date(), challenge.expiresAt)) {
          await writeAuthAuditLog({
            event: "signin_failed",
            success: false,
            email: user.email,
            userId: user.id,
            reason: "otp_expired",
          });
          return null;
        }
        if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
          await writeAuthAuditLog({
            event: "signin_failed",
            success: false,
            email: user.email,
            userId: user.id,
            reason: "otp_attempt_limit_reached",
          });
          return null;
        }

        const codeHash = hashOtpCode({
          email: user.email,
          code: parsed.data.otp,
        });

        if (codeHash !== challenge.codeHash) {
          await prisma.loginOtpChallenge.update({
            where: { id: challenge.id },
            data: { attempts: { increment: 1 } },
          });
          await writeAuthAuditLog({
            event: "signin_failed",
            success: false,
            email: user.email,
            userId: user.id,
            reason: "otp_mismatch",
          });
          return null;
        }

        await prisma.loginOtpChallenge.update({
          where: { id: challenge.id },
          data: { consumedAt: new Date() },
        });

        await writeAuthAuditLog({
          event: "signin_success",
          success: true,
          email: user.email,
          userId: user.id,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      const email = user.email?.trim().toLowerCase();
      if (!email) return false;

      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true, image: true },
      });

      if (!existing) {
        const randomPasswordHash = await hash(randomUUID(), 12);
        const created = await prisma.user.create({
          data: {
            email,
            name: user.name,
            image: user.image,
            password: randomPasswordHash,
          },
          select: { id: true },
        });
        await writeAuthAuditLog({
          event: "google_signin_success",
          success: true,
          email,
          userId: created.id,
          reason: "created_account",
        });
        return true;
      }

      await prisma.user.update({
        where: { email },
        data: {
          name: user.name ?? undefined,
          image: user.image ?? existing.image ?? undefined,
        },
      });

      await writeAuthAuditLog({
        event: "google_signin_success",
        success: true,
        email,
        userId: existing.id,
        reason: "existing_account",
      });

      return true;
    },
    async jwt({ token, user }) {
      // Fresh sign-in: always synchronize token with the current DB snapshot first.
      // This prevents false "SessionRevoked" on newly issued credentials.
      if (user?.id) {
        const dbUser = await getUserSessionSnapshot({
          id: user.id,
          email: user.email?.toLowerCase(),
        });

        token.sub = dbUser?.id ?? user.id;
        token.name = dbUser?.name ?? user.name;
        token.email = dbUser?.email ?? user.email;
        token.image = dbUser?.image ?? null;
        token.sessionVersion = dbUser?.sessionVersion ?? 0;
        delete token.error;
        return token;
      }

      if (typeof token.sessionVersion !== "number") {
        token.sessionVersion = 0;
      }

      const dbUser = await getUserSessionSnapshot({
        id: token.sub,
        email: typeof token.email === "string" ? token.email : undefined,
      });

      if (dbUser) {
        if (token.sessionVersion !== dbUser.sessionVersion) {
          delete token.sub;
          delete token.email;
          delete token.name;
          delete token.image;
          token.error = "SessionRevoked";
          token.sessionVersion = dbUser.sessionVersion;
          return token;
        }

        token.sub = dbUser.id;
        token.name = dbUser.name;
        token.email = dbUser.email;
        token.image = dbUser.image ?? null;
        token.sessionVersion = dbUser.sessionVersion;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.error === "SessionRevoked") {
        session.error = "SessionRevoked";
      }
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.name = typeof token.name === "string" ? token.name : null;
        session.user.email = typeof token.email === "string" ? token.email : null;
        session.user.image = typeof token.image === "string" ? token.image : null;
      }
      return session;
    },
  },
};

export async function getServerAuthSession() {
  return getServerSession(authOptions);
}
