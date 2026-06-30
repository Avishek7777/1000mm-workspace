import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import * as XLSX from "xlsx";

const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const ALLOWED = ["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR"] as const;

const TYPE_LABELS: Record<string, string> = {
  INCOME: "Income", EXPENSE: "Expense", TRANSFER_TO_MISSION: "Transfer to Mission",
  DEPOSIT: "Deposit", DONATION: "Donation", OTHER: "Other",
};

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
      mission:   { select: { code: true, name: true } },
      createdBy: { select: { fullName: true } },
    },
  });

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Financial Entries ───────────────────────────────────────────
  const rows = entries.map((e, i) => ({
    "#":           i + 1,
    "Date":        new Date(e.date).toLocaleDateString("en-GB"),
    "Year":        new Date(e.date).getFullYear(),
    "Month":       MONTHS_FULL[new Date(e.date).getMonth()],
    "Mission":     e.mission?.code ?? "All",
    "Mission Name":e.mission?.name ?? "",
    "Type":        TYPE_LABELS[e.type] ?? e.type,
    "Description": e.description ?? "",
    "Reference":   e.reference ?? "",
    "Amount (৳)":  e.amount,
    "Added By":    e.createdBy?.fullName ?? "",
  }));

  const ws1 = XLSX.utils.json_to_sheet(rows);
  ws1["!cols"] = [
    { wch: 5 }, { wch: 14 }, { wch: 8 }, { wch: 12 },
    { wch: 10 }, { wch: 24 }, { wch: 20 }, { wch: 40 },
    { wch: 20 }, { wch: 14 }, { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Financial Entries");

  // ── Sheet 2: Summary ─────────────────────────────────────────────────────
  const totalIncome   = entries.filter((e) => e.type === "INCOME" || e.type === "DONATION").reduce((s, e) => s + e.amount, 0);
  const totalDeposit  = entries.filter((e) => e.type === "DEPOSIT").reduce((s, e) => s + e.amount, 0);
  const totalExpense  = entries.filter((e) => e.type === "EXPENSE" || e.type === "OTHER").reduce((s, e) => s + e.amount, 0);
  const totalTransfer = entries.filter((e) => e.type === "TRANSFER_TO_MISSION").reduce((s, e) => s + e.amount, 0);
  const netBalance    = totalIncome + totalDeposit - totalExpense - totalTransfer;

  // By mission
  const missionMap = new Map<string, { code: string; income: number; deposit: number; expense: number; transfer: number; count: number }>();
  for (const e of entries) {
    const key = e.mission?.code ?? "All";
    if (!missionMap.has(key)) missionMap.set(key, { code: key, income: 0, deposit: 0, expense: 0, transfer: 0, count: 0 });
    const m = missionMap.get(key)!;
    m.count++;
    if (e.type === "INCOME" || e.type === "DONATION")      m.income   += e.amount;
    else if (e.type === "DEPOSIT")                          m.deposit  += e.amount;
    else if (e.type === "EXPENSE" || e.type === "OTHER")   m.expense  += e.amount;
    else if (e.type === "TRANSFER_TO_MISSION")              m.transfer += e.amount;
  }

  const filterLabel = [
    missionParam ?? "All Missions",
    typeParam ? TYPE_LABELS[typeParam] : null,
    yearNum ? String(yearNum) : null,
    monthNum ? MONTHS_FULL[monthNum - 1] : null,
  ].filter(Boolean).join(" · ");

  const summaryRows = [
    { Summary: "1000 Missionary Movement Bangladesh",  Value: "" },
    { Summary: "Report",                Value: "Financial Overview" },
    { Summary: "Filter",                Value: filterLabel },
    { Summary: "Total Entries",         Value: entries.length },
    { Summary: "",                       Value: "" },
    { Summary: "Income + Donations",    Value: totalIncome   },
    { Summary: "Deposits",              Value: totalDeposit  },
    { Summary: "Expenses + Other",      Value: totalExpense  },
    { Summary: "Transfers to Mission",  Value: totalTransfer },
    { Summary: "",                       Value: "" },
    { Summary: "Net Balance",           Value: netBalance    },
    { Summary: "",                       Value: "" },
    ...["By Mission", ""].flatMap((h) => h ? [{ Summary: h, Value: "" }] : [{ Summary: "", Value: "" }]),
    ...[...missionMap.values()].sort((a, b) => a.code.localeCompare(b.code)).flatMap((m) => [
      { Summary: m.code,           Value: `${m.count} entries` },
      { Summary: "  Income",       Value: m.income   },
      { Summary: "  Deposits",     Value: m.deposit  },
      { Summary: "  Expenses",     Value: m.expense  },
      { Summary: "  Transfers",    Value: m.transfer },
      { Summary: "  Net",         Value: m.income + m.deposit - m.expense - m.transfer },
      { Summary: "",               Value: "" },
    ]),
    { Summary: "Generated At",   Value: new Date().toLocaleString("en-GB") },
    { Summary: "Generated By",   Value: user.fullName },
  ];
  const ws2 = XLSX.utils.json_to_sheet(summaryRows);
  ws2["!cols"] = [{ wch: 28 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="financial-overview.xlsx"`,
    },
  });
}
