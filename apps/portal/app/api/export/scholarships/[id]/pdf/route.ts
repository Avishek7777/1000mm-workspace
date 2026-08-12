import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { ScholarshipFormPdf } from "@/lib/exports/ScholarshipFormPdf";

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_LMD_REVIEW: "Under review",
  LMD_SUGGESTED: "Suggested",
  LMD_REJECTED: "Rejected",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

function fmt(d: Date | null | undefined) {
  return d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!viewer) return new NextResponse("Unauthorized", { status: 401 });

  const r = await prisma.scholarshipRequest.findFirst({
    where: { id, deletedAt: null },
    include: {
      missionary: { select: { id: true, fullName: true } },
      mission: { select: { id: true, code: true, name: true } },
      lmdReviewer: { select: { fullName: true } },
      udReviewer: { select: { fullName: true } },
    },
  });
  if (!r) return new NextResponse("Not found", { status: 404 });

  // The applicant may read their own; the LMD of that mission; UD and SA any.
  // These carry NIDs and family detail, so nobody else gets a copy.
  const isOwner = r.missionaryId === viewer.id;
  const isUnion = ["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(viewer.role);
  let isTheirLmd = false;
  if (viewer.role === "LOCAL_DIRECTOR") {
    const mission = await prisma.localMission.findFirst({
      where: { id: r.missionId, directorId: viewer.id },
      select: { id: true },
    });
    isTheirLmd = Boolean(mission);
  }
  if (!isOwner && !isUnion && !isTheirLmd) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const buffer = await renderToBuffer(
    ScholarshipFormPdf({
      referenceNumber: r.referenceNumber,
      status: STATUS_LABEL[r.status] ?? r.status,
      missionaryName: r.missionary.fullName,
      missionName: `${r.mission.name} (${r.mission.code})`,
      submittedAt: fmt(r.submittedAt),
      submittedByName: r.submittedByName,
      fields: [
        { label: "Date of Birth", value: fmt(r.dateOfBirth) },
        { label: "Serving Year", value: r.servingYear },
        { label: "Passing Grade", value: r.passingGrade },
        { label: "Year", value: r.passingYear },
        { label: "GPA", value: r.gpa },
        { label: "Planning to Study", value: r.planningToStudy },
        { label: "Subject", value: r.subject },
        { label: "College Name", value: r.collegeName },
        { label: "College Address", value: r.collegeAddress },
        { label: "Estimated Monthly Fees", value: r.estimatedMonthlyFees },
        { label: "Yearly Fees", value: r.yearlyFees },
        { label: "Additional Fees", value: r.additionalFees },
        { label: "Name of Father", value: r.fatherName },
        { label: "Name of Mother", value: r.motherName },
        { label: "Name of Brother / Sister", value: r.siblingName },
        { label: "Home Address", value: r.homeAddress },
        { label: "Phone Number", value: r.phoneNumber },
        { label: "Email ID", value: r.emailId },
      ],
      experience: r.experience,
      desireToStudy: r.desireToStudy,
      familyBackground: r.familyBackground,
      attachments: [
        { label: "PP size picture", present: Boolean(r.photoKey) },
        { label: "Missionary certificate", present: Boolean(r.missionaryCertificateKey) },
        { label: "Academic result or certificate", present: Boolean(r.academicResultKey) },
        { label: "Recommendation letter", present: Boolean(r.recommendationLetterKey) },
        { label: "NID", present: Boolean(r.nidKey) },
      ],
      lmd: r.lmdDecisionAt
        ? {
            name: r.lmdReviewer?.fullName ?? "—",
            date: fmt(r.lmdDecisionAt),
            note: r.lmdDecisionNote ?? "",
            outcome: r.status === "LMD_REJECTED" ? "Rejected" : "Suggested to Union Director",
          }
        : null,
      ud: r.udDecisionAt
        ? {
            name: r.udReviewer?.fullName ?? "—",
            date: fmt(r.udDecisionAt),
            note: r.udDecisionNote ?? "",
            outcome: r.status === "APPROVED" ? "Approved" : "Rejected",
            amount: r.approvedAmount != null ? r.approvedAmount.toLocaleString("en-GB") : undefined,
          }
        : null,
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${r.referenceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
