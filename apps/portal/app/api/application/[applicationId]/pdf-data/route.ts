import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId } = await params;

  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      submittedFromMission: true,
      lmdReviewer: { select: { fullName: true } },
      directorReviewer: { select: { fullName: true } },
      documents: {
        where: { deletedAt: null },
        select: {
          kind: true,
          storageKey: true,
          fileName: true,
          educationEntryIndex: true,
        },
      },
    },
  });

  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Access control:
  // - Applicant can always access their own
  // - LMD can access applications from their mission
  // - Main Director and System Admin can access all
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { directedMission: true },
  });

  const isApplicant = app.applicantId === session.user.id;
  const isStaffAdmin = [
    "MAIN_DIRECTOR",
    "SECRETARY",
    "ASSOCIATE_DIRECTOR",
    "SYSTEM_ADMIN",
  ].includes(user?.role ?? "");
  const isLmdOfMission =
    user?.role === "LOCAL_DIRECTOR" &&
    user.directedMission?.id === app.submittedFromMissionId;

  if (!isApplicant && !isStaffAdmin && !isLmdOfMission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fd = (app.formData as Record<string, unknown>) ?? {};
  let rawEducation = fd.education;
  // Guard against double-serialized JSON stored as a string
  if (typeof rawEducation === "string") {
    try { rawEducation = JSON.parse(rawEducation); } catch { rawEducation = []; }
  }
  const educationEntries = (Array.isArray(rawEducation) ? rawEducation : []) as Array<{
    degree: string;
    institutionName: string;
    gpa: string;
    passingYear: string;
  }>;

  const photoDoc = app.documents.find((d) => d.kind === "PROFILE_PHOTO");
  // Relative URL: the PDF is rendered in the browser, which resolves it against
  // the page origin. Building an absolute URL from req.url breaks behind the
  // reverse proxy (internal host / http scheme → blocked as mixed content).
  const profilePhotoUrl = photoDoc
    ? `/api/uploads/${photoDoc.storageKey}`
    : undefined;

  const formatAddress = (
    district?: string | null,
    upazila?: string | null,
    postOffice?: string | null,
    village?: string | null,
  ) =>
    [village, postOffice, upazila, district].filter(Boolean).join(", ") ||
    undefined;

  const presentAddress = formatAddress(
    app.presentAddressDistrict,
    app.presentAddressUpazila,
    app.presentAddressPostOffice,
    app.presentAddressVillage,
  );

  const permanentAddress = app.permanentSameAsPresent
    ? presentAddress
    : formatAddress(
        app.permanentAddressDistrict,
        app.permanentAddressUpazila,
        app.permanentAddressPostOffice,
        app.permanentAddressVillage,
      );

  const submitLog = await prisma.auditLog.findFirst({
    where: { targetId: applicationId, action: "APPLICATION_SUBMITTED" },
    select: { ipAddress: true },
  });

  const data = {
    applicantFullName: app.applicantFullName ?? "",
    applicantFullNameBangla: app.applicantFullNameBangla ?? undefined,
    applicantDateOfBirth: app.applicantDateOfBirth?.toISOString() ?? "",
    applicantGender: app.applicantGender ?? "",
    applicantBloodType: app.applicantBloodType ?? undefined,
    applicantMaritalStatus: app.applicantMaritalStatus ?? undefined,
    applicantDenomination: app.applicantDenomination ?? undefined,
    applicantChurchName: app.applicantChurchName ?? undefined,
    applicantDateOfBaptism:
      app.applicantDateOfBaptism?.toISOString() ?? undefined,
    applicantPlaceOfBirth: app.applicantPlaceOfBirth ?? undefined,
    applicantHeight:
      app.applicantHeight != null ? String(app.applicantHeight) : undefined,
    applicantWeight:
      app.applicantWeight != null ? String(app.applicantWeight) : undefined,
    applicantWorkplace: app.applicantWorkplace ?? undefined,
    applicantMobileNo: app.applicantMobileNo ?? undefined,
    applicantEmail: app.applicantEmail ?? undefined,
    presentAddress,
    permanentAddress,
    profilePhotoUrl,
    fatherName: app.fatherName ?? undefined,
    fatherAge: app.fatherAge != null ? String(app.fatherAge) : undefined,
    fatherReligion: app.fatherReligion ?? undefined,
    fatherChurchName: app.fatherChurchName ?? undefined,
    motherName: app.motherName ?? undefined,
    motherAge: app.motherAge != null ? String(app.motherAge) : undefined,
    motherReligion: app.motherReligion ?? undefined,
    motherChurchName: app.motherChurchName ?? undefined,
    familyMobileNo: app.familyMobileNo ?? undefined,
    familyEmail: app.familyEmail ?? undefined,
    educationEntries,
    missionaryDesire: fd.missionaryDesire?.toString() ?? undefined,
    districtPastorName: fd.districtPastorName?.toString() ?? undefined,
    districtPastorMobile: fd.districtPastorMobile?.toString() ?? undefined,
    districtPastorEmail: fd.districtPastorEmail?.toString() ?? undefined,
    courtRecord: fd.courtRecord != null ? Boolean(fd.courtRecord) : undefined,
    healthCondition:
      fd.healthCondition != null ? Boolean(fd.healthCondition) : undefined,
    badHabits: fd.badHabits != null ? Boolean(fd.badHabits) : undefined,
    missionName: app.submittedFromMission?.name ?? undefined,
    submittedAt: app.submittedAt?.toISOString() ?? new Date().toISOString(),
    ipAddress: submitLog?.ipAddress ?? undefined,
    lmdReviewerName: app.lmdReviewer?.fullName ?? undefined,
    directorReviewerName: app.directorReviewer?.fullName ?? undefined,
  };
  return NextResponse.json(data);
}
