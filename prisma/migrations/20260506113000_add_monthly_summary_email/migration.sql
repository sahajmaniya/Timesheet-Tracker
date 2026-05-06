ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "monthlySummaryEmailEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "MonthlySummaryEmailLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MonthlySummaryEmailLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MonthlySummaryEmailLog_userId_month_key"
  ON "MonthlySummaryEmailLog"("userId", "month");

CREATE INDEX IF NOT EXISTS "MonthlySummaryEmailLog_month_sentAt_idx"
  ON "MonthlySummaryEmailLog"("month", "sentAt");

ALTER TABLE "MonthlySummaryEmailLog"
  ADD CONSTRAINT "MonthlySummaryEmailLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
