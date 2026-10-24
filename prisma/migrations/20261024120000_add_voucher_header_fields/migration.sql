-- Voucher header details used to fill blank timesheet templates.
ALTER TABLE "User" ADD COLUMN "timesheetName" TEXT;
ALTER TABLE "User" ADD COLUMN "employeeId" TEXT;

ALTER TABLE "Position" ADD COLUMN "deptId" TEXT;
ALTER TABLE "Position" ADD COLUMN "deptName" TEXT;
ALTER TABLE "Position" ADD COLUMN "positionNumber" TEXT;
ALTER TABLE "Position" ADD COLUMN "emplRecord" TEXT;
