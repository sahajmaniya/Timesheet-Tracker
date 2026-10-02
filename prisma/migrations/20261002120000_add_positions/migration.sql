CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student_assistant',
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "workScheduleJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Position_userId_idx" ON "Position"("userId");

ALTER TABLE "Position"
ADD CONSTRAINT "Position_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing user gets one default position carrying over their
-- current hourly rate and regular schedule.
INSERT INTO "Position" ("id", "userId", "name", "role", "hourlyRate", "workScheduleJson", "createdAt", "updatedAt")
SELECT
    'pos_' || md5(u."id" || random()::text || clock_timestamp()::text),
    u."id",
    'Student Assistant',
    'student_assistant',
    COALESCE(u."hourlyRate", 0),
    u."workScheduleJson",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User" u;

ALTER TABLE "TimeEntry" ADD COLUMN "positionId" TEXT;

-- Each user has exactly one position at this point, so the join is unambiguous.
UPDATE "TimeEntry" t
SET "positionId" = p."id"
FROM "Position" p
WHERE p."userId" = t."userId";

ALTER TABLE "TimeEntry" ALTER COLUMN "positionId" SET NOT NULL;

CREATE INDEX "TimeEntry_positionId_date_idx" ON "TimeEntry"("positionId", "date");

ALTER TABLE "TimeEntry"
ADD CONSTRAINT "TimeEntry_positionId_fkey"
FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
