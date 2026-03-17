DROP TABLE IF EXISTS "Account";
DROP TABLE IF EXISTS "Session";
DROP TABLE IF EXISTS "VerificationToken";

ALTER TABLE "User" DROP COLUMN IF EXISTS "emailVerified";

UPDATE "User" SET "password" = '' WHERE "password" IS NULL;
ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;
