import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { AddEntryForm } from "./_components/AddEntryForm";
import { DeleteEntryButton } from "./_components/DeleteEntryButton";
import { PrintButton } from "@/components/PrintButton";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const TYPE_LABELS: Record<string, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
  TRANSFER_TO_MISSION: "Transfer to Mission",
  DEPOSIT: "Deposit",
  DONATION: "Donation",
  OTHER: "Other",
};

const TYPE_STYLES: Record<string, string> = {
  INCOME: "bg-teal-100 text-teal-800",
  DEPOSIT: "bg-blue-100 text-blue-800",
  TRANSFER_TO_MISSION: "bg-purple-100 text-purple-800",
  EXPENSE: "bg-red-100 text-red-800",
  DONATION: "bg-green-100 text-green-800",
  OTHER: "bg-gray-100 text-gray-700",
};

export default async function FinancialPage({
  searchParams,
}: {
  searchParams: Promise<{ mission?: string; type?: string; year?: string; month?: string }>;
}) {
  const { role } = await requireRole(["SYSTEM_ADMIN", "SECRETARY", "ASSOCIATE_DIRECTOR", "MAIN_DIRECTOR"]);
  const canDelete = role === "SYSTEM_ADMIN";
  const { mission, type, year, month } = await searchParams;
  const yearNum  = year  ? parseInt(year,  10) : undefined;
  const monthNum = month ? parseInt(month, 10) : undefined;

  const missions = await prisma.localMission.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });

  const missionId = mission ? missions.find((m) => m.code === mission)?.id : undefined;

  const entries = await prisma.financialEntry.findMany({
    where: {
      deletedAt: null,
      ...(missionId ? { missionId } : {}),
      ...(type ? { type: type as any } : {}),
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
      mission: { select: { code: true, name: true } },
      createdBy: { select: { fullName: true } },
    },
  });

  const availableYears = [
    ...new Set(
      (await prisma.financialEntry.findMany({ where: { deletedAt: null }, select: { date: true } }))
        .map((e) => new Date(e.date).getFullYear()),
    ),
  ].sort((a, b) => b - a);

  // Balance sheet per mission
  const balanceByMission = new Map<string, { income: number; expense: number; deposit: number; transfer: number }>();
  for (const e of entries) {
    const code = e.mission?.code ?? "All Missions";
    if (!balanceByMission.has(code)) {
      balanceByMission.set(code, { income: 0, expense: 0, deposit: 0, transfer: 0 });
    }
    const b = balanceByMission.get(code)!;
    if (e.type === "INCOME" || e.type === "DONATION") b.income += e.amount;
    else if (e.type === "EXPENSE" || e.type === "OTHER") b.expense += e.amount;
    else if (e.type === "DEPOSIT") b.deposit += e.amount;
    else if (e.type === "TRANSFER_TO_MISSION") b.transfer += e.amount;
  }

  const incomeEntries = entries.filter((e) => e.type === "INCOME" || e.type === "DONATION");
  const depositEntries = entries.filter((e) => e.type === "DEPOSIT");
  const expenseEntries = entries.filter((e) => e.type === "EXPENSE" || e.type === "OTHER");
  const transferEntries = entries.filter((e) => e.type === "TRANSFER_TO_MISSION");
  const totalIncome = incomeEntries.reduce((s, e) => s + e.amount, 0);
  const totalDeposit = depositEntries.reduce((s, e) => s + e.amount, 0);
  const totalExpense = expenseEntries.reduce((s, e) => s + e.amount, 0);
  const totalTransfer = transferEntries.reduce((s, e) => s + e.amount, 0);
  const netBalance = totalIncome + totalDeposit - totalExpense - totalTransfer;
  const hasAnyEntries = entries.length > 0;

  function fmtAmount(amount: number, count: number) {
    if (count === 0) return "—";
    return `৳${amount.toLocaleString()}`;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Financial Management</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Track income, expenses, deposits, and transfers across all missions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canDelete && (
            <Link
              href="/dashboard/lmd/financial"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              LMD Ledgers →
            </Link>
          )}
          <PrintButton label="Print" />
          <AddEntryForm missions={missions} isStaff={true} />
        </div>
      </div>

      {/* Balance summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Income", amount: totalIncome, count: incomeEntries.length, style: "border-teal-200 bg-teal-50", text: "text-teal-800" },
          { label: "Deposits", amount: totalDeposit, count: depositEntries.length, style: "border-blue-200 bg-blue-50", text: "text-blue-800" },
          { label: "Expenses", amount: totalExpense, count: expenseEntries.length, style: "border-red-200 bg-red-50", text: "text-red-800" },
          { label: "Transfers", amount: totalTransfer, count: transferEntries.length, style: "border-purple-200 bg-purple-50", text: "text-purple-800" },
        ].map((c) => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.style}`}>
            <p className={`text-[10px] font-medium uppercase tracking-widest ${c.text} opacity-70`}>{c.label}</p>
            <p className={`mt-1 text-lg font-semibold ${c.text}`}>{fmtAmount(c.amount, c.count)}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-xl border p-4 ${!hasAnyEntries ? "border-gray-200 bg-gray-50" : netBalance >= 0 ? "border-teal-200 bg-teal-50" : "border-red-200 bg-red-50"}`}>
        <p className={`text-xs font-medium ${!hasAnyEntries ? "text-gray-500" : netBalance >= 0 ? "text-teal-700" : "text-red-700"}`}>
          Net Balance = Income + Deposits − Expenses − Transfers
        </p>
        <p className={`mt-0.5 text-2xl font-bold ${!hasAnyEntries ? "text-gray-400" : netBalance >= 0 ? "text-teal-800" : "text-red-800"}`}>
          {hasAnyEntries ? `৳${netBalance.toLocaleString()}` : "No entries yet"}
        </p>
      </div>

      {/* Filters */}
      <form method="GET" className="print:hidden flex flex-wrap items-center gap-2">
        <select
          name="mission"
          defaultValue={mission ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All missions</option>
          {missions.map((m) => (
            <option key={m.id} value={m.code}>{m.code}</option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={type ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All types</option>
          {["INCOME", "DONATION", "DEPOSIT", "TRANSFER_TO_MISSION", "EXPENSE", "OTHER"].map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select
          name="year"
          defaultValue={year ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All years</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          name="month"
          defaultValue={month ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All months</option>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Filter
        </button>
        {(mission || type || year || month) && (
          <Link
            href="/dashboard/financial"
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Print-only header */}
      <div className="hidden print:block">
        <p className="text-xs text-gray-500 mb-1">
          1000 Missionary Movement Bangladesh — Financial Management
          {mission ? ` · ${mission}` : ""}
          {type ? ` · ${TYPE_LABELS[type]}` : ""}
          {yearNum  ? ` · ${yearNum}` : ""}
          {monthNum ? ` · ${MONTHS[monthNum - 1]}` : ""} ·{" "}
          {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <div className="flex gap-6 text-xs mb-4">
          <span>Income: <strong>৳{totalIncome.toLocaleString()}</strong></span>
          <span>Deposits: <strong>৳{totalDeposit.toLocaleString()}</strong></span>
          <span>Expenses: <strong>৳{totalExpense.toLocaleString()}</strong></span>
          <span>Transfers: <strong>৳{totalTransfer.toLocaleString()}</strong></span>
          <span>Net: <strong>৳{netBalance.toLocaleString()}</strong></span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="print:hidden rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">No financial entries yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 pl-5 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">#</th>
                <th className="py-3 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Date</th>
                <th className="py-3 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Mission</th>
                <th className="py-3 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Type</th>
                <th className="py-3 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Description</th>
                <th className="py-3 pr-2 text-right text-[10px] font-semibold uppercase tracking-widest text-gray-400">Amount</th>
                {canDelete && <th className="print:hidden py-3 pr-5 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Action</th>}
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="py-3 pl-5 pr-2 text-xs text-gray-400">{i + 1}</td>
                  <td className="py-3 pr-2 text-xs text-gray-600">
                    {new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-3 pr-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${e.mission ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>
                      {e.mission?.code ?? "All"}
                    </span>
                  </td>
                  <td className="py-3 pr-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_STYLES[e.type]}`}>
                      {TYPE_LABELS[e.type]}
                    </span>
                  </td>
                  <td className="py-3 pr-2 text-xs text-gray-700">
                    {e.description}
                    {e.reference && <span className="ml-1 text-gray-400">· {e.reference}</span>}
                  </td>
                  <td className="py-3 pr-2 text-right text-sm font-medium text-gray-900">
                    ৳{e.amount.toLocaleString()}
                  </td>
                  {canDelete && (
                    <td className="print:hidden py-3 pr-5">
                      <DeleteEntryButton entryId={e.id} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={5} className="py-3 pl-5 pr-2 text-right text-xs font-semibold text-gray-700">Net Balance</td>
                <td className={`py-3 pr-2 text-right font-bold ${netBalance >= 0 ? "text-teal-700" : "text-red-700"}`}>
                  ৳{netBalance.toLocaleString()}
                </td>
                {canDelete && <td className="print:hidden" />}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
