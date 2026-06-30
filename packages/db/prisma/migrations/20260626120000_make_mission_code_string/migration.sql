-- Convert LocalMissionCode enum fields to plain TEXT so new missions can be created at runtime.
-- PostgreSQL requires USING clause when casting enum → text.

-- 1. ApplicationCounter primary key uses missionCode as part of PK — drop/recreate PK
ALTER TABLE "application_counters" DROP CONSTRAINT "application_counters_pkey";
ALTER TABLE "application_counters" ALTER COLUMN "missionCode" TYPE TEXT USING "missionCode"::text;
ALTER TABLE "application_counters" ADD PRIMARY KEY ("missionCode", "year");

-- 2. local_missions.code
ALTER TABLE "local_missions" ALTER COLUMN "code" TYPE TEXT USING "code"::text;

-- 3. complaints.missionCode (nullable — drop & recreate is fine, no data loss on null column)
ALTER TABLE "complaints" ALTER COLUMN "missionCode" TYPE TEXT USING "missionCode"::text;

-- 4. audit_logs.actorMissionCode (nullable — safe)
ALTER TABLE "audit_logs" ALTER COLUMN "actorMissionCode" TYPE TEXT USING "actorMissionCode"::text;

-- 5. Drop the PostgreSQL enum type now that no column references it
DROP TYPE IF EXISTS "LocalMissionCode";
