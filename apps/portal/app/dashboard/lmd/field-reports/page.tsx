import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default async function LmdFieldReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; district?: string }>;
}) {
  await requireRole(["LOCAL_DIRECTOR"]);
  const session = await auth();
  const { year, month, district } = await searchParams;
  const yearNum = year ? parseInt(year, 10) : undefined;
  const monthNum = month ? parseInt(month, 10) : undefined;

  const lmdMission = await prisma.localMission.findFirst({
    where: { directorId: session!.user!.id },
  });
  if (!lmdMission)
    return <p className="text-sm text-gray-500">No mission assigned.</p>;

  const [reports, yearRows, districtRows] = await Promise.all([
    prisma.fieldReport.findMany({
      where: {
        trainee: {
          homeMissionId: lmdMission.id,
          ...(district ? {
            applications: { some: { status: "ACCEPTED", presentAddressDistrict: district } },
          } : {}),
        },
        ...(yearNum ? { reportYear: yearNum } : {}),
        ...(monthNum ? { reportMonth: monthNum } : {}),
      },
      orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }],
      include: {
        trainee: { select: { fullName: true } },
        program: { select: { code: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.fieldReport.findMany({
      where: { trainee: { homeMissionId: lmdMission.id } },
      select: { reportYear: true },
      distinct: ["reportYear"],
      orderBy: { reportYear: "desc" },
    }),
    prisma.application.findMany({
      where: {
        status: "ACCEPTED",
        applicant: { homeMissionId: lmdMission.id, isMissionary: true },
        presentAddressDistrict: { not: null },
      },
      select: { presentAddressDistrict: true },
      distinct: ["presentAddressDistrict"],
      orderBy: { presentAddressDistrict: "asc" },
    }),
  ]);

  const years = yearRows.map((r) => r.reportYear);
  const districts = districtRows.map((d) => d.presentAddressDistrict!).filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Field Reports</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {lmdMission.name} · {reports.length} report
            {reports.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Link
            href="/dashboard/lmd/field-reports/immersion"
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Immersion Report
          </Link>
          <PrintButton label="Print Reports" />
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="print:hidden flex flex-wrap items-center gap-2">
        <select
          name="year"
          defaultValue={year ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          name="month"
          defaultValue={month ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All months</option>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select
          name="district"
          defaultValue={district ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All districts</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Filter
        </button>
        {(year || month || district) && (
          <Link
            href="/dashboard/lmd/field-reports"
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">
            No field reports{year || month || district ? " for the selected filters" : " submitted yet from your mission"}.
          </p>
        </div>
      ) : (
        <>
        {/* Print-only header + table */}
        <div className="hidden print:block mb-2">
          <p className="text-xs text-gray-500">
            1000 Missionary Movement Bangladesh — Field Reports · {lmdMission.name}
            {year ? ` · ${year}` : ""}
            {month ? ` · ${MONTHS[monthNum! - 1]}` : ""}
            {district ? ` · ${district}` : ""}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Printed{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="hidden print:block">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-400">
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">#</th>
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">Trainee</th>
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">Period</th>
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">Program</th>
                <th className="py-1.5 pr-2 text-right font-semibold text-gray-700">Activities</th>
                <th className="py-1.5 pr-2 text-right font-semibold text-gray-700">Days</th>
                <th className="py-1.5 pr-2 text-right font-semibold text-gray-700">Baptisms</th>
                <th className="py-1.5 text-right font-semibold text-gray-700">People Reached</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="py-1 pr-2 text-gray-400">{i + 1}</td>
                  <td className="py-1 pr-2 font-medium text-gray-900">{r.trainee.fullName}</td>
                  <td className="py-1 pr-2 text-gray-600">{MONTHS[r.reportMonth - 1]} {r.reportYear}</td>
                  <td className="py-1 pr-2 font-mono text-gray-500">{r.program.code}</td>
                  <td className="py-1 pr-2 text-right text-gray-700">{r.totalActivities}</td>
                  <td className="py-1 pr-2 text-right text-gray-700">{r.daysOfWork}</td>
                  <td className="py-1 pr-2 text-right text-gray-700">{r.numberOfBaptisms}</td>
                  <td className="py-1 text-right text-gray-700">{r.peopleReached ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-right text-[10px] text-gray-400">
            Total: {reports.length} report{reports.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Screen card list */}
        <div className="print:hidden space-y-3">
          {reports.map((r) => (
            <Link
              key={r.id}
              href={`/dashboard/field-reports/${r.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {r.trainee.fullName}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">
                      {MONTHS[r.reportMonth - 1]} {r.reportYear}
                    </span>
                    <span className="font-mono text-[10px] text-gray-400">
                      {r.program.code}
                    </span>
                    {r._count.comments > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        {r._count.comments} comment
                        {r._count.comments !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Activities: {r.totalActivities}</span>
                    <span>Days: {r.daysOfWork}</span>
                    <span>Baptisms: {r.numberOfBaptisms}</span>
                    {r.peopleReached != null && (
                      <span>People reached: {r.peopleReached}</span>
                    )}
                  </div>
                </div>
                <span className="flex-shrink-0 text-[11px] text-gray-400">
                  {new Date(r.submittedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
