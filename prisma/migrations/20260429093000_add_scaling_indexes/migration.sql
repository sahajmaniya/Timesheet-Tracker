-- Add indexes for frequent cleanup and lookup paths.
-- Safe, non-breaking optimization.

CREATE INDEX IF NOT EXISTS "LoginOtpChallenge_userId_consumedAt_idx"
  ON "LoginOtpChallenge"("userId", "consumedAt");

CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_usedAt_idx"
  ON "PasswordResetToken"("userId", "usedAt");
