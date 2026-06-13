-- CreateEnum
CREATE TYPE "LocalMissionCode" AS ENUM ('EBM', 'NBM', 'SBM', 'WBM');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TRAINEE', 'TRAINER', 'LOCAL_DIRECTOR', 'MAIN_DIRECTOR', 'SYSTEM_ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "Denomination" AS ENUM ('SEVENTH_DAY_ADVENTIST', 'BAPTIST', 'CATHOLIC', 'METHODIST', 'PRESBYTERIAN', 'PENTECOSTAL', 'ANGLICAN', 'LUTHERAN', 'ORTHODOX', 'OTHER');

-- CreateEnum
CREATE TYPE "Religion" AS ENUM ('CHRISTIANITY', 'ISLAM', 'HINDUISM', 'BUDDHISM', 'JUDAISM', 'OTHER');

-- CreateEnum
CREATE TYPE "TrainingCategory" AS ENUM ('SPIRITUAL', 'PHYSICAL', 'MENTAL', 'SOCIAL');

-- CreateEnum
CREATE TYPE "ApplicationWindowState" AS ENUM ('DRAFT', 'ADVERTISING', 'OPEN', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_LMD_REVIEW', 'RETURNED_TO_APPLICANT', 'RECOMMENDED', 'UNDER_MAIN_DIRECTOR_REVIEW', 'RETURNED_TO_LMD', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('BIO_DATA_PDF', 'PROFILE_PHOTO', 'FATHER_NID', 'MOTHER_NID', 'EDUCATION_CERTIFICATE', 'DISTRICT_PASTOR_RECOMMENDATION', 'NID', 'BIRTH_CERTIFICATE', 'PARENT_PASSPORT_PHOTO', 'BAPTISM_CERTIFICATE', 'PARENTS_CONSENT', 'LETTER_OF_INTENT', 'RECOMMENDATION_LETTER', 'SWORN_STATEMENT', 'EXCOM_VOTE_COPY', 'ID_CARD', 'CERTIFICATE', 'SUPPORTING_DOCUMENT');

-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('GRIEVANCE', 'SUGGESTION', 'GENERAL_FEEDBACK');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('STRIPE', 'PAYPAL', 'SSLCOMMERZ', 'BKASH');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('AUTH_LOGIN_SUCCESS', 'AUTH_LOGIN_FAILED', 'AUTH_LOGOUT', 'AUTH_PASSWORD_RESET_REQUESTED', 'AUTH_PASSWORD_CHANGED', 'USER_CREATED', 'USER_ROLE_CHANGED', 'USER_MISSION_CHANGED', 'USER_DEACTIVATED', 'USER_REACTIVATED', 'APPLICATION_SUBMITTED', 'APPLICATION_REVIEW_STARTED', 'APPLICATION_RETURNED_TO_APPLICANT', 'APPLICATION_RECOMMENDED', 'APPLICATION_RETURNED_TO_LMD', 'APPLICATION_ACCEPTED', 'APPLICATION_REJECTED', 'APPLICATION_WITHDRAWN', 'DOCUMENT_DOWNLOADED', 'DOCUMENT_UPLOADED', 'DOCUMENT_DELETED', 'WINDOW_CREATED', 'WINDOW_OPENED', 'WINDOW_CLOSED', 'WINDOW_EDITED', 'FIELD_REPORT_SUBMITTED', 'COMPLAINT_SUBMITTED', 'ID_CARDS_GENERATED', 'CERTIFICATE_GENERATED', 'DONATION_INITIATED', 'DONATION_COMPLETED', 'DONATION_REFUNDED');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'NOTICE', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'IN_APP');

-- CreateTable
CREATE TABLE "application_counters" (
    "missionCode" "LocalMissionCode" NOT NULL,
    "year" INTEGER NOT NULL,
    "lastSerial" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "application_counters_pkey" PRIMARY KEY ("missionCode","year")
);

