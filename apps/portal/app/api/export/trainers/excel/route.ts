// ─────────────────────────────────────────────────────────────────────────────
// FILE 1: apps/portal/app/api/export/trainers/excel/route.ts
// GET /api/export/trainers/excel          → all trainers as .xlsx
// GET /api/export/trainers/excel?id=xxx   → single trainer as .xlsx
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");

  const users = await prisma.user.findMany({
    where: {
      role: "TRAINER",
      deletedAt: null,
      ...(id ? { id } : {}),
    },
    include: { homeMission: { select: { name: true, code: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (id && users.length === 0) {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
  }

  // Also pull TrainerApplication records to get CV/passport/photo keys,
  // specialization, address etc. (not stored on User directly)
  const applications = await prisma.trainerApplication.findMany({
    where: {
      status: "APPROVED",
      ...(id ? { createdUser: { id } } : { createdUserId: { not: null } }),
    },
    select: {
      createdUserId: true,
      fullAddress: true,
      specialization: true,
      phone: true,
      acceptsSelfFunding: true,
      requestsInvitationLetter: true,
      createdAt: true,
    },
  });

  const appByUserId = Object.fromEntries(
    applications.map((a) => [a.createdUserId, a]),
  );

  // ── Build workbook ────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = "1000MM Portal";
  wb.created = new Date();

  const ws = wb.addWorksheet(id ? "Trainer Profile" : "All Trainers");

  // Header style helpers
  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF007F98" }, // teal
  };
  const altFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF0FAFA" },
  };
  const bold: Partial<ExcelJS.Font> = { bold: true };
  const headerFont: Partial<ExcelJS.Font> = {
    bold: true,
    color: { argb: "FFFFFFFF" },
    size: 11,
  };

  const columns: { header: string; key: string; width: number }[] = [
    { header: "#", key: "num", width: 5 },
    { header: "Full Name", key: "fullName", width: 24 },
    { header: "Email", key: "email", width: 28 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Home Mission", key: "mission", width: 14 },
    { header: "Active", key: "isActive", width: 8 },
    { header: "Full Address", key: "address", width: 32 },
    { header: "Specialization", key: "specialization", width: 36 },
    { header: "Self-Funding Accepted", key: "selfFunding", width: 20 },
    { header: "Invitation Letter Req.", key: "invitationLetter", width: 20 },
    { header: "Account Created", key: "createdAt", width: 18 },
    { header: "Last Login", key: "lastLogin", width: 18 },
  ];

  ws.columns = columns;

  // Style header row
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF005F7A" } },
    };
  });
  headerRow.height = 28;

  // Data rows
  users.forEach((user, i) => {
    const app = appByUserId[user.id];
    const rowData = {
      num: i + 1,
      fullName: user.fullName,
      email: user.email,
      phone: app?.phone ?? user.phone ?? "—",
      mission: `${user.homeMission.name} (${user.homeMission.code})`,
      isActive: user.isActive ? "Yes" : "No",
      address: app?.fullAddress ?? "—",
      specialization: app?.specialization ?? "—",
      selfFunding: app?.acceptsSelfFunding ? "Yes" : "—",
      invitationLetter: app?.requestsInvitationLetter ? "Yes" : "No",
      createdAt: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-GB")
        : "—",
      lastLogin: user.lastLoginAt
        ? new Date(user.lastLoginAt).toLocaleDateString("en-GB")
        : "Never",
    };

    const row = ws.addRow(rowData);
    row.height = 20;

    // Alternate row shading
    if (i % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = altFill;
      });
    }

    // Align number col center
    row.getCell("num").alignment = { horizontal: "center" };
    row.getCell("isActive").alignment = { horizontal: "center" };
    row.getCell("selfFunding").alignment = { horizontal: "center" };
    row.getCell("invitationLetter").alignment = { horizontal: "center" };

    // Wrap long text cells
    row.getCell("address").alignment = { wrapText: true };
    row.getCell("specialization").alignment = { wrapText: true };
  });

  // Summary row (all trainers export only)
  if (!id) {
    ws.addRow({}); // spacer
    const totalRow = ws.addRow({
      num: "",
      fullName: `Total: ${users.length} trainer(s)`,
    });
    totalRow.getCell("fullName").font = bold;
  }

  // Freeze header
  ws.views = [{ state: "frozen", ySplit: 1 }];

  // Stream back
  const filename = id
    ? `trainer-${users[0]?.fullName.replace(/\s+/g, "-").toLowerCase() ?? id}.xlsx`
    : `all-trainers-${new Date().toISOString().slice(0, 10)}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
