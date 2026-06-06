import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";

export default async function LmdDashboardPage() {
  const user = await requireRole(["LOCAL_DIRECTOR"]);

  // Get the mission this LMD directs
  const lmdUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { directedMission: true },
  });

  const missionId = lmdUser?.directedMission?.id;
  const missionName = lmdUser?.directedMission?.name ?? "Your Mission";

  // Stat counts scoped to this mission
  const [total, pendingReview, recommended, returned] = await Promise.all([
    prisma.application.count({
      where: {
        submittedFromMissionId: missionId,
        deletedAt: null,
        status: { not: "DRAFT" },
      },
    }),
    prisma.application.count({
      where: {
        submittedFromMissionId: missionId,
        deletedAt: null,
        status: { in: ["SUBMITTED", "UNDER_LMD_REVIEW"] },
      },
    }),
    prisma.application.count({
      where: {
        submittedFromMissionId: missionId,
        deletedAt: null,
        status: "RECOMMENDED",
      },
    }),
    prisma.application.count({
      where: {
        submittedFromMissionId: missionId,
        deletedAt: null,
        status: "RETURNED_TO_APPLICANT",
      },
    }),
  ]);

  const stats = [
    {
      label: "Total Applications",
      value: total,
      color: "text-gray-900",
      bg: "bg-gray-50",
      border: "border-gray-200",
    },
    {
      label: "Pending Review",
      value: pendingReview,
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      label: "Recommended",
      value: recommended,
      color: "text-teal-700",
      bg: "bg-teal-50",
      border: "border-teal-200",
    },
    {
      label: "Returned to Applicant",
      value: returned,
      color: "text-orange-700",
      bg: "bg-orange-50",
      border: "border-orange-200",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">LMD Dashboard</h1>
        <p className="mt-0.5 text-sm text-gray-500">{missionName}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border ${s.border} ${s.bg} p-4`}
          >
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/lmd/applications"
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 hover:border-teal-300 hover:shadow-sm transition-all"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50">
            <svg
              width="18"
              height="18"
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
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Review Applications
            </p>
            <p className="text-xs text-gray-500">
              {pendingReview > 0
                ? `${pendingReview} awaiting review`
                : "All caught up"}
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard/lmd/applications?export=true"
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-600"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Export Applicant List
            </p>
            <p className="text-xs text-gray-500">Download PDF or Excel</p>
          </div>
        </Link>
      </div>

      {/* News / Announcements placeholder */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-medium text-gray-900">Latest News</h2>
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 py-8 text-center">
          <p className="text-sm text-gray-400">
            No announcements at this time.
          </p>
          <p className="mt-1 text-xs text-gray-300">
            Announcements from the System Admin will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
