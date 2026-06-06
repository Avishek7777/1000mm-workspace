import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PdfDownloadButton } from "./_components/PdfDownloadButton";
import type { ApplicationStatus } from "@1000mm/db";

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; color: string; bg: string; border: string; message: string }
> = {
  DRAFT: {
    label: "Draft",
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    message: "Your application is saved as a draft. Continue filling it out.",
  },
  SUBMITTED: {
    label: "Submitted",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    message: "Your application has been submitted and is awaiting LMD review.",
  },
  UNDER_LMD_REVIEW: {
    label: "Under LMD Review",
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    message:
      "Your application is being reviewed by your Local Mission Director.",
  },
  RETURNED_TO_APPLICANT: {
    label: "Returned to You",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    message:
      "Your application was returned. Please review the comment and resubmit.",
  },
  RECOMMENDED: {
    label: "Recommended",
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
    message:
      "Recommended by your LMD. Awaiting final review by the Union Director.",
  },
  UNDER_MAIN_DIRECTOR_REVIEW: {
    label: "Final Review",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    message: "Your application is under final review by the Union Director.",
  },
  RETURNED_TO_LMD: {
    label: "Returned to LMD",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    message:
      "Your application has been returned to your LMD for further review.",
  },
  ACCEPTED: {
    label: "Accepted",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    message:
      "Congratulations! Your application has been accepted. Welcome to 1000MM.",
  },
  REJECTED: {
    label: "Not Approved",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    message: "Your application was not approved for this cycle.",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    color: "text-gray-500",
    bg: "bg-gray-50",
    border: "border-gray-200",
    message: "You have withdrawn your application.",
  },
};

export default async function MyApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await requireRole(["TRAINEE"]);
  const { submitted } = await searchParams;

  const application = await prisma.application.findFirst({
    where: { applicantId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      window: {
        include: {
          program: { select: { title: true, startDate: true, endDate: true } },
        },
      },
      submittedFromMission: { select: { name: true } },
      documents: {
        where: { deletedAt: null },
        select: { id: true, kind: true, fileName: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // No application at all — send to new form
  if (!application) {
    redirect("/dashboard/my-application/new");
  }

  // Draft — send back to the form
  if (application.status === "DRAFT") {
    redirect("/dashboard/my-application/new");
  }

  const statusConfig = STATUS_CONFIG[application.status];
  const justSubmitted = submitted === "true";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            My Application
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {application.window.program.title}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Just submitted banner */}
      {justSubmitted && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-4 w-4 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">
              Application submitted successfully!
            </p>
            <p className="text-xs text-green-600">
              Your Local Mission Director will review it shortly.
            </p>
          </div>
        </div>
      )}

      {/* Status card */}
      <div
        className={`rounded-xl border ${statusConfig.border} ${statusConfig.bg} p-5`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-semibold uppercase tracking-wide ${statusConfig.color}`}
              >
                {statusConfig.label}
              </span>
              {application.referenceNumber && (
                <span className="font-mono text-xs text-gray-500">
                  · {application.referenceNumber}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{statusConfig.message}</p>

            {/* LMD comment */}
            {application.status === "RETURNED_TO_APPLICANT" &&
              application.lmdReviewerComment && (
                <div className="mt-3 rounded-lg border border-orange-200 bg-white p-3">
                  <p className="text-xs font-medium text-orange-700 mb-1">
                    Comment from Local Mission Director:
                  </p>
                  <p className="text-sm text-gray-700">
                    {application.lmdReviewerComment}
                  </p>
                </div>
              )}

            {/* Rejection reason */}
            {application.status === "REJECTED" &&
              application.rejectionReason && (
                <div className="mt-3 rounded-lg border border-red-200 bg-white p-3">
                  <p className="text-xs font-medium text-red-700 mb-1">
                    Reason:
                  </p>
                  <p className="text-sm text-gray-700">
                    {application.rejectionReason}
                  </p>
                </div>
              )}
          </div>

          {/* Edit button if returned */}
          {application.status === "RETURNED_TO_APPLICANT" && (
            <Link
              href={`/dashboard/my-application/new`}
              className="flex-shrink-0 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 transition-colors"
            >
              Edit & Resubmit
            </Link>
          )}
        </div>
      </div>

      {/* PDF Download */}
      {application.referenceNumber && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-1 text-sm font-medium text-gray-900">
            Bio Data PDF
          </h2>
          <p className="mb-4 text-xs text-gray-500">
            Download a copy of your submitted bio data form.
          </p>
          <PdfDownloadButton
            applicationId={application.id}
            referenceNumber={application.referenceNumber}
            missionName={application.submittedFromMission.name}
            programTitle={application.window.program.title}
          />
        </div>
      )}

      {/* Application details */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-medium text-gray-900">
          Application Details
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
              Program
            </p>
            <p className="mt-0.5 text-sm text-gray-900">
              {application.window.program.title}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
              Mission
            </p>
            <p className="mt-0.5 text-sm text-gray-900">
              {application.submittedFromMission.name}
            </p>
          </div>
          {application.referenceNumber && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
                Reference No
              </p>
              <p className="mt-0.5 font-mono text-sm text-gray-900">
                {application.referenceNumber}
              </p>
            </div>
          )}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
              Training Start
            </p>
            <p className="mt-0.5 text-sm text-gray-900">
              {new Date(
                application.window.program.startDate,
              ).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
              Training End
            </p>
            <p className="mt-0.5 text-sm text-gray-900">
              {new Date(application.window.program.endDate).toLocaleDateString(
                "en-GB",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                },
              )}
            </p>
          </div>
          {application.submittedAt && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
                Submitted
              </p>
              <p className="mt-0.5 text-sm text-gray-900">
                {new Date(application.submittedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-medium text-gray-900">
          Uploaded Documents
        </h2>
        {application.documents.length === 0 ? (
          <p className="text-sm text-gray-400">No documents uploaded.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {application.documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 py-2.5">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-500"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-900">
                    {doc.fileName}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {doc.kind.replace(/_/g, " ").toLowerCase()} ·{" "}
                    {new Date(doc.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
