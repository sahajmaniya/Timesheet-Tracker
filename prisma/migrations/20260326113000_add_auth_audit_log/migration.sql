CREATE TABLE IF NOT EXISTS "AuthAuditLog" (
  "id" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "reason" TEXT,
  "email" TEXT,
  "userId" TEXT,
  "ip" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuthAuditLog_event_createdAt_idx" ON "AuthAuditLog"("event", "createdAt");
CREATE INDEX IF NOT EXISTS "AuthAuditLog_email_createdAt_idx" ON "AuthAuditLog"("email", "createdAt");
CREATE INDEX IF NOT EXISTS "AuthAuditLog_userId_createdAt_idx" ON "AuthAuditLog"("userId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'AuthAuditLog_userId_fkey'
  ) THEN
    ALTER TABLE "AuthAuditLog"
    ADD CONSTRAINT "AuthAuditLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
