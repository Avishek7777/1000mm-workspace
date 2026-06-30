import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { StatCards } from "./_components/stat-cards";
import { PendingActions } from "./_components/pending-actions";
import { MissionsBreakdown } from "./_components/missions-breakdown";

// ─── Icons ────────────────────────────────────────────────────────────────────

const USERS_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const APPLICATIONS_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const PROGRAMS_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const MISSIONS_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const NEW_USER_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

const FLAG_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const TRAINER_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
);

const SETTINGS_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// ─── Mission color palette ────────────────────────────────────────────────────

const MISSION_COLORS: Record<string, string> = {
  EBM: "#1D9E75",
  NBM: "#378ADD",
  SBM: "#D85A30",
  WBM: "#BA7517",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SystemAdminDashboard() {
  const user = await requireRole(["SYSTEM_ADMIN"]);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const [
    totalUsers,
    newUsersThisMonth,
    activeApplications,
    openWindows,
    activePrograms,
    upcomingPrograms,
    missions,
    missionaryCounts,
    pendingTrainerApps,
    pendingFlagRequests,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.application.count({
      where: {
        deletedAt: null,
        status: { in: ["SUBMITTED", "UNDER_LMD_REVIEW", "RECOMMENDED", "UNDER_MAIN_DIRECTOR_REVIEW"] },
      },
    }),
    prisma.applicationWindow.count({ where: { state: "OPEN" } }),
    prisma.trainingProgram.count({ where: { deletedAt: null, isPublished: true } }),
    prisma.trainingProgram.count({
      where: { deletedAt: null, isPublished: true, startDate: { gt: now } },
    }),
    prisma.localMission.findMany({
      where: { deletedAt: null },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
    prisma.user.groupBy({
      by: ["homeMissionId"],
      where: { isMissionary: true, isActive: true, deletedAt: null },
      _count: { id: true },
    }),
    prisma.trainerApplication.count({ where: { status: "PENDING" } }),
    prisma.userFlagRequest.count({ where: { status: "PENDING" } }),
  ]);

  const missionCountMap = new Map(
    missionaryCounts.map((m) => [m.homeMissionId, m._count.id]),
  );

  const statsCards = [
    {
      label: "Total users",
      value: String(totalUsers),
      delta: newUsersThisMonth > 0 ? `+${newUsersThisMonth} this month` : "No new users this month",
      icon: USERS_ICON,
    },
    {
      label: "Active applications",
      value: String(activeApplications),
      delta: openWindows > 0 ? `${openWindows} window${openWindows !== 1 ? "s" : ""} open` : "No open windows",
      icon: APPLICATIONS_ICON,
    },
    {
      label: "Programs running",
      value: String(activePrograms),
      delta: upcomingPrograms > 0 ? `${upcomingPrograms} upcoming` : "None upcoming",
      icon: PROGRAMS_ICON,
    },
    {
      label: "Local missions",
      value: String(missions.length),
      delta: missions.map((m) => m.code).join(" · "),
      icon: MISSIONS_ICON,
    },
  ];

  const pendingActions = [
    ...(pendingTrainerApps > 0
      ? [
          {
            title: "Trainer applications",
            meta: `${pendingTrainerApps} pending review`,
            href: "/dashboard/system-admin/trainer-applications",
            badge: String(pendingTrainerApps),
            badgeVariant: "new" as const,
            iconVariant: "teal" as const,
            icon: TRAINER_ICON,
          },
        ]
      : []),
    ...(pendingFlagRequests > 0
      ? [
          {
            title: "Flag requests",
            meta: `${pendingFlagRequests} awaiting SA decision`,
            href: "/dashboard/users/flag-requests",
            badge: String(pendingFlagRequests),
            badgeVariant: "pending" as const,
            iconVariant: "amber" as const,
            icon: FLAG_ICON,
          },
        ]
      : []),
    {
      title: "User management",
      meta: `${totalUsers} total users · ${newUsersThisMonth} new this month`,
      href: "/dashboard/users",
      iconVariant: "blue" as const,
      icon: NEW_USER_ICON,
    },
    {
      title: "System settings",
      meta: "Review access controls and feature flags",
      href: "/dashboard/settings",
      iconVariant: "blue" as const,
      icon: SETTINGS_ICON,
    },
  ];

  const missionsBreakdown = missions.map((m) => ({
    code: m.code,
    name: m.name,
    count: missionCountMap.get(m.id) ?? 0,
    color: MISSION_COLORS[m.code] ?? "#6B7280",
  }));

  const missionsTotal = missionsBreakdown.reduce((s, m) => s + m.count, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Welcome back, {user.name ?? user.email}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          System Admin
        </span>
      </div>

      {/* Stat cards */}
      <StatCards cards={statsCards} />

      {/* Two-column section */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PendingActions items={pendingActions} />
        <MissionsBreakdown
          missions={missionsBreakdown}
          total={missionsTotal}
        />
      </div>
    </div>
  );
}
