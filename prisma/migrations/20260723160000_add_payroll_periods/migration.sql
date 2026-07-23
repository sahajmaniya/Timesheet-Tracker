CREATE TABLE "PayrollPeriod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollPeriod_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PayrollPeriod_userId_startDate_endDate_key"
ON "PayrollPeriod"("userId", "startDate", "endDate");

CREATE INDEX "PayrollPeriod_userId_startDate_endDate_idx"
ON "PayrollPeriod"("userId", "startDate", "endDate");

ALTER TABLE "PayrollPeriod"
ADD CONSTRAINT "PayrollPeriod_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
