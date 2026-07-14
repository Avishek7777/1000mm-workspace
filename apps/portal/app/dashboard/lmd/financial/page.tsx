import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";
import { AddEntryForm } from "@/app/dashboard/financial/_components/AddEntryForm";
import { DeleteEntryButton } from "@/app/dashboard/financial/_components/DeleteEntryButton";

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

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function LmdFinancialPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; year?: string; month?: string; mission?: string }>;
}) {
  // SA gets a read-only view (with delete) of any mission's ledger.
  const actor = await requireRole(["LOCAL_DIRECTOR", "SYSTEM_ADMIN"]);
  const isSa = actor.role === "SYSTEM_ADMIN";
  const session = await auth();
  const { type, year, month, mission } = await searchParams;
  const yearNum = year ? parseInt(year, 10) : undefined;
  const monthNum = month ? parseInt(month, 10) : undefined;

  const allMissions = isSa
    ? await prisma.localMission.findMany({
        where: { deletedAt: null },
        orderBy: { code: "asc" },
        select: { id: true, code: true, name: true, director: { select: { fullName: true } } },
      })
    : [];

  const lmdMission = isSa
    ? (allMissions.find((m) => m.code === mission) ?? allMissions[0] ?? null)
    : await prisma.localMission.findFirst({
        where: { directorId: session!.user!.id },
        select: { id: true, code: true, name: true, director: { select: { fullName: true } } },
      });
  if (!lmdMission) redirect(isSa ? "/dashboard/financial" : "/dashboard/lmd");

  const startDate = yearNum && monthNum
    ? new Date(yearNum, monthNum - 1, 1)
    : yearNum
    ? new Date(`${yearNum}-01-01`)
    : undefined;
  const endDate = yearNum && monthNum
    ? new Date(yearNum, monthNum, 1)
    : yearNum
    ? new Date(`${yearNum + 1}-01-01`)
    : undefined;

  const entries = await prisma.financialEntry.findMany({
    where: {
      deletedAt: null,
      missionId: lmdMission.id,
      ...(type ? { type: type as any } : {}),
      ...(startDate && endDate ? { date: { gte: startDate, lt: endDate } } : {}),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: { createdBy: { select: { fullName: true } } },
  });

  const availableYears = [
    ...new Set(
      (await prisma.financialEntry.findMany({ where: { missionId: lmdMission.id, deletedAt: null }, select: { date: true } }))
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
          <h1 className="text-lg font-semibold text-gray-900">Financial — {lmdMission.code}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {lmdMission.name}
            {isSa && " · viewing as System Admin"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton label="Print" />
        </div>
      </div>

      {/* SA: pick which mission's ledger to view */}
      {isSa && (
        <div className="print:hidden flex flex-wrap gap-1">
          {allMissions.map((m) => (
            <Link
              key={m.code}
              href={`?${new URLSearchParams({ mission: m.code, ...(type ? { type } : {}), ...(year ? { year } : {}), ...(month ? { month } : {}) })}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${lmdMission.code === m.code ? "border-teal-400 bg-teal-50 text-teal-800" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
            >
              {m.code}
            </Link>
          ))}
        </div>
      )}

      {/* LMD: add entries to own ledger. SA is view + delete only. */}
      {!isSa && (
        <div className="print:hidden">
          <AddEntryForm
            missions={[{ id: lmdMission.id, code: lmdMission.code, name: lmdMission.name }]}
            defaultMissionId={lmdMission.id}
          />
        </div>
      )}

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
        {isSa && <input type="hidden" name="mission" value={lmdMission.code} />}
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
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Filter
        </button>
        {(type || year || month) && (
          <Link
            href={isSa ? `?mission=${lmdMission.code}` : "/dashboard/lmd/financial"}
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      <div className="hidden print:block mb-3">
        <div className="flex items-center justify-between border-b pb-3 mb-3">
          <img src="/logos/1000mm-logo.png" alt="1000MM" className="h-10 w-auto" />
          <div className="text-center">
            <p className="text-xs font-bold text-gray-900">1000 Missionary Movement Bangladesh</p>
            <p className="text-[10px] text-gray-600">Financial Records — {lmdMission.name} ({lmdMission.code})</p>
            {lmdMission.director && <p className="text-[10px] text-gray-500">Head of Mission: {lmdMission.director.fullName}</p>}
            {(type || yearNum || monthNum) && <p className="text-[10px] text-gray-500">{[type ? TYPE_LABELS[type] : "", yearNum, monthNum ? MONTHS[monthNum - 1] : ""].filter(Boolean).join(" · ")}</p>}
            <p className="text-[10px] text-gray-400">Printed {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <img src="/logos/sda-logo.png" alt="SDA" className="h-10 w-auto" />
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="print:hidden rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">
            {isSa
              ? "No financial entries for this mission yet."
              : "No financial entries yet. Use the + Add Entry button above."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 pl-5 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">#</th>
                <th className="py-3 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Date</th>
                <th className="py-3 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Type</th>
                <th className="py-3 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Description</th>
                <th className="py-3 pr-5 text-right text-[10px] font-semibold uppercase tracking-widest text-gray-400">Amount</th>
                {isSa && <th className="print:hidden py-3 pr-5 text-right text-[10px] font-semibold uppercase tracking-widest text-gray-400"></th>}
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="py-3 pl-5 pr-2 text-xs text-gray-400">{i + 1}</td>
                  <td className="py-3 pr-2 text-xs text-gray-600">{new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="py-3 pr-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_STYLES[e.type]}`}>{TYPE_LABELS[e.type]}</span></td>
                  <td className="py-3 pr-2 text-xs text-gray-700">{e.description}{e.reference && <span className="ml-1 text-gray-400">· {e.reference}</span>}</td>
                  <td className="py-3 pr-5 text-right text-sm font-medium text-gray-900">৳{e.amount.toLocaleString()}</td>
                  {isSa && (
                    <td className="print:hidden py-3 pr-5 text-right">
                      <DeleteEntryButton entryId={e.id} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={4} className="py-3 pl-5 pr-2 text-right text-xs font-semibold text-gray-700">Net Balance</td>
                <td className={`py-3 pr-5 text-right font-bold ${netBalance >= 0 ? "text-teal-700" : "text-red-700"}`}>৳{netBalance.toLocaleString()}</td>
                {isSa && <td className="print:hidden" />}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
