// apps/portal/app/dashboard/system-admin/urgent-reports/[id]/page.tsx
import { prisma as db } from "@1000mm/db";
import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Paperclip,
  ExternalLink,
} from "lucide-react";

export const metadata = { title: "Urgent Report Detail" };

export default async function UrgentReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMIN")
    redirect("/dashboard");

  const { id } = await params;

  const [report, totalMissionaries] = await Promise.all([
    db.urgentReport.findUnique({
      where: { id, deletedAt: null },
      include: {
        issuedBy: { select: { fullName: true } },
        submissions: {
          include: {
            user: {
              select: {
                fullName: true,
                homeMission: { select: { code: true } },
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    }),
    db.user.count({
      where: { isMissionary: true, isActive: true, deletedAt: null },
    }),
  ]);

  if (!report) notFound();

  const respondedIds = new Set(report.submissions.map((s) => s.userId));
  const pending = await db.user.findMany({
    where: {
      isMissionary: true,
      isActive: true,
      deletedAt: null,
      id: { notIn: [...respondedIds] },
    },
    select: {
      id: true,
      fullName: true,
      homeMission: { select: { code: true } },
    },
    orderBy: { fullName: "asc" },
  });

  const pct =
    totalMissionaries > 0
      ? Math.round((report.submissions.length / totalMissionaries) * 100)
      : 0;

  const attachments = [1, 2, 3, 4, 5]
    .map((i) => ({
      key: report[`attachment${i}` as keyof typeof report] as string | null,
      name: report[`attachment${i}Name` as keyof typeof report] as
        | string
        | null,
    }))
    .filter((a) => a.key);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/system-admin/urgent-reports"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        All Urgent Reports
      </Link>

      {/* Report card */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
            Urgent
          </span>
          <span className="text-xs text-gray-400">
            Issued by {report.issuedBy.fullName} on{" "}
            {new Date(report.publishedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">
          {report.title}
        </h1>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {report.body}
        </p>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              <Paperclip className="inline h-3.5 w-3.5 mr-1" />
              Attachments
            </p>
            {attachments.map((a, i) => (
              <a
                key={i}
                href={`/api/uploads/${a.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-gray-100 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Paperclip className="h-4 w-4 text-gray-400" />
                <span className="flex-1 truncate">{a.name ?? a.key}</span>
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Response progress */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">
            Response Progress
          </h2>
          <span className="text-sm font-bold text-gray-900">{pct}%</span>
        </div>
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex gap-6 text-sm">
          <span className="flex items-center gap-1.5 text-green-700">
            <CheckCircle className="h-4 w-4" />
            {report.submissions.length} responded
          </span>
          <span className="flex items-center gap-1.5 text-amber-600">
            <Clock className="h-4 w-4" />
            {pending.length} pending
          </span>
        </div>
      </div>

      {/* Responded */}
      {report.submissions.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">
            Responded ({report.submissions.length})
          </h2>
          <div className="space-y-3">
            {report.submissions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-lg border border-green-100 bg-green-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-green-200 px-2 py-0.5 text-xs font-semibold text-green-800">
                      {sub.user.homeMission.code}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {sub.user.fullName}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(sub.submittedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {sub.response && (
                  <p className="mt-2 text-sm text-gray-600 italic">
                    "{sub.response}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-800">
            Awaiting Response ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-4 py-2.5"
              >
                <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  {u.homeMission.code}
                </span>
                <span className="text-sm text-gray-700">{u.fullName}</span>
                <Clock className="ml-auto h-3.5 w-3.5 text-amber-500" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
