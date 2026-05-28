import { requireRole } from "@/lib/auth/helpers";
import { StatCards } from "./_components/stat-cards";
import { PendingActions } from "./_components/pending-actions";
import { MissionsBreakdown } from "./_components/missions-breakdown";

// ─── Mock data ────────────────────────────────────────────────────────────────
// Replace each section with real Prisma queries when ready.
// Each query is clearly labelled so it's obvious what to swap.

const MOCK_STATS = [
  {
    label: "Total users",
    value: "248",
    delta: "+12 this month",
    icon: (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Active applications",
    value: "63",
    delta: "4 windows open",
    icon: (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    label: "Programs running",
    value: "5",
    delta: "2 upcoming",
    icon: (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    label: "Local missions",
    value: "4",
    delta: "EBM · NBM · SBM · WBM",
    icon: (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

const MOCK_ACTIONS = [
  {
    title: "New user registrations",
    meta: "3 awaiting role assignment",
    href: "/dashboard/users",
    badge: "3",
    badgeVariant: "new" as const,
    iconVariant: "teal" as const,
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
  },
  {
    title: "Locked accounts",
    meta: "1 account currently locked out",
    href: "/dashboard/users",
    badge: "1",
    badgeVariant: "pending" as const,
    iconVariant: "amber" as const,
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: "Failed login alerts",
    meta: "7 attempts — admin@test.com",
    href: "/dashboard/settings",
    badge: "urgent",
    badgeVariant: "urgent" as const,
    iconVariant: "red" as const,
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    title: "System settings review",
    meta: "Last reviewed 14 days ago",
    href: "/dashboard/settings",
    iconVariant: "blue" as const,
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

const MOCK_MISSIONS = [
  {
    code: "EBM",
    name: "Eastern Bangladesh Mission",
    count: 21,
    color: "#1D9E75",
  },
  {
    code: "NBM",
    name: "Northern Bangladesh Mission",
    count: 18,
    color: "#378ADD",
  },
  {
    code: "SBM",
    name: "Southern Bangladesh Mission",
    count: 14,
    color: "#D85A30",
  },
  {
    code: "WBM",
    name: "Western Bangladesh Mission",
    count: 10,
    color: "#BA7517",
  },
];

const MOCK_MISSIONS_TOTAL = MOCK_MISSIONS.reduce((sum, m) => sum + m.count, 0);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SystemAdminDashboard() {
  // Guard: only SYSTEM_ADMIN can reach this page.
  const user = await requireRole(["SYSTEM_ADMIN"]);

  // TODO: replace mock data with real queries, e.g.:
  //   const db = await getScopedPrisma();
  //   const userCount = await db.user.count({ where: { deletedAt: null } });
  //   etc.

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
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          System Admin
        </span>
      </div>

      {/* Stat cards */}
      <StatCards cards={MOCK_STATS} />

      {/* Two-column section */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PendingActions items={MOCK_ACTIONS} />
        <MissionsBreakdown
          missions={MOCK_MISSIONS}
          total={MOCK_MISSIONS_TOTAL}
        />
      </div>
    </div>
  );
}
