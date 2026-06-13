import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import type { ApplicationStatus } from "@1000mm/db";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "NO_APPLICATION" | "APPLYING" | "DEPLOYED";

// ─── Status config ────────────────────────────────────────────────────────────

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
    message: "Your application has been submitted and is awaiting review.",
  },
  UNDER_LMD_REVIEW: {
    label: "Under Review",
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    message:
      "Your application is being reviewed by your Local Mission Director.",
  },
  RETURNED_TO_APPLICANT: {
    label: "Returned",
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
      "Your application has been recommended by your Local Mission Director. Awaiting final review.",
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
      "Your application has been returned to your Local Mission Director for further review.",
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

// ─── Progress steps ───────────────────────────────────────────────────────────

const STEPS = [
  {
    label: "Submitted",
    statuses: [
      "SUBMITTED",
      "UNDER_LMD_REVIEW",
      "RETURNED_TO_APPLICANT",
      "RECOMMENDED",
      "UNDER_MAIN_DIRECTOR_REVIEW",
      "RETURNED_TO_LMD",
      "ACCEPTED",
      "REJECTED",
    ],
  },
  {
    label: "LMD Review",
    statuses: [
      "RECOMMENDED",
      "UNDER_MAIN_DIRECTOR_REVIEW",
      "RETURNED_TO_LMD",
      "ACCEPTED",
      "REJECTED",
    ],
  },
  {
    label: "Recommended",
    statuses: [
      "UNDER_MAIN_DIRECTOR_REVIEW",
      "RETURNED_TO_LMD",
      "ACCEPTED",
      "REJECTED",
    ],
  },
  {
    label: "Final Review",
    statuses: ["ACCEPTED", "REJECTED"],
  },
  {
    label: "Accepted",
    statuses: ["ACCEPTED"],
  },
];

function StepProgress({ status }: { status: ApplicationStatus }) {
  return (
    <div className="flex items-center mt-5">
      {STEPS.map((step, i) => {
        const complete = step.statuses.includes(status);
        const isLast = i === STEPS.length - 1;
        return (
          <div
            key={step.label}
            className="flex items-center flex-1 last:flex-none"
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                  complete
                    ? "bg-teal-600 border-teal-600 text-white"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {complete ? (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="text-[10px] font-bold">{i + 1}</span>
                )}
              </div>
              <span
                className={`mt-1 text-[10px] whitespace-nowrap ${complete ? "text-teal-700 font-medium" : "text-gray-400"}`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-4 ${complete ? "bg-teal-500" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Locked feature card ──────────────────────────────────────────────────────

function LockedCard({ title, reason }: { title: string; reason: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 opacity-60">
      <div className="flex items-center gap-2 mb-1">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-400"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <h2 className="text-sm font-medium text-gray-500">{title}</h2>
      </div>
      <p className="text-xs text-gray-400">{reason}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TraineeDashboard() {
  const user = await requireRole(["TRAINEE"]);

  // Fetch most recent application with related data
  const application = await prisma.application.findFirst({
    where: { applicantId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      window: {
        include: {
          program: {
            select: { title: true, startDate: true, endDate: true },
          },
        },
      },
      documents: {
        where: { deletedAt: null },
        select: { id: true, kind: true, fileName: true, createdAt: true },
      },
      enrollment: {
        select: {
          attendanceConfirmed: true,
          certificateIssued: true,
          deploymentLocation: true,
        },
      },
    },
  });

  // Check for open window if no application exists
  const openWindow = !application
    ? await prisma.applicationWindow.findFirst({
        where: { state: "OPEN", deletedAt: null },
        include: { program: { select: { title: true } } },
        orderBy: { applicationCloseDate: "asc" },
      })
    : null;

  // Derive phase
  const phase: Phase = !application
    ? "NO_APPLICATION"
    : application.status === "ACCEPTED" &&
        application.enrollment?.certificateIssued &&
        application.enrollment?.deploymentLocation
      ? "DEPLOYED"
      : "APPLYING";

  const statusConfig = application ? STATUS_CONFIG[application.status] : null;
  const isDeployed = phase === "DEPLOYED";
  const isAccepted = application?.status === "ACCEPTED";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">
            Welcome back, {user.name?.split(" ")[0] ?? "Trainee"}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            1000 Missionary Movement Bangladesh
          </p>
        </div>
        {isDeployed && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Active Missionary
          </span>
        )}
        {isAccepted && !isDeployed && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Accepted
          </span>
        )}
      </div>

      {/* ── PHASE: NO APPLICATION ── */}
      {phase === "NO_APPLICATION" && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-teal-600"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="text-sm font-medium text-gray-900 mb-1">
            Start your application
          </h2>
          {openWindow ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Applications are open for{" "}
                <span className="font-medium text-gray-700">
                  {openWindow.program.title}
                </span>
                . Apply before{" "}
                {new Date(openWindow.applicationCloseDate).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "long", year: "numeric" },
                )}
                .
              </p>
              <Link
                href="/dashboard/my-application/new"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
              >
                Start Application
              </Link>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              There are no open application windows at this time. Check back
              later or contact your Local Mission Director.
            </p>
          )}
        </div>
      )}

      {/* ── PHASE: APPLYING ── */}
      {phase === "APPLYING" && application && statusConfig && (
        <>
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
                    <span className="text-xs text-gray-400 font-mono">
                      · {application.referenceNumber}
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-medium text-gray-900">
                  {application.window.program.title}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {statusConfig.message}
                </p>

                {/* LMD comment if returned */}
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

              {/* Action button */}
              {(application.status === "DRAFT" ||
                application.status === "RETURNED_TO_APPLICANT") && (
                <Link
                  href={`/dashboard/my-application/${application.id}/edit`}
                  className="flex-shrink-0 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 transition-colors"
                >
                  {application.status === "DRAFT"
                    ? "Continue"
                    : "Edit & Resubmit"}
                </Link>
              )}
            </div>

            {/* Progress stepper */}
            {!["DRAFT", "REJECTED", "WITHDRAWN"].includes(
              application.status,
            ) && <StepProgress status={application.status} />}
          </div>

          {/* Two column — Documents + Program info */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Documents */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-medium text-gray-900">
                My Documents
              </h2>
              {application.documents.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No documents uploaded yet.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {application.documents.slice(0, 6).map((doc) => (
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
              {application.documents.length > 6 && (
                <p className="mt-2 text-xs text-teal-700 font-medium">
                  +{application.documents.length - 6} more
                </p>
              )}
            </div>

            {/* Program info */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-medium text-gray-900">
                Program Details
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
                    Program
                  </p>
                  <p className="text-sm text-gray-900">
                    {application.window.program.title}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
                    Training Period
                  </p>
                  <p className="text-sm text-gray-900">
                    {new Date(
                      application.window.program.startDate,
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    —{" "}
                    {new Date(
                      application.window.program.endDate,
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
                    Mission
                  </p>
                  <p className="text-sm text-gray-900">
                    {user.homeMissionCode}
                  </p>
                </div>
                {application.referenceNumber && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
                      Reference Number
                    </p>
                    <p className="text-sm font-mono text-gray-900">
                      {application.referenceNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Locked missionary features */}
          {application.status === "ACCEPTED" && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <LockedCard
                title="Field Reports"
                reason="You will be able to submit monthly field reports once your deployment location has been assigned."
              />
              <LockedCard
                title="My Certificate"
                reason="Your certificate will be available here once it has been issued by the Union Director."
              />
            </div>
          )}
        </>
      )}

      {/* ── PHASE: DEPLOYED (Active Missionary) ── */}
      {phase === "DEPLOYED" && application && (
        <>
          {/* Deployment info banner */}
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-teal-700"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-teal-700 uppercase tracking-wide">
                  Deployment Location
                </p>
                <p className="text-sm font-medium text-teal-900">
                  {application.enrollment?.deploymentLocation}
                </p>
              </div>
              {application.referenceNumber && (
                <div className="ml-auto text-right">
                  <p className="text-[10px] text-teal-500 uppercase tracking-wide">
                    Reference
                  </p>
                  <p className="text-xs font-mono text-teal-800">
                    {application.referenceNumber}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Active features grid */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Field Reports */}
            <Link
              href="/dashboard/field-reports"
              className="rounded-xl border border-gray-200 bg-white p-5 hover:border-teal-300 hover:shadow-sm transition-all"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 mb-3">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-teal-600"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900">
                Field Reports
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Submit your monthly progress report
              </p>
            </Link>

            {/* My Program */}
            <Link
              href="/dashboard/my-program"
              className="rounded-xl border border-gray-200 bg-white p-5 hover:border-teal-300 hover:shadow-sm transition-all"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 mb-3">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-600"
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900">My Program</h3>
              <p className="mt-1 text-xs text-gray-500">
                {application.window.program.title}
              </p>
            </Link>

            {/* Certificate */}
            <Link
              href="/dashboard/my-application/certificate"
              className="rounded-xl border border-gray-200 bg-white p-5 hover:border-teal-300 hover:shadow-sm transition-all"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 mb-3">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-600"
                >
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900">
                My Certificate
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Download your completion certificate
              </p>
            </Link>
          </div>

          {/* Documents */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-medium text-gray-900">
              My Documents
            </h2>
            {application.documents.length === 0 ? (
              <p className="text-sm text-gray-400">No documents on file.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {application.documents.slice(0, 5).map((doc) => (
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
        </>
      )}
    </div>
  );
}
