# Task List — 1000MMBD Portal

Last updated: 2026-10-15

> **Session backlog added 2026-06-26** — items #28–#49 below
> **Session backlog added 2026-06-27 (session 2)** — items #51–#55 below
> **Session backlog added 2026-06-27 (session 3)** — items #57–#73 below; #56 fixed; #38 #41 #43 #45 #47 #57 #58 #59 completed
> **Session backlog added 2026-06-28** — items #74–#98 below
> **Session backlog added 2026-07-02** — item #99 below
> **Session backlog added 2026-10-12** — items #107–#113 below
> **Session backlog added 2026-10-13** — items #115–#117 below
> **Session backlog added 2026-10-15** — items #118–#120 below

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

## 🔵 P5 — New Major Feature (2026-07-02 backlog)

- [x] **#99** Contact Messages — website `/contact` form now saves to `ContactMessage` table via `/api/contact` (done 2026-07-02). Admin view added 2026-07-11: `dashboard/system-admin/contact-messages` list page (SA/UD/Secretary/Assoc. Director) with Inbox/Handled/Spam tabs, mark-as-handled/spam actions (`actions/contactMessages.ts`, audit-logged), soft delete (SA only), sidebar link. Reply is a mailto: link for now — in-app reply still requires an outbound email provider (e.g. Resend); tracked as follow-up below.
- [x] **#101** Website slider: portal-uploaded project images 404'd because `/api/uploads/…` paths are portal-relative. Fixed 2026-07-11: `lib/portal.ts` `resolveProjectImages()` prefixes them with `NEXT_PUBLIC_PORTAL_URL` in all 3 fetch sites; website next.config adds portal `remotePatterns` + `dangerouslyAllowLocalIP` (localhost portal only). Note: dev website `.env` has `NEXT_PUBLIC_PORTAL_URL` commented out, so dev shows fallback projects unless it's set.
- [x] **#102** Bio-data/application print: photo missing. Fixed 2026-07-11: photo URLs were `${NEXT_PUBLIC_APP_URL}/uploads/…` (wrong origin when env set; static public/ serving breaks in prod) — now relative `/api/uploads/…` in bio-data, LMD+Director print pages, LMD application page, pdf-data route; both `PrintControls` now wait for images to load (4s cap) before auto-`window.print()` instead of a fixed 500ms.
- [x] **#103** Bio Data form — District Pastor Details section on page 4 (Name*, Mobile*, Email optional; stored in `formData` JSON; shown on director/LMD review + print pages and Bio Data PDF; validated in `page4Schema`) (2026-07-12).
- [x] **#104** Email change — (a) self-service on profile: requires current password, sends verification link to the NEW address (`EmailVerificationToken.newEmail`, 1h expiry), change applies only on confirm via `/verify-email`; (b) SA override on user detail page for locked-out users: immediate change, marks verified, invalidates outstanding tokens. Both audited as `USER_EMAIL_CHANGED` with from/to (2026-07-12).
- [x] **#105** Projects page redesign (2026-07-12, per user brief: editorial rows; photos/goal/impact/donate emphasized; status+tag filters; share buttons). Listing: new `ProjectsEditorial` component (alternating photo/story rows, stat chips, highlight callout, Donate + share per project, client-side status/tag filters). Detail: impact stat band (participants/goal/budget), `ShareButtons` (FB/WhatsApp/copy-link) in donate card, typography moved to site fonts. SA admin: status/draft filter tabs with counts, "View Live Page" + per-project "View on site" preview links. Homepage slider intentionally unchanged.
- [x] **#106** Certificate system rework (2026-07-13). New blank official template at `apps/portal/public/certificates/template.pdf` (border+logos only). `lib/certificates/templateOverlay.ts` now draws the WHOLE certificate — heading, `{batch} BATCH`, motto, `CERTIFICATE of Completion`, recipient name, word-wrapped justified body with inline program dates, two signature blocks (rule + name + fixed title), date of issue — plus QR + reference. Positions live in `LAYOUT` (fractions), tuned via a Poppler render loop (`pdftoppm`, installed via winget for dev). Configurable signatories: `dashboard/settings/certificate` (SA) sets director/president names + uploads signature PNGs → `cert.*` settings; `CERT_DEFAULTS` fallback; `saveCertificateConfigAction`; linked from Settings sub-page cards. Certificate route reads config + signature files and passes to overlay; `getStringSetting` helper added. Reissue button on trainee detail (`?reissue=1` re-stamps `certificateIssuedAt`, audited `CERTIFICATE_GENERATED` with `reissued:true`). PDF metadata title overwritten so the browser tab no longer shows the template author's name. Falls back to built-in `CertificatePdf` if template missing.
- [x] **#100** Contact Messages — in-app reply from dashboard (done 2026-07-11). Reply form on `dashboard/system-admin/contact-messages` sends via Resend from `info@1000mm.org.bd` (`CONTACT_REPLY_FROM_EMAIL` env override) using `ContactReply` React Email template; reply stored on `ContactMessage` (`replyBody`/`repliedAt`/`repliedById` via db push), marks handled, audit-logged as `CONTACT_MESSAGE_REPLIED`; "Replied" badge + sent-reply block shown on card. Note: `1000mm.org.bd` must be a verified domain in the Resend account or sends will fail with a clear error.

