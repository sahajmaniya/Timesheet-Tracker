-- Per-session notes for session-based (ISA) days, in session time order.
ALTER TABLE "TimeEntry" ADD COLUMN "sessionNotes" JSONB;
