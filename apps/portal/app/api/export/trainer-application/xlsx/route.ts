import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, fullName: true } });
  if (!user || user.role !== "SYSTEM_ADMIN") return new NextResponse("Forbidden", { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });

  const app = await prisma.trainerApplication.findUnique({
    where: { id },
    include: {
      reviewedBy:  { select: { fullName: true } },
      createdUser: { select: { fullName: true, role: true } },
      attachments: { include: { uploadedBy: { select: { fullName: true } } }, orderBy: { uploadedAt: "desc" } },
    },
  });
  if (!app) return new NextResponse("Not found", { status: 404 });

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Application Data ───────────────────────────────────────────────
  const infoRows = [
    { Field: "Full Name",                   Value: app.fullName },
    { Field: "Email",                        Value: app.email },
    { Field: "Phone",                        Value: app.phone ?? "" },
    { Field: "Country",                      Value: app.country ?? "" },
    { Field: "Full Address",                 Value: app.fullAddress },
    { Field: "Specialization",               Value: app.specialization },
    { Field: "",                             Value: "" },
    { Field: "Accepts Self Funding",         Value: app.acceptsSelfFunding ? "Yes" : "No" },
    { Field: "Requests Invitation Letter",   Value: app.requestsInvitationLetter ? "Yes" : "No" },
    { Field: "",                             Value: "" },
    { Field: "CV Uploaded",                  Value: app.cvStorageKey ? "Yes" : "No" },
    { Field: "Passport Uploaded",            Value: app.passportStorageKey ? "Yes" : "No" },
    { Field: "Photo Uploaded",               Value: app.photoStorageKey ? "Yes" : "No" },
    { Field: "",                             Value: "" },
    { Field: "Status",                       Value: app.status },
    { Field: "Reviewed By",                  Value: app.reviewedBy?.fullName ?? "" },
    { Field: "Reviewed At",                  Value: app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString("en-GB") : "" },
    { Field: "Review Note",                  Value: app.reviewNote ?? "" },
    { Field: "",                             Value: "" },
    { Field: "Portal Account Created",       Value: app.createdUser?.fullName ?? "No" },
    { Field: "Portal Account Role",          Value: app.createdUser?.role ?? "" },
    { Field: "",                             Value: "" },
    { Field: "Applied At",                   Value: new Date(app.createdAt).toLocaleDateString("en-GB") },
    { Field: "IP Address",                   Value: app.ipAddress ?? "" },
    { Field: "",                             Value: "" },
    { Field: "Invitation Letter Customized", Value: app.invitationLetterBody ? "Yes" : "No" },
    { Field: "Recommendation Letter Customized", Value: app.recommendationLetterBody ? "Yes" : "No" },
    { Field: "Required Doc 1",               Value: app.requiredDoc1 ?? "" },
    { Field: "Required Doc 2",               Value: app.requiredDoc2 ?? "" },
    { Field: "Required Doc 3",               Value: app.requiredDoc3 ?? "" },
    { Field: "Required Doc 4",               Value: app.requiredDoc4 ?? "" },
    { Field: "",                             Value: "" },
    { Field: "Exported At",                  Value: new Date().toLocaleString("en-GB") },
    { Field: "Exported By",                  Value: user.fullName },
  ];

  const ws1 = XLSX.utils.json_to_sheet(infoRows);
  ws1["!cols"] = [{ wch: 32 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Application");

  // ── Sheet 2: Admin Attachments ──────────────────────────────────────────────
  const attachRows = app.attachments.map((a, i) => ({
    "#":           i + 1,
    "Label":       a.label ?? "",
    "File Name":   a.fileName,
    "Storage Key": a.storageKey,
    "Uploaded By": a.uploadedBy.fullName,
    "Uploaded At": new Date(a.uploadedAt).toLocaleDateString("en-GB"),
  }));

  const ws2 = attachRows.length > 0
    ? XLSX.utils.json_to_sheet(attachRows)
    : XLSX.utils.aoa_to_sheet([["#","Label","File Name","Storage Key","Uploaded By","Uploaded At"],["No attachments yet"]]);
  ws2["!cols"] = [{ wch: 5 }, { wch: 20 }, { wch: 30 }, { wch: 40 }, { wch: 22 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Attachments");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const slug = app.fullName.replace(/\s+/g, "-").toLowerCase();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="trainer-application-${slug}.xlsx"`,
    },
  });
}
