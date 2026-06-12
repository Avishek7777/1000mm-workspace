// apps/portal/app/dashboard/system-admin/urgent-reports/page.tsx
import { prisma as db } from "@1000mm/db";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Plus, Users, CheckCircle, Clock } from "lucide-react";
import { deleteUrgentReportAction } from "@/actions/urgentReports";

export const metadata = { title: "Urgent Reports" };

export default async function UrgentReportsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMIN")
    redirect("/dashboard");

  const totalMissionaries = await db.user.count({
    where: { isMissionary: true, isActive: true, deletedAt: null },
  });

  const reports = await db.urgentReport.findMany({
    where: { deletedAt: null },
    orderBy: { publishedAt: "desc" },
    include: {
      issuedBy: { select: { fullName: true } },
      submissions: { select: { id: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Urgent Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Issue reports that missionaries must acknowledge.
            {totalMissionaries > 0 && (
              <span className="ml-1">
                Currently {totalMissionaries} active{" "}
                {totalMissionaries === 1 ? "missionary" : "missionaries"}.
              </span>
            )}
          </p>
        </div>
        <Link
          href="/dashboard/system-admin/urgent-reports/new"
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Issue Report
        </Link>
      </div>

      {/* List */}
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <AlertTriangle className="mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">No urgent reports issued yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {reports.map((report) => {
            const responded = report.submissions.length;
            const pending = totalMissionaries - responded;
            const pct =
              totalMissionaries > 0
                ? Math.round((responded / totalMissionaries) * 100)
                : 0;

            return (
              <div key={report.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* Title + date */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                        <AlertTriangle className="h-3 w-3" />
                        Urgent
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(report.publishedAt).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    <h2 className="font-semibold text-gray-900 truncate">
                      {report.title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {report.body}
                    </p>

                    {/* Response progress */}
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex-1 max-w-xs">
                        <div className="mb-1 flex justify-between text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {responded} responded
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-500" />
                            {pending} pending
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-green-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-600">
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <Link
                      href={`/dashboard/system-admin/urgent-reports/${report.id}`}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      View
                    </Link>
                    <form action={deleteUrgentReportAction}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                        onClick={(e) => {
                          if (!confirm("Delete this report?"))
                            e.preventDefault();
                        }}
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
