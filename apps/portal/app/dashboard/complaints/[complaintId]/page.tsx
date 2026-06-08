import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { RespondForm } from "./_components/RespondForm";

const CATEGORY_LABELS: Record<string, string> = {
  GRIEVANCE: "Grievance",
  SUGGESTION: "Suggestion",
  GENERAL_FEEDBACK: "General Feedback",
};

const CATEGORY_COLORS: Record<string, string> = {
  GRIEVANCE: "bg-red-100 text-red-700",
  SUGGESTION: "bg-blue-100 text-blue-700",
  GENERAL_FEEDBACK: "bg-gray-100 text-gray-600",
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ complaintId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { complaintId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) redirect("/login");

  const complaint = await prisma.complaint.findFirst({
    where: { id: complaintId },
    include: {
      submittedBy: { select: { fullName: true, email: true } },
      resolvedBy: { select: { fullName: true, role: true } },
    },
  });

  if (!complaint) redirect("/dashboard/complaints");

  // Access control
  const isStaff = ["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(user.role);
  const isOwner = complaint.submittedById === user.id;

  // LMD can only view their own non-anonymous complaints
  const canView = isStaff || (isOwner && !complaint.isAnonymous);
  if (!canView) redirect("/dashboard/complaints");

  const canRespond = isStaff && !complaint.isResolved;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back */}
      <Link href="/dashboard/complaints" className="text-xs text-gray-500 hover:text-gray-700">
        ← Back to Complaints
      </Link>

      {/* Header card */}
      <div className={`rounded-xl border bg-white p-6 ${complaint.isResolved ? "border-teal-200" : "border-gray-200"}`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[complaint.category]}`}>
              {CATEGORY_LABELS[complaint.category] ?? complaint.category}
            </span>
            {complaint.isResolved ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Resolved
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                Pending
              </span>
            )}
            {complaint.isAnonymous && isStaff && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
                Anonymous
              </span>
            )}
          </div>
          <span className="flex-shrink-0 text-xs text-gray-400">{formatDate(complaint.createdAt)}</span>
        </div>

        <h1 className="mb-3 text-base font-semibold text-gray-900">{complaint.subject}</h1>
        <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{complaint.description}</p>

        {/* Submitter info — shown to staff/LMD only if non-anonymous */}
        {!complaint.isAnonymous && complaint.submittedBy && isStaff && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <div>
              <p className="text-xs font-medium text-gray-700">{complaint.submittedBy.fullName}</p>
              <p className="text-[11px] text-gray-400">{complaint.submittedBy.email}</p>
            </div>
            {complaint.missionCode && (
              <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                {complaint.missionCode}
              </span>
            )}
          </div>
        )}

        {/* Anonymous mission code for staff */}
        {complaint.isAnonymous && complaint.missionCode && isStaff && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Mission: {complaint.missionCode} (submitter anonymous)
          </div>
        )}
      </div>

      {/* Response section */}
      {complaint.isResolved && complaint.response && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Response</p>
            {complaint.resolvedAt && (
              <p className="text-[11px] text-teal-600">{formatDate(complaint.resolvedAt)}</p>
            )}
          </div>
          <p className="whitespace-pre-wrap text-sm text-teal-900 leading-relaxed">{complaint.response}</p>
          {complaint.resolvedBy && (
            <p className="mt-3 text-[11px] text-teal-600">
              — {complaint.resolvedBy.fullName}
            </p>
          )}
        </div>
      )}

      {/* Respond form — UD/SA only, unresolved only */}
      {canRespond && <RespondForm complaintId={complaintId} />}

      {/* Pending note for non-staff */}
      {!isStaff && !complaint.isResolved && (
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500 text-center">
          Your complaint is being reviewed. You'll be notified when a response is available.
        </div>
      )}
    </div>
  );
}