# Task List — 1000MMBD Portal

Last updated: 2026-06-28

> **Session backlog added 2026-06-26** — items #28–#49 below
> **Session backlog added 2026-06-27 (session 2)** — items #51–#55 below
> **Session backlog added 2026-06-27 (session 3)** — items #57–#73 below; #56 fixed; #38 #41 #43 #45 #47 #57 #58 #59 completed
> **Session backlog added 2026-06-28** — items #74–#98 below

---

## 🔴 P1 — Critical Bugs (core workflows broken)

- [x] **#1** `sidebar.tsx` — SA News link routes to `/dashboard/announcements`, correct path is `/dashboard/news/announcements`
- [x] **#2** `lmd/applications/_components/ExportButton.tsx` — LMD Applications export button broken (wrong route + wrong format string)
- [x] **#3** `trainees/page.tsx` — LMD Trainees list not showing (mission-scope spread overwrite + stale ACCEPTED filter)
- [ ] **#4** `DirectorActionPanel.tsx` — UD Director review action — likely fixed by Prisma client regeneration (APPLICATION_REVIEW_STARTED enum was missing). Re-test at runtime to confirm.
- [x] **#5** `system-admin/urgent-reports/new/page.tsx` — Urgent Reports broken: `redirect()` swallowed by catch block + `useRef` Rules of Hooks violation
- [x] **#6** `actions/lmdReports.ts` + `notifications/page.tsx` — Notifications: `urgent_report.issued` template missing from display + LMDs not notified when report window opens
- [x] **#7** `FlagUserForm.tsx` — fixed same `useEffect([state.ok])` bug; `UserActions.tsx` looks correct
- [x] **#8** `ProgramComponents.tsx` — Program Save Changes button: `useEffect([state.ok])` only fires once; fixed with ref-guarded state-change effect

---

## 🟠 P2 — High-Impact Bugs

- [x] **#9** `system-admin/page.tsx` — Dashboard uses hardcoded mock data; replaced with real Prisma queries
- [x] **#10** `pending-actions.tsx` — Pending Actions now use real data + correct hrefs
- [x] **#11** `sidebar.tsx` — Notification badge now pulses when `unreadCount > 0`
- [ ] **#12** Audit logs — IP shows `—` in dev (expected); in production needs reverse proxy to set `X-Forwarded-For` _(deployment config)_

---

## 🟡 P3 — Missing Features (high frequency)

- [x] **#13** LMD — Print own LMD Report (`/dashboard/lmd/reports/[reportId]`)
- [x] **#14** LMD — Trainees roster print + include prior-year batch (name, address, deployment, batch year)
- [x] **#15** LMD — Trainee assign option — LMD can now Edit existing deployment
- [x] **#16** SA + UD — Trainees list printout
- [x] **#17** SA + UD + LMD — Field Reports print
- [x] **#18** UD — Director Decision note field
- [x] **#19** UD — Applicants list printout
- [x] **#20** SA + UD — Windows: inline Open button on Program detail view

---

## 🟡 P4 — Missing Features (medium frequency)

- [x] **#21** UD — Trainees name sheet
- [x] **#22** Field Statistics — Print button + year-wise filter
- [x] **#23** Salary Requests — Print button + filters
- [x] **#24** LMD Reports — per-report print; director "Print Summary"
- [x] **#25** Missions page — Edit modal with LMD select dropdown

---

## 🔵 P5 — New Major Features

- [x] **#26** Financial Management — full schema + SA/UD/LMD pages
- [x] **#27** Communication hub
- [x] **#28** Assignments & Resources — schema, upload, CRUD across all roles

---

## 🔴 P1 — New Critical Bugs (2026-06-26 backlog)

- [x] **#29** Resources — file upload broken ("something went wrong" error)
- [x] **#30** News/Announcements — "New Announcement" broken ("something went wrong" error)
- [x] **#31** Urgent Reports — broken ("something went wrong" error)
- [ ] **#32** ID Card — generation not working (QR code fix applied in #58; re-test after dev server restart)
- [x] **#33** Audit Logs — IP address not showing, details panel not showing
- [x] **#56** `actions/programs.ts` — `editWindowAction` crashes: missing `requireRole` import

---

## 🟠 P2 — New High-Impact Features (2026-06-26 backlog)

