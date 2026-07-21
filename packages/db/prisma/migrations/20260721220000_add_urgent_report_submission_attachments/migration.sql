-- Urgent report submission attachments (2026-07-21)
-- Run on the server:  psql -h localhost -U mmorgbd_admin_kb -d mmorgbd_1000mm -f ~/migrate-urgent-report-attachments.sql

ALTER TABLE public.urgent_report_submissions ADD COLUMN "attachment1" text;
ALTER TABLE public.urgent_report_submissions ADD COLUMN "attachment1Name" text;
ALTER TABLE public.urgent_report_submissions ADD COLUMN "attachment2" text;
ALTER TABLE public.urgent_report_submissions ADD COLUMN "attachment2Name" text;
ALTER TABLE public.urgent_report_submissions ADD COLUMN "attachment3" text;
ALTER TABLE public.urgent_report_submissions ADD COLUMN "attachment3Name" text;
