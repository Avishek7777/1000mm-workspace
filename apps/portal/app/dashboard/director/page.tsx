import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";

const MISSION_COLORS: Record<
  string,
  { bg: string; text: string; border: string; dot: string }
> = {
  EBM: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  NBM: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    dot: "bg-teal-500",
  },
  SBM: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  WBM: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
};

export default async function DirectorDashboardPage() {
  const user = await requireRole(["MAIN_DIRECTOR", "SYSTEM_ADMIN"]);
  // ⚠ No settings gate here — gates belong on the pages they protect,
  //   never on the page you'd redirect TO (causes infinite loop).

  const currentYear = new Date().getFullYear();

  const [
    awaitingDecision,
    acceptedThisCycle,
    rejectedThisCycle,
    returnedToLmd,
  ] = await Promise.all([
    prisma.application.count({
      where: {
        deletedAt: null,
        status: { in: ["RECOMMENDED", "UNDER_MAIN_DIRECTOR_REVIEW"] },
      },
    }),
    prisma.application.count({
      where: {
        deletedAt: null,
        status: "ACCEPTED",
        lastTransitionAt: {
          gte: new Date(`${currentYear}-01-01`),
          lt: new Date(`${currentYear + 1}-01-01`),
        },
      },
    }),
    prisma.application.count({
      where: {
        deletedAt: null,
        status: "REJECTED",
        rejectionReason: { not: null },
        lastTransitionAt: {
          gte: new Date(`${currentYear}-01-01`),
          lt: new Date(`${currentYear + 1}-01-01`),
        },
      },
    }),
    prisma.application.count({
      where: { deletedAt: null, status: "RETURNED_TO_LMD" },
    }),
  ]);

  const missions = await prisma.localMission.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });

  const missionStats = await Promise.all(
    missions.map(async (mission) => {
      const [recommended, accepted, pending] = await Promise.all([
        prisma.application.count({
          where: {
            submittedFromMissionId: mission.id,
            deletedAt: null,
            status: { in: ["RECOMMENDED", "UNDER_MAIN_DIRECTOR_REVIEW"] },
          },
        }),
        prisma.application.count({
          where: {
            submittedFromMissionId: mission.id,
            deletedAt: null,
            status: "ACCEPTED",
            lastTransitionAt: { gte: new Date(`${currentYear}-01-01`) },
          },
        }),
        prisma.application.count({
          where: {
            submittedFromMissionId: mission.id,
            deletedAt: null,
            status: { in: ["SUBMITTED", "UNDER_LMD_REVIEW"] },
          },
        }),
      ]);
      return { ...mission, recommended, accepted, pending };
    }),
  );

  const recentRecommended = await prisma.application.findMany({
    where: {
      deletedAt: null,
      status: { in: ["RECOMMENDED", "UNDER_MAIN_DIRECTOR_REVIEW"] },
    },
    orderBy: { lastTransitionAt: "desc" },
    take: 5,
    select: {
      id: true,
      referenceNumber: true,
      applicantFullName: true,
      status: true,
      lastTransitionAt: true,
      submittedFromMission: { select: { code: true } },
      recommendation: {
        select: {
          recommender: { select: { fullName: true } },
          recommendedAt: true,
        },
      },
    },
  });

  const topStats = [
    {
      label: "Awaiting Decision",
      value: awaitingDecision,
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      href: "/dashboard/director/applications?status=RECOMMENDED",
    },
    {
      label: "Accepted This Year",
      value: acceptedThisCycle,
      color: "text-green-700",
      bg: "bg-green-50",
      border: "border-green-200",
      href: "/dashboard/director/applications?status=ACCEPTED",
    },
    {
      label: "Rejected This Year",
      value: rejectedThisCycle,
      color: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
      href: "/dashboard/director/applications?status=REJECTED",
    },
    {
      label: "Returned to LMD",
      value: returnedToLmd,
      color: "text-orange-700",
      bg: "bg-orange-50",
      border: "border-orange-200",
      href: "/dashboard/director/applications?status=RETURNED_TO_LMD",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Union Director Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Bangladesh Adventist Union Mission · {currentYear}
          </p>
        </div>
        {awaitingDecision > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            {awaitingDecision} pending{" "}
            {awaitingDecision === 1 ? "decision" : "decisions"}
          </span>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {topStats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`rounded-xl border ${s.border} ${s.bg} p-4 transition-all hover:shadow-sm hover:scale-[1.01]`}
          >
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Mission breakdown + recent recommended */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Breakdown by Mission
          </h2>
          <div className="space-y-3">
            {missionStats.map((m) => {
              const colors = MISSION_COLORS[m.code] ?? MISSION_COLORS.EBM;
              return (
                <div
                  key={m.id}
                  className={`flex items-center justify-between rounded-lg border ${colors.border} ${colors.bg} px-4 py-3`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 flex-shrink-0 rounded-full ${colors.dot}`}
                    />
                    <div>
                      <p className={`text-xs font-semibold ${colors.text}`}>
                        {m.code}
                      </p>
                      <p className="text-[10px] text-gray-500">{m.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-[10px] text-gray-400">Pending LMD</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {m.pending}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Recommended</p>
                      <p
                        className={`text-sm font-semibold ${m.recommended > 0 ? colors.text : "text-gray-400"}`}
                      >
                        {m.recommended}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Accepted</p>
                      <p className="text-sm font-semibold text-green-700">
                        {m.accepted}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Recently Recommended
            </h2>
            <Link
              href="/dashboard/director/applications?status=RECOMMENDED"
              className="text-xs text-teal-600 hover:underline"
            >
              View all →
            </Link>
          </div>
          {recentRecommended.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 py-8 text-center">
              <p className="text-sm text-gray-400">
                No applications awaiting decision.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentRecommended.map((app) => {
                const mCode = app.submittedFromMission.code;
                const colors = MISSION_COLORS[mCode] ?? MISSION_COLORS.EBM;
                return (
                  <li key={app.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${colors.bg} ${colors.text}`}
                          >
                            {mCode}
                          </span>
                          <p className="truncate text-xs font-medium text-gray-900">
                            {app.applicantFullName}
                          </p>
                        </div>
                        <p className="mt-0.5 text-[10px] text-gray-400">
                          {app.referenceNumber ?? "—"} ·{" "}
                          {app.recommendation?.recommender?.fullName ??
                            "Unknown LMD"}{" "}
                          ·{" "}
                          {app.recommendation?.recommendedAt
                            ? new Date(
                                app.recommendation.recommendedAt,
                              ).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                              })
                            : "—"}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/director/applications/${app.id}`}
                        className="flex-shrink-0 rounded-lg border border-teal-300 bg-white px-2.5 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50 transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            href: "/dashboard/director/applications",
            label: "All Applications",
            sub: "Cross-mission view",
            color: "teal",
            icon: (
              <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </>
            ),
          },
          {
            href: "/dashboard/director/programs",
            label: "Training Programs",
            sub: "Manage cycles & windows",
            color: "blue",
            icon: (
              <>
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </>
            ),
          },
          {
            href: "/dashboard/director/reports",
            label: "Reports",
            sub: "Analytics & exports",
            color: "purple",
            icon: (
              <>
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </>
            ),
          },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 hover:border-${a.color}-300 hover:shadow-sm transition-all`}
          >
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-${a.color}-50`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-${a.color}-600`}
              >
                {a.icon}
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{a.label}</p>
              <p className="text-xs text-gray-500">{a.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Announcements */}
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
