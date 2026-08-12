import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { ScholarshipListPdf } from "@/lib/exports/ScholarshipListPdf";
import { resolveScholarshipExportScope } from "@/lib/exports/scholarshipScope";

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_LMD_REVIEW: "Under LMD review",
  LMD_SUGGESTED: "Suggested to UD",
  LMD_REJECTED: "Rejected by LMD",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const scope = await resolveScholarshipExportScope(session.user.id);
  if ("error" in scope) return new NextResponse(scope.error, { status: scope.status });

  const requests = await prisma.scholarshipRequest.findMany({
    where: { deletedAt: null, ...(scope.missionId ? { missionId: scope.missionId } : {}) },
    orderBy: [{ submittedAt: "desc" }],
    include: {
      missionary: { select: { fullName: true } },
      mission: { select: { code: true } },
    },
  });

  const totalFunded = requests
    .filter((r) => r.status === "APPROVED")
    .reduce((sum, r) => sum + (r.approvedAmount ?? 0), 0);

  const buffer = await renderToBuffer(
    ScholarshipListPdf({
      rows: requests.map((r) => ({
        ref: r.referenceNumber,
        name: r.missionary.fullName,
        mission: r.mission.code,
        study: r.planningToStudy ?? "",
        status: STATUS_LABEL[r.status] ?? r.status,
        submitted: new Date(r.submittedAt).toLocaleDateString("en-GB"),
        amount: r.approvedAmount != null ? r.approvedAmount.toLocaleString("en-GB") : "",
      })),
      scopeLabel: scope.scopeLabel,
      generatedBy: scope.user.fullName,
      generatedAt: new Date().toLocaleString("en-GB"),
      totalFunded: totalFunded > 0 ? totalFunded.toLocaleString("en-GB") : "",
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="scholarships-${new Date().toISOString().slice(0, 10)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