- [x] **#34** Field Reports — add filters: year, mission, best-performance mission/missionary, performance year
- [x] **#35** Field Report Statistics — add year filter; 5-year comparison report
- [x] **#36** LMD Reports — filters: mission, year, month; top baptism/visitation missions + missionaries
- [x] **#37** Financial Management — add year filter
- [x] **#38** New Financial Entry — DONATION/OTHER types; all-mission option for SA/UD
- [x] **#39** Programs / Applicants — add filters: year, mission, session
- [x] **#40** ID Card — filters: year, mission already implemented in id-cards/page.tsx (2026-06-28 s5).
- [x] **#41** Salary Request — month filter + PDF + Excel export
- [x] **#42** Audit Logs — add year filter
- [x] **#43** Trainer Applications — year/country/name filters + invitation/recommendation letter PDF
- [x] **#44** Trainer Application form — add country field

---

## 🟡 P3 — New Medium Features (2026-06-26 backlog)

- [x] **#45** Trainees roster — Assign/Deployment button inline (expanded to SA/UD too)
- [x] **#46** Missions — add new mission option with director and name fields (SA only)
- [x] **#47** Users — "Create Trainee Account" and "Create User Account" modals (SA only)
- [x] **#48** Profile page — add password reset option
- [x] **#49** Print — added PrintButton + print header to individual field report detail page (2026-06-28 s5).

---

## 🔵 P4 — Polish (2026-06-26 backlog)

- [x] **#50** Mobile view — all data tables now have `overflow-x-auto`; non-responsive grid layouts given `sm:` breakpoints; shell hamburger drawer already existed; major list pages (trainees, applications, audit, users, missionaries, trainer-apps, urgent-reports) all scrollable on narrow screens (2026-06-29)

---

## 🟠 P2 — New High-Impact Features (2026-06-27 session 2 backlog)

- [x] **#51** Certificates — `CertificatePdf.tsx` landscape A4 PDF; `/api/certificates` (staff issues + downloads, trainee downloads own if issued); `/api/public/verify/[referenceNumber]` public JSON endpoint; `CertificateButton` on trainee detail (staff); `/dashboard/my-application/certificate` self-serve page for trainees (2026-06-29)
- [x] **#52** AI Executive Insights — `AiInsightsCard` on director dashboard calls `/api/ai/insights`; gathers 13 live metrics; calls `claude-haiku-4-5` API; Anthropic API key stored in `SystemSetting` via Settings page "API Integrations" section (2026-06-29)
- [x] **#53** Notifications — filters (daily/weekly/monthly/yearly) + clear all/clear read actions

---

## 🔵 P5 — New Features (2026-06-27 session 3 — completed this session)

- [x] **#57** Attendance Scanner — camera QR scan page at `/dashboard/attendance`; native BarcodeDetector API; manual reference lookup fallback; `/api/attendance/lookup` endpoint; sidebar for SA/UD/LMD/TRAINER
- [x] **#58** QR Code on ID Cards — replaced fake SVG barcode with real scannable QR (`qrcode` package); pre-generated as PNG data URL before PDF render
- [x] **#59** Projects DB + SA Admin + Website integration — `Project` model in Prisma; migration + seed (4 existing projects); SA admin CRUD at `/dashboard/system-admin/projects`; public API at `/api/public/projects`; website home + current-projects page now fetch from portal API with 60s ISR and hardcoded fallback

---

## 🔴 P1 — Security / Critical (2026-06-27 code review)

- [x] **#65** `app/login/LoginForm.tsx` — Open redirect fixed: `from` validated to start with `/` and not `//`.
- [x] **#66** `app/api/upload/route.ts` — File upload MIME cross-validation against extension implemented.

---

## 🟠 P2 — Bugs / High-Impact (2026-06-27 code review)

- [x] **#67** Export routes — `.take(5000)` limit added to all export routes.
- [x] **#68** `actions/salary.ts` — Salary duplicate-request race condition fixed: DB unique constraint `missionaryId_month_year` + P2002 catch on create.
- [x] **#69** `app/dashboard/salary/requests/page.tsx` — `status as any` fixed with proper `ValidStatus` enum check.

---

## 🟡 P3 — New User Features (2026-06-27 session 3 backlog)

- [x] **#60** Profile Details edit — users can edit their own full name, phone number, and bio from the profile page; SA can also change email (with uniqueness check). Add an "Edit Details" form/modal to `/dashboard/profile`.
- [x] **#61** Login page — password visibility toggle (show/hide icon inside the password field) on both login and register pages; also on the reset-password page.
- [x] **#62** Finance Filter Compact Dropdown — compact selects (mission, type, year) + Filter/Clear on all three financial pages (2026-06-28 s5).
- [x] **#63** LMD Reports Filter Compact Dropdown + Sort — compact dropdowns + sort by Baptisms/Reached/Visits added (2026-06-28).
- [x] **#70** Salary Assignment Delete — LMDs have no way to undo a salary assignment made by mistake. Add a "Remove Assignment" action on salary assignment records (LMD only, before the window closes).

---

## 🔵 P4 — New Major Feature (2026-06-27 session 3 backlog)

