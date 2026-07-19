-- Certificate revocation support (2026-07-19)
-- Run on the server:  psql -h localhost -U mmorgbd_admin_kb -d mmorgbd_1000mm -f ~/migrate-cert-revoke.sql
-- NOTE: do NOT pass -1/--single-transaction: ALTER TYPE ... ADD VALUE cannot
-- run inside a transaction on PostgreSQL 10.

ALTER TABLE public.program_enrollments ADD COLUMN "certificateRevokedAt" timestamp(3) without time zone;
ALTER TABLE public.program_enrollments ADD COLUMN "certificateRevokeReason" text;

ALTER TYPE public."AuditAction" ADD VALUE 'CERTIFICATE_REVOKED';
ALTER TYPE public."AuditAction" ADD VALUE 'CERTIFICATE_RESTORED';
