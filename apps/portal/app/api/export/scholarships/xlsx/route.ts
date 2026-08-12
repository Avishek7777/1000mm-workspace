import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import * as XLSX from "xlsx";
import { resolveScholarshipExportScope } from "@/lib/exports/scholarshipScope";

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_LMD_REVIEW: "Under LMD review",
  LMD_SUGGESTED: "Suggested to UD",
  LMD_REJECTED: "Rejected by LMD",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

function fmt(d: Date | null | undefined) {
  return d ? new Date(d).toLocaleDateString("en-GB") : "";
}

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const scope = await resolveScholarshipExportScope(session.user.id);
  if ("error" in scope) return new NextResponse(scope.error, { status: scope.status });

  const rows = await prisma.scholarshipRequest.findMany({
    where: { deletedAt: null, ...(scope.missionId ? { missionId: scope.missionId } : {}) },
    orderBy: [{ submittedAt: "desc" }],
    include: {
      missionary: { select: { fullName: true } },
      mission: { select: { code: true, name: true } },
      lmdReviewer: { select: { fullName: true } },
      udReviewer: { select: { fullName: true } },
    },
  });

  const sheet = XLSX.utils.json_to_sheet(
    rows.map((r, i) => ({
      "#": i + 1,
      "Reference": r.referenceNumber,
      "Missionary": r.missionary.fullName,
      "Mission": r.mission.code,
      "Status": STATUS_LABEL[r.status] ?? r.status,
      "Submitted": fmt(r.submittedAt),
      "Serving Year": r.servingYear ?? "",
      "Planning to Study": r.planningToStudy ?? "",
      "Subject": r.subject ?? "",
      "College": r.collegeName ?? "",
      "Monthly Fees": r.estimatedMonthlyFees ?? "",
      "Yearly Fees": r.yearlyFees ?? "",
      "Additional Fees": r.additionalFees ?? "",
      "Phone": r.phoneNumber ?? "",
      "Email": r.emailId ?? "",
      "LMD Reviewer": r.lmdReviewer?.fullName ?? "",
      "LMD Decision": fmt(r.lmdDecisionAt),
      "LMD Note": r.lmdDecisionNote ?? "",
      "UD Reviewer": r.udReviewer?.fullName ?? "",
      "UD Decision": fmt(r.udDecisionAt),
      "UD Note": r.udDecisionNote ?? "",
      "Amount Funded": r.approvedAmount ?? "",
    })),
  );

  // Column widths: without these every column renders at the default and the
  // narrative fields make the sheet unreadable.
  sheet["!cols"] = [
    { wch: 4 }, { wch: 22 }, { wch: 24 }, { wch: 8 }, { wch: 18 }, { wch: 12 },
    { wch: 14 }, { wch: 24 }, { wch: 20 }, { wch: 26 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 22 }, { wch: 13 }, { wch: 40 },
    { wch: 22 }, { wch: 13 }, { wch: 40 }, { wch: 14 },
  ];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Scholarships");
  const buffer = XLSX.write(book, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="scholarships-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