- [x] **#64** Payment Approve → Invoice PDF Skeleton — approved salary requests now show a Download Invoice button; generates PDF with org header, payee, amount, period, reference, 3 signature lines. Added `SALARY_INVOICE_GENERATED` audit action (2026-06-28 s5).

---

## 🔵 P5 — Tech Debt / Polish (2026-06-27 code review)

- [x] **#71** Centralize auth role helpers — added `requireDbUser(roles)` and `requireAuthenticatedDbUser()` to `lib/auth/helpers.ts`; updated `salary.ts`, `director.ts`, `lmd.ts`, `lmdReports.ts`, `programs.ts` to use them (2026-06-28 s5).
- [x] **#72** Financial zero state UX — balance cards show `—` when count is 0; net balance shows "No entries yet" when empty.
- [x] **#73** Schema indexes — added `@@index` on `SalaryRequest.missionId`, `.missionaryId`, `.reviewedById`, `.status`, `.year_month`; migrated (2026-06-28 s5).

---

## 🔴 P1 — Critical Bugs (2026-06-28 backlog)

- [x] **#74** BioDataPDF — JSON.parse guard + Array.isArray check already in place.
- [x] **#75** Application print page — route exists at correct path.
- [x] **#76** SA Urgent Report new page — `"use client"` already in place, no event handler server/client boundary issue.

---

## 🟠 P2 — High-Impact Features (2026-06-28 backlog)

- [x] **#77** SA/UD: Attendance — `AttendanceScan` model + migration; `/dashboard/system-admin/attendance` records page with filters; PDF export (landscape A4, dual-logo); Excel export (2 sheets: records + mission summary); `AttendanceExportButton` client dropdown; sidebar link (2026-06-29)
- [x] **#78** SA/UD + LMD + Trainee: Field Reports — Immersion Report pages implemented for all roles.
- [x] **#79** SA/UD: LMD Reports — filters (monthly/quarterly/yearly/mission) + top baptism/visits missionaries added; compact dropdowns + sort added in #63.
- [x] **#80** SA/UD: Field Report Statistics — top missionaries ranking (Visits, Reached, Baptisms) added.
- [x] **#81** LMD: Field Reports — year/month filters and immersion report page implemented.

---

## 🟡 P3 — Medium Features (2026-06-28 backlog)

- [x] **#82** Print Metadata — added global PrintFooter to dashboard-shell (printed by user name + role + timestamp, updates on beforeprint); visible on all printed pages (2026-06-28 s5).
- [x] **#83** LMD: Reports — year + month filters added.
- [x] **#84** LMD: Applications — year, programs, gender, district filters added.
- [x] **#85** LMD: Attendance — SA-controlled toggle implemented in system settings.
- [x] **#86** LMD: Field Report Statistics — top performers section added.
- [x] **#87** LMD: My Reports — month/year filters + top stats + print option added.
- [x] **#88** LMD: Missionary Deployment & Salary — year filter added.
- [x] **#89** LMD: Financial — year/month filters + print metadata added.
- [x] **#90** LMD: Missionaries Name List — page implemented with filters and print.
- [x] **#91** Trainee: Field Reports — month/year filters + print + immersion report added.
- [x] **#92** Trainee: Mission Report / Statistics — statistics page implemented.
- [x] **#93** SA/UD: Programs / Training Programs — filters + print with serial numbers added.
- [x] **#94** SA: Trainees Roster — gender filter + print with metadata added.
- [x] **#95** SA/UD: Salary Requests — print output with heading, logo, metadata added.
- [x] **#96** SA: Trainer Applications — filters + print with heading and logo added.
- [x] **#97** SA: Trainer Applications — Official Letters: added edit option (collapsible textarea + 4 doc fields for invitation); custom body saved to DB; letter API uses custom body if set; "Customized" indicator shown; migrated `invitationLetterBody`, `recommendationLetterBody`, `requiredDoc1-4` fields (2026-06-28 s5).
- [x] **#98** Website: Projects — added `goal`, `participants`, `highlight` fields to `Project` model (migration); `ProjectForm` image uploader (`/api/upload`); `ProjectCard` shows thumbnail + goal + highlight + participants; `/api/public/projects` updated; `EditProjectButton` type updated (2026-06-29)

---

## ✅ Completed

