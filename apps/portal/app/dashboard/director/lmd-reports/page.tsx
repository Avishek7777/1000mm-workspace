import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { WindowControls } from "./_components/WindowControls";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default async function DirectorLmdReportsPage() {
  await requireRole(["MAIN_DIRECTOR", "SYSTEM_ADMIN"]);

  const [windows, reports] = await Promise.all([
    prisma.lmdReportWindow.findMany({
      orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }],
      include: {
        _count: { select: { reports: true } },
        createdBy: { select: { fullName: true } },
      },
    }),
    prisma.lmdReport.findMany({
      orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }],
      include: {
        lmd: { select: { fullName: true } },
        mission: { select: { name: true, code: true } },
      },
    }),
  ]);

  const missions = ["EBM", "NBM", "SBM", "WBM"];
  const openWindow = windows.find((w) => w.state === "OPEN");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">LMD Reports</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Monthly mission reports from Local Directors
          </p>
        </div>
        <WindowControls
          openWindow={
            openWindow
              ? {
                  id: openWindow.id,
                  reportMonth: openWindow.reportMonth,
                  reportYear: openWindow.reportYear,
                }
              : null
          }
        />
      </div>

      {/* Open window status */}
      {openWindow && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <p className="text-sm font-medium text-teal-800">
                {MONTHS[openWindow.reportMonth - 1]} {openWindow.reportYear}{" "}
                window is open
              </p>
              <span className="text-xs text-teal-600">
                · {openWindow._count.reports} of {missions.length} LMDs
                submitted
              </span>
            </div>
            <div className="flex gap-2 text-xs text-teal-600">
              {missions.map((m) => {
                const submitted = reports.some(
                  (r) =>
                    r.reportMonth === openWindow.reportMonth &&
                    r.reportYear === openWindow.reportYear &&
                    r.mission.code === m,
                );
                return (
                  <span
                    key={m}
                    className={`rounded-full px-2 py-0.5 ${submitted ? "bg-teal-200 text-teal-800 font-medium" : "bg-teal-100 text-teal-500"}`}
                  >
                    {m} {submitted ? "✓" : "·"}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reports list by window */}
      {windows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">
            No report windows created yet.
          </p>
          <p className="mt-1 text-xs text-gray-300">
            Open a reporting window to allow LMDs to submit their monthly
            reports.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {windows.map((w) => {
            const windowReports = reports.filter(
              (r) =>
                r.reportMonth === w.reportMonth &&
                r.reportYear === w.reportYear,
            );
            return (
              <div key={w.id}>
                <div className="mb-3 flex items-center gap-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {MONTHS[w.reportMonth - 1]} {w.reportYear}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${w.state === "OPEN" ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {w.state}
                  </span>
                  <span className="text-xs text-gray-400">
                    {windowReports.length} / {missions.length} submitted
                  </span>
                </div>

                {windowReports.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-100 bg-gray-50 py-6 text-center text-xs text-gray-400">
                    No reports submitted for this period yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {windowReports.map((r) => (
                      <Link
                        key={r.id}
                        href={`/dashboard/lmd/reports/${r.id}`}
                        className="block rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-all"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {r.mission.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {r.lmd.fullName}
                            </p>
                          </div>
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                            {r.mission.code}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {[
                            { label: "Trainees", value: r.totalTrainees },
                            { label: "Baptisms", value: r.totalBaptisms },
                            { label: "Reached", value: r.totalPeopleReached },
                          ].map((m) => (
                            <div
                              key={m.label}
                              className="rounded-lg bg-gray-50 p-2"
                            >
                              <p className="text-[10px] text-gray-400">
                                {m.label}
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {m.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