---

## 🔵 P5 — New Major Feature (2026-10-12 backlog)

- [x] **#107** Program roster — staff can add trainees to a program manually. Acceptance only sets `Application.status = ACCEPTED`; it creates no `ProgramEnrollment`, so a window that was run and reviewed offline left the program reading 0 enrolled and nothing could be printed. New `actions/programRoster.ts` + `RosterPanel` on the program page: one-click "add all accepted applicants from this program's windows", a scoped searchable picker (this program's accepted / all accepted / any trainee account) with multi-select, and soft-delete removal that revives the same row on re-add rather than tripping `@@unique([programId, traineeId])`. The one-live-program-at-a-time rule still holds by default with a per-batch override; skips are reported with reasons. Two additive `AuditAction` values (`TRAINEE_ENROLLED_MANUALLY`, `TRAINEE_REMOVED_FROM_PROGRAM`) — audit writes are try/catch'd so a code-before-`db push` deploy can't block enrollment (2026-10-12).
- [x] **#108** ID cards keyed off `application: { status: ACCEPTED }` on the enrollment. Since `applicationId` is `@unique`, a manually placed trainee can have no application linked and would print nothing — now keyed off roster membership (`status: ENROLLED`) in `api/id-cards/route.ts`, `api/id-cards/trainees/route.ts` and `dashboard/id-cards/page.tsx`, with the mission filter taken from the trainee's home mission. Program list + detail counts now exclude `APPLIED` rows, which are intents rather than places (2026-10-12).
- [x] **#109** SA dashboard "Applications by mission" showed nothing. The panel was fed a `user.groupBy` on `isMissionary: true` — a flag the deployment workflow sets later, so it is 0 across the board on a fresh production DB. Now groups `application` by `submittedFromMissionId`, matching the panel's title (2026-10-12).
- [x] **#110** Full domain migration to `1000mmbd.org` in code — 31 references across 20 files: website contact addresses, the `NEXT_PUBLIC_PORTAL_URL` fallbacks in the certificate/ID-card QR builders, `NEXT_PUBLIC_WEBSITE_URL` fallbacks in `api/public/programs`, website NavBar/FAQ/documents/HowToJoin, the `www.` display string, and all portal sending identities. The three hardcoded senders are now env-overridable (`RESEND_INFO_FROM`, `RESEND_DONATE_FROM`, `CONTACT_REPLY_FROM_EMAIL` — the last was documented in #100 but had never been wired up), so the mail domain can be rolled back with an env edit and a restart rather than a rebuild (2026-10-12).
- [ ] **#111** Extract the API into a separate **Nest.js** application — next planned expansion. Today every server-side entry point lives inside the Next.js portal: ~`apps/portal/actions/*.ts` server actions plus `apps/portal/app/api/**` route handlers (uploads, id-cards, certificates, exports, public programs, contact, AI insights). Target shape: a standalone Nest service owning Prisma (`packages/db` already separate, so it can be shared as-is) and all business logic, with the Next apps reduced to presentation + auth session. Points to settle before starting: (a) auth — NextAuth currently issues the session and `lib/auth/helpers.ts` gates every action by role; the Nest service needs to validate the same tokens or own auth outright; (b) mission scoping — `withMissionScope` in `packages/db` is applied per-request and must move with the API, not be reimplemented; (c) file uploads — `lib/r2.ts`/`lib/uploadFile.ts` write to `process.cwd()/public/uploads` and are served via `/api/uploads/[...path]`, which couples uploads to the portal's working directory (see #113); (d) the 12 MB server-action body limit and Nginx's `client_max_body_size 20M` stop being relevant and become normal HTTP upload limits; (e) revalidation — server actions currently call `revalidatePath` directly, which a separate service cannot do, so the Next side needs explicit cache invalidation or tag-based revalidation.
- [ ] **#112** Domain cutover — infrastructure, none of which the repo controls. Code and the local `.env*` files are done (#110); every `.env*` is gitignored, so the **server copies must be edited before `pnpm build`** (`NEXT_PUBLIC_*` are baked into client JS at build time, so editing them afterwards does nothing). `AUTH_URL` must match the browser origin exactly or logins break. Outstanding:
  - **Cloudflare** — `1000mmbd.org` zone with A records `@`/`www`/`portal` to the VPS, proxied, SSL/TLS **Full (strict)** (Flexible loops against Nginx's HTTPS redirect).
  - **Nginx** — `server_name` still `1000mm.org.bd`; new host 404s or hits the default server until updated.
  - **TLS** — existing cert `1000mm.org.bd-0001` does not cover the new domain; needs `certbot --nginx -d 1000mmbd.org -d www.1000mmbd.org -d portal.1000mmbd.org`.
  - **Resend** — `1000mmbd.org` must be verified with its own SPF + `resend._domainkey`, or every send fails (verification, password reset, contact replies, bulk email). Keep the old domain's records live through the cutover; duplicate SPF records are a hard permerror, so the old SPF must be removed rather than left alongside once the move is final.
  - `1000mm.org.bd` is **retired** (confirmed 2026-10-12), so the clean replacement in #110 is correct and no dual-domain handling is needed. One consequence to weigh: `/verify` QR codes are built from `NEXT_PUBLIC_PORTAL_URL` at generation time, so any **already-printed** certificate or ID card carries `https://portal.1000mm.org.bd/verify/...` and goes dead once that host stops resolving. Re-downloaded PDFs regenerate with the new domain; physical copies cannot. Keeping `portal.1000mm.org.bd` alive as a 301 to the new host — at least for `/verify/*` — preserves them at no cost.
  - `DEPLOY.md` still documents the old cPanel flow *and* the old domain throughout (URLs, `AUTH_URL`, `NEXT_PUBLIC_*`, verification steps). It is wrong on both counts and should be rewritten against the VPS flow rather than patched.
- [x] **#113** Uploads lost after a deploy — fixed 2026-10-12. `public/uploads` in the standalone bundle is a symlink to `/var/www/1000mm-uploads` that `next build` destroys on every deploy, orphaning every uploaded file. Two traps found while fixing it: `ln -sfn` places the link *inside* an existing real directory instead of replacing it (so uploads got served from `/api/uploads/1000mm-uploads/...`), and 38 files under `apps/portal/public/uploads/` were still **tracked in git** despite the `.gitignore` entry — added after they were committed, so every pull recreated them exactly where the symlink belongs. Those are now untracked (`git rm -r --cached`, files left on disk).
- [x] **#114** `scripts/1000mm-deploy.sh` checked into the repo (2026-10-12). The previous deploy script existed only at `/usr/local/bin/1000mm-deploy` on the VPS and was lost in the rebuild, which is why three deploys in a row were hand-typed and why #113 happened. Install with `sudo ln -sfn /srv/1000mm/scripts/1000mm-deploy.sh /usr/local/bin/1000mm-deploy` — a symlink, so the repo stays the source of truth. It rescues any uploads sitting in the working tree or bundle into the store *before* pulling (needed exactly once, now that those 38 files are untracked and a pull deletes them), prints the `AUTH_URL`/`NEXT_PUBLIC_*` values for confirmation *before* building since they are baked into client JS, pushes the schema, builds each app separately (both at once has been OOM-killed on this box), syncs `public/` and `static/` into the bundles, forces the uploads symlink with `rm -rf` + `ln -s`, restarts, and health-checks both origins plus an actual upload fetch. Preflight refuses to start unless the repo, toolchain, uploads store, both `.env.production` files and both systemd units are present, so a half-applied deploy is not a possible outcome. Flags: `-y`, `--skip-build`, `--no-restart`.

---

- [x] **#115** ID cards never carried the applicant's photo — the card rendered a hard-coded placeholder (person icon + the word `PHOTO`) and the route never queried one. Now pulled from the application's `PROFILE_PHOTO` document, falling back to the trainee's profile picture, read off disk rather than over `/api/uploads` (that route needs a session a server-side render does not carry, and `profile-photos` is not a public prefix). Downscaled with `sharp` to the 56x72pt box at print resolution: 248 KB -> 25 KB per photo, because embedding raw put ~250 KB per card into the PDF and a whole programme's sheet risked OOM on the 3.8 GB VPS. WebP is skipped — `@react-pdf` cannot decode it and it would throw mid-render, losing the whole sheet. `sharp` is now a declared dependency instead of an accidental transitive of `next` (2026-10-13).
- [x] **#116** Verification reworked onto unguessable tokens (2026-10-13). Two problems: `/verify` was gated by `app/proxy.ts`, so an outsider scanning a card got bounced to `/login` and the QR was decoration; and the reference number it keyed off is sequential (`{MISSION}-{YEAR}-{00001}`, four mission codes, counter from 1), so making it public as-is would have let anyone enumerate every trainee's name, mission and **deployment location** — where a missionary physically is. New `ProgramEnrollment.verifyToken` (nullable + unique, 128-bit hex, generated lazily at first print) is what the ID-card and certificate QR links now carry, and `/verify/` is public. Holding the card is the credential: the token path shows the full record including the photograph, while a lookup by reference number still resolves (so already-printed cards keep working) but withholds the photo and the deployment location and tells the visitor to scan the card for the rest. Shared helpers in `lib/verification.ts`. 22 checks against the DB covering token generation/idempotency/collisions, both resolution paths, bad input, and proxy reachability.
- [ ] **#117** `prisma db push` for #116 needs `--accept-data-loss` once, because Prisma flags any new unique constraint as potentially lossy. The actual SQL is two additive statements (`ADD COLUMN "verifyToken" TEXT` + `CREATE UNIQUE INDEX`) and Postgres allows multiple NULLs in a unique index, so there is no real data loss — but `scripts/1000mm-deploy.sh` runs plain `db push` and will **fail** on this deploy until the column exists. Apply it by hand first (see the deploy notes), then the script's push is a no-op. The flag was deliberately not added to the script, where it would let genuinely destructive changes through silently.

---

- [x] **#118** Printed ID cards carried the wrong name and the wrong face (2026-10-15, confirmed from photographs of issued cards). Two independent identity sources: `Application.applicantFullName` is the name typed on the form, reviewed by the LMD and accepted — what the application page shows — while `User.fullName` is the portal *account* name, which is what the card printed. They drift whenever an account is shared, registered under a relative's name, or simply never corrected, so `SBM-2026-00014` printed "Barned Prosanjit Banerjee" against Shiuly Roy's reference number. Same split for photographs: the application's `PROFILE_PHOTO` is the reviewed passport photo, `User.profilePicture` is a casual self-uploaded account picture, and the card fell back to the latter whenever the application had no photo document — putting a stranger's snapshot on an official ID (`SBM-2026-00004`). Cards, the ID-card picker list, the verify page and the printed roster at `/dashboard/trainees` now all take the name from `applicantFullName` and the photo from the application only, falling back to the account only when there is no application at all (hand-added trainees). Also found: the review page picked `documents.find()` (oldest photo) while the card took the newest, so on any application with more than one upload the reviewer approved one image and the card printed another — both now resolve through `profilePhotoDocumentId`, the authoritative pointer. The account-photo fallback was introduced in #115 (`168a0d9`); the name defect predates it and only became visible once cards were printed in volume.
- [ ] **#119** `scripts/audit-idcard-identity.mjs` (read-only) lists every enrollment whose printed card disagrees with its accepted application — name mismatches with both names side by side, photo fallbacks, multi-photo ambiguity, and genuinely crossed `traineeId`/`applicantId` links — and totals how many need reprinting. **Run it on production before reprinting.** Not yet run; scope of already-issued bad cards is unknown.
- [ ] **#120** ~10 export routes still print the portal account name (`attendance`, `director-missionaries`, `lmd-missionaries`, `field-reports`, `lmd-reports` …). The surfaces tied to ID cards and the trainee roster were fixed under #118; these were deliberately left, since some concern missionaries filing reports where the account name may be the correct one. Decide per route once #119 shows how many rows actually differ.

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
