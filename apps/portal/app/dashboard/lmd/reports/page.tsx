import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import Link from "next/link";

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

export default async function LmdReportsPage() {
  await requireRole(["LOCAL_DIRECTOR"]);
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
  });

  const mission = await prisma.localMission.findFirst({
    where: { directorId: user!.id },
  });

  // Open windows the LMD hasn't submitted for yet
  const openWindows = await prisma.lmdReportWindow.findMany({
    where: { state: "OPEN" },
    orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }],
  });

  // Submitted reports
  const submittedReports = await prisma.lmdReport.findMany({
    where: { lmdId: user!.id },
    orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }],
    include: {
      window: { select: { state: true } },
    },
  });

  const submittedWindowIds = new Set(submittedReports.map((r) => r.windowId));
  const pendingWindows = openWindows.filter(
    (w) => !submittedWindowIds.has(w.id),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">My Reports</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {mission?.name} · Monthly mission reports for the Union Director
        </p>
      </div>

      {/* Pending windows — action required */}
      {pendingWindows.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-amber-600">
            Action Required
          </p>
          {pendingWindows.map((w) => (
            <div
              key={w.id}
              className="rounded-xl border border-amber-200 bg-amber-50 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Window Open
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {MONTHS[w.reportMonth - 1]} {w.reportYear} Report Due
                  </p>
                  {w.notes && (
                    <p className="mt-0.5 text-xs text-gray-500">{w.notes}</p>
                  )}
                </div>
                <Link
                  href={`/dashboard/lmd/reports/new?windowId=${w.id}`}
                  className="flex-shrink-0 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
                >
                  Submit Report →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submitted reports */}
      <div className="space-y-3">
        {pendingWindows.length === 0 && submittedReports.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <svg
              className="mx-auto mb-3 h-8 w-8 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <p className="text-sm text-gray-400">
              No report windows open and no reports submitted yet.
            </p>
            <p className="mt-1 text-xs text-gray-300">
              The Union Director will open a reporting window when it's time to
              submit.
            </p>
          </div>
        )}

        {submittedReports.length > 0 && (
          <>
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
              Submitted Reports
            </p>
            {submittedReports.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/lmd/reports/${r.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {MONTHS[r.reportMonth - 1]} {r.reportYear}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Trainees: {r.totalTrainees}</span>
                      <span>Activities: {r.totalActivities}</span>
                      <span>Baptisms: {r.totalBaptisms}</span>
                      <span>People reached: {r.totalPeopleReached}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                      ✓ Submitted
                    </span>
                    <p className="mt-1 text-[11px] text-gray-400">
                      {new Date(r.submittedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
