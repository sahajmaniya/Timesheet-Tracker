import { createHash, randomInt } from "crypto";

export const OTP_CODE_LENGTH = 6;
export const OTP_EXPIRES_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

function otpSecret() {
  return process.env.OTP_SECRET || process.env.NEXTAUTH_SECRET || "dev-otp-secret";
}

export function generateOtpCode() {
  const min = 10 ** (OTP_CODE_LENGTH - 1);
  const max = 10 ** OTP_CODE_LENGTH;
  return String(randomInt(min, max));
}

export function hashOtpCode({ email, code }: { email: string; code: string }) {
  return createHash("sha256")
    .update(`${otpSecret()}:${email.toLowerCase().trim()}:${code}`)
    .digest("hex");
}

