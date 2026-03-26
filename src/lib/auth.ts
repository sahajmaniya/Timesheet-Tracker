import { compare } from "bcrypt";
import { isAfter } from "date-fns";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { hashOtpCode, OTP_MAX_ATTEMPTS } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  otp: z.string().regex(/^\d{6}$/),
  challengeId: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
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
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user) return null;
        if (!user.password) return null;

        const passwordOk = await compare(parsed.data.password, user.password);
        if (!passwordOk) return null;

        const challenge = await prisma.loginOtpChallenge.findFirst({
          where: {
            id: parsed.data.challengeId,
            userId: user.id,
            consumedAt: null,
          },
        });

        if (!challenge) return null;
        if (isAfter(new Date(), challenge.expiresAt)) return null;
        if (challenge.attempts >= OTP_MAX_ATTEMPTS) return null;

        const codeHash = hashOtpCode({
          email: user.email,
          code: parsed.data.otp,
        });

        if (codeHash !== challenge.codeHash) {
          await prisma.loginOtpChallenge.update({
            where: { id: challenge.id },
            data: { attempts: { increment: 1 } },
          });
          return null;
        }

        await prisma.loginOtpChallenge.update({
          where: { id: challenge.id },
          data: { consumedAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { name: true, email: true, image: true },
        });
        if (dbUser) {
          session.user.name = dbUser.name;
          session.user.email = dbUser.email;
          session.user.image = dbUser.image;
        }
      }
      return session;
    },
  },
};

export async function getServerAuthSession() {
  return getServerSession(authOptions);
}
