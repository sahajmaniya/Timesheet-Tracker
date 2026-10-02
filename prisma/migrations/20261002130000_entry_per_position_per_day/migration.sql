-- One entry per position per day (a user may work two positions on the same date).
DROP INDEX "TimeEntry_userId_date_key";

CREATE UNIQUE INDEX "TimeEntry_userId_positionId_date_key" ON "TimeEntry"("userId", "positionId", "date");
