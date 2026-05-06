ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "calculationSource" TEXT NOT NULL DEFAULT 'local_estimate';
