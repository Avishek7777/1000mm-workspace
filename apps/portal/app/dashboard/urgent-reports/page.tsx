// apps/portal/app/dashboard/urgent-reports/page.tsx
// Missionary sees all reports — with pending ones highlighted at top.
import { prisma as db } from "@1000mm/db";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

export const metadata = { title: "Urgent Reports" };

export default async function MissionaryUrgentReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { isMissionary: true },
  });
  if (!user?.isMissionary) redirect("/dashboard");

  const reports = await db.urgentReport.findMany({
    where: { deletedAt: null },
    orderBy: { publishedAt: "desc" },
    include: {
      submissions: {
        where: { userId: session.user.id },
        select: { id: true, submittedAt: true },
      },
    },
  });

  const pending = reports.filter((r) => r.submissions.length === 0);
  const completed = reports.filter((r) => r.submissions.length > 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Urgent Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Reports issued by the System Administrator that require your
          acknowledgement.
        </p>
      </div>

      {reports.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <CheckCircle className="mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">
            No urgent reports at this time.
          </p>
        </div>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
            Requires Your Response ({pending.length})
          </p>
          {pending.map((report) => (
            <Link
              key={report.id}
              href={`/dashboard/urgent-reports/${report.id}`}
              className="block rounded-xl border-2 border-red-200 bg-red-50 p-5 hover:bg-red-100 transition-colors"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="rounded-full bg-red-200 px-2 py-0.5 text-xs font-bold text-red-800">
                      Action Required
                    </span>
                    <span className="text-xs text-red-400">
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
                  <p className="font-semibold text-red-900">{report.title}</p>
                  <p className="mt-1 text-sm text-red-700 line-clamp-2">
                    {report.body}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Acknowledged ({completed.length})
          </p>
          {completed.map((report) => (
            <Link
              key={report.id}
              href={`/dashboard/urgent-reports/${report.id}`}
              className="block rounded-xl border border-gray-100 bg-white p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      Acknowledged
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
                  <p className="font-medium text-gray-900">{report.title}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
