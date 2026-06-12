// apps/portal/app/dashboard/urgent-reports/[id]/page.tsx
import { prisma as db } from "@1000mm/db";
import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import { submitUrgentReportResponseAction } from "@/actions/urgentReports";

export const metadata = { title: "Urgent Report" };

export default async function MissionaryUrgentReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { isMissionary: true },
  });
  if (!user?.isMissionary) redirect("/dashboard");

  const { id } = await params;

  const report = await db.urgentReport.findUnique({
    where: { id, deletedAt: null },
    include: {
      issuedBy: { select: { fullName: true } },
    },
  });

  if (!report) notFound();

  const submission = await db.urgentReportSubmission.findUnique({
    where: { reportId_userId: { reportId: id, userId: session.user.id } },
  });

  const hasSubmitted = !!submission;

  const attachments = [1, 2, 3, 4, 5]
    .map((i) => ({
      key: report[`attachment${i}` as keyof typeof report] as string | null,
      name: report[`attachment${i}Name` as keyof typeof report] as
        | string
        | null,
    }))
    .filter((a) => a.key);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/urgent-reports"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        All Reports
      </Link>

      {/* Status banner */}
      {hasSubmitted ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-800">
              You have acknowledged this report.
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              Submitted on{" "}
              {new Date(submission!.submittedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            {submission?.response && (
              <p className="mt-1.5 text-sm text-green-700 italic">
                "{submission.response}"
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border-2 border-red-200 bg-red-50 px-5 py-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-800">
            This report requires your acknowledgement. Please read carefully and
            submit below.
          </p>
        </div>
      )}

      {/* Report content */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="mb-1 text-xs text-gray-400">
          Issued by {report.issuedBy.fullName} ·{" "}
          {new Date(report.publishedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h1 className="text-xl font-bold text-gray-900">{report.title}</h1>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {report.body}
        </p>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
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
                <span className="flex-1 truncate">
                  {a.name ?? `Attachment ${i + 1}`}
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Acknowledgement form */}
      {!hasSubmitted && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-gray-800">
            Acknowledge This Report
          </h2>
          <p className="mb-4 text-xs text-gray-500">
            You may add an optional response or note before submitting.
          </p>
          <form action={submitUrgentReportResponseAction} className="space-y-4">
            <input type="hidden" name="reportId" value={id} />
            <textarea
              name="response"
              rows={3}
              placeholder="Optional: add a note or response (e.g. 'Understood and will comply.')"
              className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200 resize-none"
            />
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              Acknowledge & Submit
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
