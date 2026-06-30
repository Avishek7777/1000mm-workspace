-- Make trainer_applications.email globally unique
-- Drop the non-unique index first (Prisma named it this way)
DROP INDEX IF EXISTS "trainer_applications_email_idx";

-- Add unique constraint (creates a unique index named trainer_applications_email_key)
ALTER TABLE "trainer_applications" ADD CONSTRAINT "trainer_applications_email_key" UNIQUE ("email");
