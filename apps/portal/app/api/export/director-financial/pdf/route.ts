import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import path from "path";
import { readFileSync } from "fs";

const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TEAL = "#0d7a6e";
const ALLOWED = ["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR"] as const;

const TYPE_LABELS: Record<string, string> = {
  INCOME: "Income", EXPENSE: "Expense", TRANSFER_TO_MISSION: "Transfer",
  DEPOSIT: "Deposit", DONATION: "Donation", OTHER: "Other",
};

const styles = StyleSheet.create({
  page:     { padding: 24, fontSize: 7, fontFamily: "Helvetica", color: "#1a1a1a" },
  hdr:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: TEAL, paddingBottom: 8, marginBottom: 12 },
  logo:     { width: 34, height: 34 },
  hCenter:  { alignItems: "center" },
  hTitle:   { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111" },
  hSub:     { fontSize: 7.5, color: TEAL, marginTop: 2 },
  hMeta:    { fontSize: 6.5, color: "#666", marginTop: 1.5 },
  thead:    { flexDirection: "row", backgroundColor: "#e5e7eb", padding: "3 4" },
  th:       { fontFamily: "Helvetica-Bold", color: "#374151", fontSize: 6.5 },
  row:      { flexDirection: "row", padding: "2.5 4", borderBottomWidth: 0.4, borderBottomColor: "#e5e7eb" },
  rowAlt:   { flexDirection: "row", padding: "2.5 4", backgroundColor: "#f9fafb", borderBottomWidth: 0.4, borderBottomColor: "#e5e7eb" },
  cell:     { color: "#374151", fontSize: 6.5 },
  cellBold: { fontFamily: "Helvetica-Bold", color: "#111", fontSize: 6.5 },
  summBox:  { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10, marginBottom: 4 },
  sCard:    { padding: "4 8", borderRadius: 4, minWidth: 80 },
  sLabel:   { fontSize: 6, color: "#fff", opacity: 0.8 },
  sVal:     { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#fff", marginTop: 1 },
  netRow:   { flexDirection: "row", alignItems: "center", padding: "5 8", backgroundColor: TEAL, marginTop: 3 },
  netLabel: { flex: 1, fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#fff" },
  netAmt:   { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#fff" },
  footer:   { marginTop: 10, fontSize: 6, color: "#9ca3af", textAlign: "right" },
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, fullName: true },
  });
  if (!user || !ALLOWED.includes(user.role as typeof ALLOWED[number]))
    return new NextResponse("Forbidden", { status: 403 });

  const { searchParams } = new URL(req.url);
  const missionParam = searchParams.get("mission") ?? undefined;
  const typeParam    = searchParams.get("type")    ?? undefined;
  const yearParam    = searchParams.get("year")    ?? undefined;
  const monthParam   = searchParams.get("month")   ?? undefined;
  const yearNum      = yearParam  ? parseInt(yearParam,  10) : undefined;
  const monthNum     = monthParam ? parseInt(monthParam, 10) : undefined;

  const missions = await prisma.localMission.findMany({ where: { deletedAt: null }, select: { id: true, code: true } });
  const missionId = missionParam ? missions.find((m) => m.code === missionParam)?.id : undefined;

  const entries = await prisma.financialEntry.findMany({
    where: {
      deletedAt: null,
      ...(missionId ? { missionId } : {}),
      ...(typeParam  ? { type: typeParam as any } : {}),
      ...(() => {
        const cy = new Date().getFullYear();
        const y = yearNum ?? (monthNum ? cy : undefined);
        const m = monthNum;
        if (y && m) return { date: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) } };
        if (y)      return { date: { gte: new Date(y, 0, 1),     lt: new Date(y + 1, 0, 1) } };
        return {};
      })(),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      mission:   { select: { code: true } },
      createdBy: { select: { fullName: true } },
    },
  });


  const totalIncome   = entries.filter((e) => e.type === "INCOME" || e.type === "DONATION").reduce((s, e) => s + e.amount, 0);
  const totalDeposit  = entries.filter((e) => e.type === "DEPOSIT").reduce((s, e) => s + e.amount, 0);
  const totalExpense  = entries.filter((e) => e.type === "EXPENSE" || e.type === "OTHER").reduce((s, e) => s + e.amount, 0);
  const totalTransfer = entries.filter((e) => e.type === "TRANSFER_TO_MISSION").reduce((s, e) => s + e.amount, 0);
  const netBalance    = totalIncome + totalDeposit - totalExpense - totalTransfer;

  let logoSrc: string | undefined;
  let sdaSrc:  string | undefined;
  try {
    logoSrc = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public", "logos", "1000mm-logo.png")).toString("base64")}`;
    sdaSrc  = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public", "logos", "sda-logo.png")).toString("base64")}`;
  } catch {}

  const generatedAt = new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const filterParts = [
    missionParam ?? "All Missions",
    typeParam ? TYPE_LABELS[typeParam] : null,
    yearNum ? String(yearNum) : null,
    monthNum ? MONTHS_FULL[monthNum - 1] : null,
  ].filter(Boolean);
  const filterLabel = filterParts.join(" · ");

  const fmtAmt = (n: number) => `Tk. ${n.toLocaleString("en")}`;

  const doc = createElement(Document, {},
    createElement(Page, { size: "A4", orientation: "landscape", style: styles.page },
      // Header
      createElement(View, { style: styles.hdr },
        logoSrc ? createElement(Image, { src: logoSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
        createElement(View, { style: styles.hCenter },
          createElement(Text, { style: styles.hTitle }, "1000 Missionary Movement Bangladesh"),
          createElement(Text, { style: styles.hSub },   "Financial Overview"),
          createElement(Text, { style: styles.hMeta },  filterLabel),
          createElement(Text, { style: styles.hMeta },  `${entries.length} entr${entries.length !== 1 ? "ies" : "y"} · Generated: ${generatedAt}`),
        ),
        sdaSrc ? createElement(Image, { src: sdaSrc, style: styles.logo }) : createElement(View, { style: styles.logo }),
      ),

      // Summary cards
      createElement(View, { style: styles.summBox },
        ...[
          { label: "Income + Donations", val: fmtAmt(totalIncome),   bg: TEAL },
          { label: "Deposits",           val: fmtAmt(totalDeposit),  bg: "#2563eb" },
          { label: "Expenses + Other",   val: fmtAmt(totalExpense),  bg: "#dc2626" },
          { label: "Transfers",          val: fmtAmt(totalTransfer), bg: "#7c3aed" },
        ].map(({ label, val, bg }) =>
          createElement(View, { key: label, style: { ...styles.sCard, backgroundColor: bg } },
            createElement(Text, { style: styles.sLabel }, label),
            createElement(Text, { style: styles.sVal }, val),
          )
        ),
      ),

      // Table header
      createElement(View, { style: styles.thead },
        createElement(Text, { style: { ...styles.th, width: 18 } }, "#"),
        createElement(Text, { style: { ...styles.th, width: 52 } }, "Date"),
        createElement(Text, { style: { ...styles.th, width: 38 } }, "Mission"),
        createElement(Text, { style: { ...styles.th, width: 50 } }, "Type"),
        createElement(Text, { style: { ...styles.th, flex: 1 } },   "Description"),
        createElement(Text, { style: { ...styles.th, width: 70 } }, "Reference"),
        createElement(Text, { style: { ...styles.th, width: 64, textAlign: "right" } }, "Amount"),
      ),

      // Rows
      ...entries.map((e, i) =>
        createElement(View, { key: e.id, style: i % 2 === 0 ? styles.row : styles.rowAlt },
          createElement(Text, { style: { ...styles.cell,     width: 18 } }, String(i + 1)),
          createElement(Text, { style: { ...styles.cell,     width: 52 } }, new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })),
          createElement(Text, { style: { ...styles.cellBold, width: 38 } }, e.mission?.code ?? "All"),
          createElement(Text, { style: { ...styles.cell,     width: 50 } }, TYPE_LABELS[e.type] ?? e.type),
          createElement(Text, { style: { ...styles.cell,     flex: 1 } },   e.description ?? ""),
          createElement(Text, { style: { ...styles.cell,     width: 70 } }, e.reference ?? ""),
          createElement(Text, { style: { ...styles.cell,     width: 64, textAlign: "right" } }, fmtAmt(e.amount)),
        )
      ),


      // Net balance
      createElement(View, { style: styles.netRow },
        createElement(Text, { style: styles.netLabel }, "Net Balance  (Income + Deposits - Expenses - Transfers)"),
        createElement(Text, { style: styles.netAmt }, fmtAmt(netBalance)),
      ),

      createElement(Text, { style: styles.footer }, `Generated by ${user.fullName} · ${generatedAt}`),
    ),
  );

  const buffer = await renderToBuffer(doc);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="financial-overview.pdf"`,
    },
  });
}
