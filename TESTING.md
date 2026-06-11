# 1000MM Platform Testing Guide

## Purpose
This guide explains how to initialize the local database, run the seed script, and verify major portal workflows for the 1000MM training platform.

## Seed setup
1. Confirm your `.env` file contains a valid `DATABASE_URL`.
2. From the repository root, run:

```bash
pnpm --filter @1000mm/db db:seed
```

If you need to apply schema changes first, run:

```bash
pnpm --filter @1000mm/db db:push
```

or, for development migrations:

```bash
pnpm --filter @1000mm/db db:migrate
```

## What the seed creates
- 4 local missions: `EBM`, `NBM`, `SBM`, `WBM`
- 1 system admin
- 1 main director
- 4 local mission directors (LMDs)
- 2 trainers
- 4 trainees
- 5 training programs and 5 application windows
- multiple applications across statuses
- notifications, complaints, announcements, donations, and field reports
- system settings required for login and application flows

## Login credentials
Use the following seeded credentials in the portal app.

- Admin: `admin@1000mm.local`
  - Password: `ChangeMe!Now`
- Director: `director@1000mm.local`
  - Password: `DirectorPass!2026`
- LMDs:
  - `lmd.ebm@1000mm.local`
  - `lmd.nbm@1000mm.local`
  - `lmd.sbm@1000mm.local`
  - `lmd.wbm@1000mm.local`
  - Password: `LmdPass!2026`
- Trainers:
  - `trainer1@1000mm.local`
  - `trainer2@1000mm.local`
  - Password: `Trainer!2026`
- Trainees:
  - `trainee1@1000mm.local`
  - `trainee2@1000mm.local`
  - `trainee3@1000mm.local`
  - `trainee4@1000mm.local`
  - Password: `Trainee!2026`

## Manual testing checklist

### Authentication
- Login as each seeded role and verify access to the dashboard.
- Confirm the portal redirects to the appropriate dashboard route.
- Confirm session and logout behavior.

### Navigation
- Verify the dashboard sidebar loads for each role.
- Confirm menu items correspond to role permissions.
- Test the mobile sidebar toggle and overlay on small screens.

### Application workflow
- Verify seeded applications appear in the program and review pages.
- Confirm application status counts across `SUBMITTED`, `UNDER_LMD_REVIEW`, `RECOMMENDED`, `ACCEPTED`, and `REJECTED`.
- Confirm accepted applications create program enrollments.

### Notifications and announcements
- Check unread notification badges.
- Confirm seeded announcements appear in the news or announcements area.

### Complaints and reports
- Verify seeded complaints are visible to appropriate roles.
- Confirm field reports appear in the trainee/trainer workflow.

### Donations
- Confirm donation records can be viewed or exported if donation pages exist.
- Test status filtering for `PENDING` and `COMPLETED` donations.

## Reporting issues
When reporting testing results, include:
- logged-in role (admin/director/LMD/trainer/trainee)
- page URL and user flow attempted
- expected behavior vs actual behavior
- any error messages or layout issues
- if relevant, the seeded data used (program code, application reference, notification title)

## Notes
- The database seed is idempotent and can be re-run safely.
- If you change the schema, run `pnpm --filter @1000mm/db db:push` before seeding.
- Use `pnpm --filter @1000mm/db db:studio` to inspect records visually.
