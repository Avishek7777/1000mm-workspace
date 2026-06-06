import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import Link from "next/link";

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

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ComplaintsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { homeMission: { select: { code: true } } },
  });
  if (!user) redirect("/login");

  const canSubmit = ["TRAINEE", "LOCAL_DIRECTOR"].includes(user.role);
  const isStaff = ["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(user.role);
  const isLmd = user.role === "LOCAL_DIRECTOR";

  // Build query based on role
  let complaints: any[] = [];

  if (isStaff) {
    // UD and SA see all complaints
    complaints = await prisma.complaint.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { submittedBy: { select: { fullName: true } } },
    });
  } else if (isLmd) {
    // LMD sees complaints from their mission
    complaints = await prisma.complaint.findMany({
      where: {
        deletedAt: null,
        missionCode: user.homeMission?.code as any,
      },
      orderBy: { createdAt: "desc" },
      include: { submittedBy: { select: { fullName: true } } },
    });
  } else {
    // TRAINEE: sees their own non-anonymous complaints only
    complaints = await prisma.complaint.findMany({
      where: {
        deletedAt: null,
        submittedById: user.id,
        isAnonymous: false,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  const unresolved = complaints.filter((c) => !c.isResolved).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Complaints &amp; Feedback
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {isStaff
              ? `${complaints.length} total · ${unresolved} unresolved`
              : isLmd
                ? `${complaints.length} from your mission · ${unresolved} unresolved`
                : "Your submitted complaints"}
          </p>
        </div>
        {canSubmit && (
          <Link
            href="/dashboard/complaints/new"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Submit Complaint
          </Link>
        )}
      </div>

      {/* Anonymous note for trainees */}
      {user.role === "TRAINEE" && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
          Anonymous complaints are not shown here by design — they cannot be
          traced back to you. Only complaints where you revealed your identity
          appear in this list.
        </div>
      )}

      {/* Empty state */}
      {complaints.length === 0 && (
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
              d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
            />
          </svg>
          <p className="text-sm text-gray-400">No complaints found.</p>
          {canSubmit && (
            <Link
              href="/dashboard/complaints/new"
              className="mt-2 inline-block text-xs text-teal-600 hover:underline"
            >
              Submit your first complaint →
            </Link>
          )}
        </div>
      )}

      {/* Complaints list */}
      <div className="space-y-3">
        {complaints.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/complaints/${c.id}`}
            className={`block rounded-xl border bg-white p-5 transition-all hover:shadow-sm ${
              !c.isResolved ? "border-gray-200" : "border-gray-100 opacity-75"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[c.category]}`}
                  >
                    {CATEGORY_LABELS[c.category] ?? c.category}
                  </span>
                  {c.isResolved ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Resolved
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      Pending
                    </span>
                  )}
                  {c.isAnonymous && (isStaff || isLmd) && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                      Anonymous
                    </span>
                  )}
                  {c.missionCode && isStaff && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                      {c.missionCode}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {c.subject}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                  {c.description}
                </p>
                {!c.isAnonymous && c.submittedBy && (isStaff || isLmd) && (
                  <p className="mt-1 text-[11px] text-gray-400">
                    by {c.submittedBy.fullName}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-[11px] text-gray-400">
                  {timeAgo(c.createdAt)}
                </p>
                {c.response && (
                  <p className="mt-1 text-[11px] text-teal-600">Has response</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
