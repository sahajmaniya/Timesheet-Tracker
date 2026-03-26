CREATE TABLE IF NOT EXISTS "LoginOtpChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoginOtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LoginOtpChallenge_userId_expiresAt_idx"
ON "LoginOtpChallenge"("userId", "expiresAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'LoginOtpChallenge_userId_fkey'
  ) THEN
    ALTER TABLE "LoginOtpChallenge"
    ADD CONSTRAINT "LoginOtpChallenge_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