- **#1** SA News sidebar link (2026-06-26)
- **#2** LMD Applications export button (2026-06-26)
- **#3** LMD Trainees list not showing (2026-06-26)
- **#5** Urgent Reports new page broken (2026-06-26)
- **#6** LMD report window notifications + urgent_report template (2026-06-26)
- **#7** FlagUserForm useEffect dep bug (2026-06-26)
- **#8** Program Save Changes button (2026-06-26)
- **#9 + #10** SA Dashboard real Prisma queries + real pending action links (2026-06-26)
- **#11** Notification badge pulse animation (2026-06-26)
- **#12** IP in dev expected (deployment config, not a code bug)
- **#13** LMD print own LMD Report (2026-06-26)
- **#14** Trainees roster print (2026-06-26)
- **#15** LMD Trainee assign/edit deployment (2026-06-26)
- **#16** SA+UD Trainees list printout (2026-06-26)
- **#17** Field Reports print (2026-06-26)
- **#18** Director Decision note field (2026-06-26)
- **#19** Applicants list printout (2026-06-26)
- **#20** Windows Open button on Program detail (2026-06-26)
- **#21** Trainees name sheet (2026-06-26)
- **#22** Field Statistics print + year filter (2026-06-26)
- **#23** Salary Requests print + filters (2026-06-26)
- **#24** LMD Reports print (2026-06-26)
- **#25** Missions edit modal with LMD select (2026-06-26)
- **#26** Financial Management schema + pages (2026-06-26)
- **#27** Communication hub (2026-06-26)
- **#28** Assignments & Resources (2026-06-26)
- **#36** LMD Reports filters (missions/year/period/top performers) (2026-06-27 s2)
- **#38** Financial Entry DONATION/OTHER types + all-mission option (2026-06-27 s2)
- **#41** Salary Request month filter + PDF/Excel export (2026-06-27 s2)
- **#43** Trainer Applications filters + invitation/recommendation letter PDFs (2026-06-27 s2)
- **#45** Trainees deployment button expanded to SA/UD (2026-06-27 s2)
- **#47** Create Trainee Account + Create User Account modals (2026-06-27 s2)
- **#56** editWindowAction missing requireRole import (2026-06-27 s2)
- **#57** Attendance Scanner (2026-06-27 s3)
- **#58** QR Code on ID Cards (2026-06-27 s3)
- **#59** Projects DB + SA Admin + Website integration (2026-06-27 s3)
- **#29 #30 #31** Resources / Announcements / Urgent Reports broken (2026-06-28 s4)
- **#33** Audit Logs details panel + IP column (2026-06-28 s4 — already done)
- **#34** Field Reports year/mission/top-performer filters (2026-06-28 s4 — already done)
- **#35** Field Report Statistics year filter (2026-06-28 s4 — already done)
- **#37** Financial Management year filter (2026-06-28 s4 — already done)
- **#39** Programs/Applicants year/mission/session filters (2026-06-28 s4 — already done)
- **#42** Audit Logs year filter (2026-06-28 s4 — already done)
- **#44** Trainer Application country field (2026-06-28 s4 — already done)
- **#46** Add Mission modal (SA only) (2026-06-28 s4 — already done)
- **#48** Profile password reset (2026-06-28 s4 — already done)
- **#53** Notifications clear all/clear read + filters (2026-06-28 s4 — already done)
- **#60** Profile Details edit (2026-06-28 s4 — already done)
- **#61** Password visibility toggle on login/register/reset-password (2026-06-28 s4)
- **#63** LMD Reports compact dropdowns + sort (2026-06-28 s5)
- **#65** Open redirect fix in loginAction (2026-06-28 s4 — already done)
- **#66** File upload MIME cross-validation (2026-06-28 s4 — already done)
- **#67** Export routes .take(5000) limit (2026-06-28 s4 — already done)
- **#68** Salary duplicate race condition fixed (unique constraint + P2002 catch) (2026-06-28 s4 — already done)
- **#69** Salary requests status as any fixed (2026-06-28 s4 — already done)
- **#70** Salary Assignment Delete (LMD) (2026-06-28 s4 — already done)
- **#72** Financial zero state UX (2026-06-28 s4 — already done)
- **#74** BioDataPDF educationEntries guard (2026-06-28 s4 — already done)
- **#75** Application print route (2026-06-28 s4 — already done)
- **#76** SA Urgent Report "use client" fix (2026-06-28 s4 — already done)
- **#78** Immersion Report pages (SA/UD, LMD, Trainee) (2026-06-28 s4 — already done)
- **#79** SA/UD LMD Reports filters + top missionaries (2026-06-28 s4 — already done)
- **#80** SA/UD Field Report Statistics top missionaries (2026-06-28 s4 — already done)
- **#81** LMD Field Reports year/month filters + immersion page (2026-06-28 s4 — already done)
- **#83** LMD Reports year/month filters (2026-06-28 s4 — already done)
- **#84** LMD Applications filters (year/program/gender/district) (2026-06-28 s4 — already done)
- **#85–#96** LMD/Trainee/SA filters, statistics pages, print outputs (2026-06-27/28 — already done)
