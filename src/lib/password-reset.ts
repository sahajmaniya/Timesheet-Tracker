import { addMinutes } from "date-fns";
import { createHash, randomBytes } from "crypto";

export const PASSWORD_RESET_EXPIRES_MINUTES = 30;

function getResetSecret() {
  return process.env.NEXTAUTH_SECRET || process.env.OTP_SECRET || "punchpilot-reset-secret";
}

export function generatePasswordResetToken() {
  return randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(`${token}:${getResetSecret()}`).digest("hex");
}

export function getPasswordResetExpiryDate() {
  return addMinutes(new Date(), PASSWORD_RESET_EXPIRES_MINUTES);
}
