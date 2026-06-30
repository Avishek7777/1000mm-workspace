import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";
import { DirectorFinancialExportButton } from "./_components/DirectorFinancialExportButton";
import { AddEntryForm } from "@/app/dashboard/financial/_components/AddEntryForm";

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

export default async function DirectorFinancialPage({
  searchParams,
}: {
  searchParams: Promise<{ mission?: string; type?: string; year?: string; month?: string }>;
}) {
  await requireRole(["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"]);
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
      mission: { select: { code: true } },
      createdBy: { select: { fullName: true } },
    },
  });

  const availableYears = [
    ...new Set(
      (await prisma.financialEntry.findMany({ where: { deletedAt: null }, select: { date: true } }))
        .map((e) => new Date(e.date).getFullYear()),
    ),
  ].sort((a, b) => b - a);

  const totalIncome = entries.filter((e) => e.type === "INCOME" || e.type === "DONATION").reduce((s, e) => s + e.amount, 0);
  const totalDeposit = entries.filter((e) => e.type === "DEPOSIT").reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === "EXPENSE" || e.type === "OTHER").reduce((s, e) => s + e.amount, 0);
  const totalTransfer = entries.filter((e) => e.type === "TRANSFER_TO_MISSION").reduce((s, e) => s + e.amount, 0);
  const netBalance = totalIncome + totalDeposit - totalExpense - totalTransfer;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Financial Overview</h1>
          <p className="mt-0.5 text-sm text-gray-500">Financial entries across all missions</p>
        </div>
        <div className="flex items-center gap-2">
          <DirectorFinancialExportButton mission={mission} type={type} year={year} month={month} />
          <PrintButton label="Print" />
          <AddEntryForm missions={missions} isStaff={true} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Income", amount: totalIncome, style: "border-teal-200 bg-teal-50", text: "text-teal-800" },
          { label: "Deposits", amount: totalDeposit, style: "border-blue-200 bg-blue-50", text: "text-blue-800" },
          { label: "Expenses", amount: totalExpense, style: "border-red-200 bg-red-50", text: "text-red-800" },
          { label: "Transfers", amount: totalTransfer, style: "border-purple-200 bg-purple-50", text: "text-purple-800" },
        ].map((c) => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.style}`}>
            <p className={`text-[10px] font-medium uppercase tracking-widest ${c.text} opacity-70`}>{c.label}</p>
            <p className={`mt-1 text-lg font-semibold ${c.text}`}>৳{c.amount.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-xl border p-4 ${netBalance >= 0 ? "border-teal-200 bg-teal-50" : "border-red-200 bg-red-50"}`}>
        <p className={`text-xs font-medium ${netBalance >= 0 ? "text-teal-700" : "text-red-700"}`}>Net Balance</p>
        <p className={`mt-0.5 text-2xl font-bold ${netBalance >= 0 ? "text-teal-800" : "text-red-800"}`}>
          ৳{netBalance.toLocaleString()}
        </p>
      </div>

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
            href="/dashboard/director/financial"
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      <div className="hidden print:block text-xs text-gray-500 mb-2">
        1000 Missionary Movement Bangladesh — Financial Overview{mission ? ` · ${mission}` : ""}{type ? ` · ${TYPE_LABELS[type]}` : ""}{yearNum ? ` · ${yearNum}` : ""}{monthNum ? ` · ${MONTHS[monthNum - 1]}` : ""} · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        <span className="ml-4">Net: ৳{netBalance.toLocaleString()}</span>
      </div>

      {entries.length === 0 ? (
        <div className="print:hidden rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">No financial entries found.</p>
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
                <th className="py-3 pr-5 text-right text-[10px] font-semibold uppercase tracking-widest text-gray-400">Amount</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="py-3 pl-5 pr-2 text-xs text-gray-400">{i + 1}</td>
                  <td className="py-3 pr-2 text-xs text-gray-600">{new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="py-3 pr-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${e.mission ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>{e.mission?.code ?? "All"}</span></td>
                  <td className="py-3 pr-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_STYLES[e.type]}`}>{TYPE_LABELS[e.type]}</span></td>
                  <td className="py-3 pr-2 text-xs text-gray-700">{e.description}{e.reference && <span className="ml-1 text-gray-400">· {e.reference}</span>}</td>
                  <td className="py-3 pr-5 text-right text-sm font-medium text-gray-900">৳{e.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={5} className="py-3 pl-5 pr-2 text-right text-xs font-semibold text-gray-700">Net Balance</td>
                <td className={`py-3 pr-5 text-right font-bold ${netBalance >= 0 ? "text-teal-700" : "text-red-700"}`}>৳{netBalance.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