-- CreateTable
CREATE TABLE "local_missions" (
    "id" TEXT NOT NULL,
    "code" "LocalMissionCode" NOT NULL,
    "name" TEXT NOT NULL,
    "nameBangla" TEXT NOT NULL,
    "description" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "directorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "local_missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "fullNameBangla" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "role" "UserRole" NOT NULL DEFAULT 'TRAINEE',
    "homeMissionId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_programs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleBangla" TEXT,
    "category" "TrainingCategory" NOT NULL,
    "summary" TEXT,
    "summaryBangla" TEXT,
    "payloadContentId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "locationBangla" TEXT,
    "targetIntake" INTEGER NOT NULL,
    "maxIntake" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "training_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_enrollments" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "applicationId" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attendanceConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "certificateIssued" BOOLEAN NOT NULL DEFAULT false,
    "certificateIssuedAt" TIMESTAMP(3),
    "deploymentLocation" TEXT,
    "deploymentLatitude" DOUBLE PRECISION,
    "deploymentLongitude" DOUBLE PRECISION,
    "deploymentAssignedAt" TIMESTAMP(3),
    "deploymentAssignedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "program_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_windows" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "scopedToMissionId" TEXT,
    "state" "ApplicationWindowState" NOT NULL DEFAULT 'DRAFT',
    "advertisingStartDate" TIMESTAMP(3) NOT NULL,
    "applicationOpenDate" TIMESTAMP(3) NOT NULL,
    "applicationCloseDate" TIMESTAMP(3) NOT NULL,
    "trainingStartDate" TIMESTAMP(3) NOT NULL,
    "targetIntake" INTEGER NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "application_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "applicantId" TEXT NOT NULL,
    "windowId" TEXT NOT NULL,
    "submittedFromMissionId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "lastTransitionAt" TIMESTAMP(3),
    "applicantFullName" TEXT NOT NULL,
    "applicantFullNameBangla" TEXT,
    "applicantDateOfBirth" TIMESTAMP(3) NOT NULL,
    "applicantAge" INTEGER NOT NULL,
    "applicantGender" "Gender" NOT NULL,
    "applicantBloodType" "BloodType",
    "applicantMaritalStatus" "MaritalStatus",
    "applicantDenomination" "Denomination",
    "applicantMobileNo" TEXT,
    "applicantEmail" TEXT,
    "applicantPlaceOfBirth" TEXT,
    "applicantHeight" DOUBLE PRECISION,
    "applicantWeight" DOUBLE PRECISION,
    "applicantChurchName" TEXT,
    "applicantDateOfBaptism" TIMESTAMP(3),
    "applicantWorkplace" TEXT,
    "presentAddressDistrict" TEXT,
    "presentAddressUpazila" TEXT,
    "presentAddressPostOffice" TEXT,
    "presentAddressVillage" TEXT,
    "permanentAddressDistrict" TEXT,
    "permanentAddressUpazila" TEXT,
    "permanentAddressPostOffice" TEXT,
    "permanentAddressVillage" TEXT,
    "permanentSameAsPresent" BOOLEAN NOT NULL DEFAULT false,
    "profilePhotoDocumentId" TEXT,
    "fatherName" TEXT,
    "fatherAge" INTEGER,
    "fatherReligion" "Religion",
    "fatherChurchName" TEXT,
    "motherName" TEXT,
    "motherAge" INTEGER,
    "motherReligion" "Religion",
    "motherChurchName" TEXT,
    "familyMobileNo" TEXT,
    "familyEmail" TEXT,
    "formData" JSONB NOT NULL,
    "formVersion" INTEGER NOT NULL DEFAULT 1,
    "lmdReviewerId" TEXT,
    "lmdReviewStartedAt" TIMESTAMP(3),
    "lmdReviewCompletedAt" TIMESTAMP(3),
    "lmdReviewerComment" TEXT,
    "directorReviewerId" TEXT,
    "directorReviewStartedAt" TIMESTAMP(3),
    "directorReviewCompletedAt" TIMESTAMP(3),
    "directorReviewerComment" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_history" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" "ApplicationStatus",
    "toStatus" "ApplicationStatus" NOT NULL,
    "triggeredById" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "recommenderId" TEXT NOT NULL,
    "writtenComment" TEXT,
    "recommendedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_documents" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "checksum" TEXT,
    "formVersion" INTEGER,
    "educationEntryIndex" INTEGER,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_reports" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "reportMonth" INTEGER NOT NULL,
    "reportYear" INTEGER NOT NULL,
    "activitiesSummary" TEXT NOT NULL,
    "peopleReached" INTEGER,
    "challengesFaced" TEXT,
    "prayerRequests" TEXT,
    "attachments" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "category" "ComplaintCategory" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "submittedById" TEXT,
    "missionCode" "LocalMissionCode",
    "missionId" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "donorName" TEXT,
    "donorEmail" TEXT,
    "donorPhone" TEXT,
    "donorMessage" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "gateway" "PaymentGateway" NOT NULL,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "gatewayTransactionId" TEXT,
    "gatewayResponsePayload" JSONB,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "receiptNumber" TEXT,
    "receiptSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "actorId" TEXT,
    "actorRole" "UserRole",
    "actorMissionCode" "LocalMissionCode",
    "targetType" TEXT,
    "targetId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "templateKey" TEXT NOT NULL,
    "templateData" JSONB,
    "emailMessageId" TEXT,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "readAt" TIMESTAMP(3),
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "ipAddress" TEXT,
    "isSpam" BOOLEAN NOT NULL DEFAULT false,
    "isHandled" BOOLEAN NOT NULL DEFAULT false,
    "handledAt" TIMESTAMP(3),
    "handledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "_ProgramTrainers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProgramTrainers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "local_missions_code_key" ON "local_missions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "local_missions_directorId_key" ON "local_missions"("directorId");

-- CreateIndex
CREATE INDEX "local_missions_code_idx" ON "local_missions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_homeMissionId_idx" ON "users"("homeMissionId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "announcements_publishedAt_idx" ON "announcements"("publishedAt");

-- CreateIndex
CREATE INDEX "announcements_expiresAt_idx" ON "announcements"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "training_programs_code_key" ON "training_programs"("code");

-- CreateIndex
CREATE INDEX "training_programs_category_idx" ON "training_programs"("category");

-- CreateIndex
CREATE INDEX "training_programs_startDate_idx" ON "training_programs"("startDate");

-- CreateIndex
CREATE INDEX "training_programs_code_idx" ON "training_programs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "program_enrollments_applicationId_key" ON "program_enrollments"("applicationId");

-- CreateIndex
CREATE INDEX "program_enrollments_programId_idx" ON "program_enrollments"("programId");

-- CreateIndex
CREATE INDEX "program_enrollments_traineeId_idx" ON "program_enrollments"("traineeId");

-- CreateIndex
CREATE INDEX "program_enrollments_deploymentLocation_idx" ON "program_enrollments"("deploymentLocation");

-- CreateIndex
CREATE UNIQUE INDEX "program_enrollments_programId_traineeId_key" ON "program_enrollments"("programId", "traineeId");

-- CreateIndex
CREATE INDEX "application_windows_programId_idx" ON "application_windows"("programId");

-- CreateIndex
CREATE INDEX "application_windows_state_idx" ON "application_windows"("state");

-- CreateIndex
CREATE INDEX "application_windows_scopedToMissionId_idx" ON "application_windows"("scopedToMissionId");

-- CreateIndex
CREATE UNIQUE INDEX "applications_referenceNumber_key" ON "applications"("referenceNumber");

-- CreateIndex
CREATE INDEX "applications_applicantId_idx" ON "applications"("applicantId");

-- CreateIndex
CREATE INDEX "applications_windowId_idx" ON "applications"("windowId");

-- CreateIndex
CREATE INDEX "applications_submittedFromMissionId_idx" ON "applications"("submittedFromMissionId");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE INDEX "applications_submittedAt_idx" ON "applications"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "applications_applicantId_windowId_key" ON "applications"("applicantId", "windowId");

-- CreateIndex
CREATE INDEX "application_status_history_applicationId_idx" ON "application_status_history"("applicationId");

-- CreateIndex
CREATE INDEX "application_status_history_createdAt_idx" ON "application_status_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "recommendations_applicationId_key" ON "recommendations"("applicationId");

-- CreateIndex
CREATE INDEX "recommendations_recommenderId_idx" ON "recommendations"("recommenderId");

-- CreateIndex
CREATE INDEX "application_documents_applicationId_idx" ON "application_documents"("applicationId");

-- CreateIndex
CREATE INDEX "application_documents_kind_idx" ON "application_documents"("kind");

-- CreateIndex
CREATE INDEX "field_reports_traineeId_idx" ON "field_reports"("traineeId");

-- CreateIndex
CREATE INDEX "field_reports_programId_idx" ON "field_reports"("programId");

-- CreateIndex
CREATE INDEX "field_reports_reportYear_reportMonth_idx" ON "field_reports"("reportYear", "reportMonth");

-- CreateIndex
CREATE UNIQUE INDEX "field_reports_traineeId_reportMonth_reportYear_key" ON "field_reports"("traineeId", "reportMonth", "reportYear");

-- CreateIndex
CREATE INDEX "complaints_missionCode_idx" ON "complaints"("missionCode");

-- CreateIndex
CREATE INDEX "complaints_isResolved_idx" ON "complaints"("isResolved");

-- CreateIndex
CREATE INDEX "complaints_category_idx" ON "complaints"("category");

-- CreateIndex
CREATE INDEX "complaints_createdAt_idx" ON "complaints"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "donations_receiptNumber_key" ON "donations"("receiptNumber");

-- CreateIndex
CREATE INDEX "donations_gateway_idx" ON "donations"("gateway");

-- CreateIndex
CREATE INDEX "donations_status_idx" ON "donations"("status");

-- CreateIndex
CREATE INDEX "donations_completedAt_idx" ON "donations"("completedAt");

-- CreateIndex
CREATE INDEX "donations_donorEmail_idx" ON "donations"("donorEmail");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_channel_idx" ON "notifications"("channel");

-- CreateIndex
CREATE INDEX "notifications_sentAt_idx" ON "notifications"("sentAt");

-- CreateIndex
CREATE INDEX "notifications_readAt_idx" ON "notifications"("readAt");

-- CreateIndex
CREATE INDEX "contact_messages_isHandled_idx" ON "contact_messages"("isHandled");

-- CreateIndex
CREATE INDEX "contact_messages_createdAt_idx" ON "contact_messages"("createdAt");

-- CreateIndex
CREATE INDEX "_ProgramTrainers_B_index" ON "_ProgramTrainers"("B");

-- AddForeignKey
ALTER TABLE "local_missions" ADD CONSTRAINT "local_missions_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_homeMissionId_fkey" FOREIGN KEY ("homeMissionId") REFERENCES "local_missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "training_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_deploymentAssignedById_fkey" FOREIGN KEY ("deploymentAssignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_windows" ADD CONSTRAINT "application_windows_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_windows" ADD CONSTRAINT "application_windows_programId_fkey" FOREIGN KEY ("programId") REFERENCES "training_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_windows" ADD CONSTRAINT "application_windows_scopedToMissionId_fkey" FOREIGN KEY ("scopedToMissionId") REFERENCES "local_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_windowId_fkey" FOREIGN KEY ("windowId") REFERENCES "application_windows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_submittedFromMissionId_fkey" FOREIGN KEY ("submittedFromMissionId") REFERENCES "local_missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_lmdReviewerId_fkey" FOREIGN KEY ("lmdReviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_directorReviewerId_fkey" FOREIGN KEY ("directorReviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_recommenderId_fkey" FOREIGN KEY ("recommenderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_reports" ADD CONSTRAINT "field_reports_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_reports" ADD CONSTRAINT "field_reports_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_reports" ADD CONSTRAINT "field_reports_programId_fkey" FOREIGN KEY ("programId") REFERENCES "training_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "local_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramTrainers" ADD CONSTRAINT "_ProgramTrainers_A_fkey" FOREIGN KEY ("A") REFERENCES "training_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramTrainers" ADD CONSTRAINT "_ProgramTrainers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
