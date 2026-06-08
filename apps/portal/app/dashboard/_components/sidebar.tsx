import Link from "next/link";
import SignOutButton from "./sign-out-button";
import { UserRole, LocalMissionCode } from "@1000mm/db";

type NavItem = {
  label: string;
  href: string | ((role: UserRole) => string);
  icon: React.ReactNode;
  roles: UserRole[];
};

const ALL_ROLES: UserRole[] = [
  "SYSTEM_ADMIN",
  "MAIN_DIRECTOR",
  "LOCAL_DIRECTOR",
  "TRAINER",
  "TRAINEE",
];
const DIRECTOR_ROLES: UserRole[] = [
  "SYSTEM_ADMIN",
  "MAIN_DIRECTOR",
  "LOCAL_DIRECTOR",
];
const ADMIN_ROLES: UserRole[] = ["SYSTEM_ADMIN", "MAIN_DIRECTOR"];

const NAV_SECTIONS: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [
      {
        label: "Dashboard",
        href: (role) => {
          if (role === "LOCAL_DIRECTOR") return "/dashboard/lmd";
          if (role === "MAIN_DIRECTOR") return "/dashboard/director";
          if (role === "SYSTEM_ADMIN") return "/dashboard/system-admin";
          return "/dashboard";
        },
        roles: ALL_ROLES,
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Applications",
    items: [
      {
        label: "Applications",
        href: (role) => {
          if (role === "LOCAL_DIRECTOR") return "/dashboard/lmd/applications";
          return "/dashboard/director/applications"; // MAIN_DIRECTOR + SYSTEM_ADMIN
        },
        roles: DIRECTOR_ROLES,
        icon: (
          <svg
            width="16"
            height="16"
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
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        ),
      },
      {
        label: "My Application",
        href: "/dashboard/my-application",
        roles: ["TRAINEE"],
        icon: (
          <svg
            width="16"
            height="16"
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
        label: "Windows",
        href: "/dashboard/director/windows",
        roles: ADMIN_ROLES,
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Training",
    items: [
      {
        label: "Programs",
        href: (role) => {
          if (role === "MAIN_DIRECTOR" || role === "SYSTEM_ADMIN")
            return "/dashboard/director/programs";
          return "/dashboard/programs"; // TRAINER
        },
        roles: [...ADMIN_ROLES, "TRAINER"],
        icon: (
          <svg
            width="16"
            height="16"
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
        label: "My Program",
        href: "/dashboard/my-program",
        roles: ["TRAINEE"],
        icon: (
          <svg
            width="16"
            height="16"
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
        label: "Trainees",
        href: "/dashboard/trainees",
        roles: [...ADMIN_ROLES, "LOCAL_DIRECTOR", "TRAINER"],
        icon: (
          <svg
            width="16"
            height="16"
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
        label: "Field Reports",
        href: (role) => {
          if (role === "LOCAL_DIRECTOR") return "/dashboard/lmd/field-reports";
          if (role === "MAIN_DIRECTOR" || role === "SYSTEM_ADMIN")
            return "/dashboard/director/field-reports";
          return "/dashboard/field-reports";
        },
        roles: ["TRAINEE", ...DIRECTOR_ROLES],
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        ),
      },
      {
        label: "Field Statistics",
        href: (role) => {
          if (role === "LOCAL_DIRECTOR")
            return "/dashboard/lmd/field-reports/stats";
          return "/dashboard/director/field-reports/stats";
        },
        roles: [...DIRECTOR_ROLES],
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Communication",
    items: [
      {
        // SA sees Announcements management; everyone else sees the read-only news feed
        label: "News",
        href: (role) => {
          if (role === "SYSTEM_ADMIN") return "/dashboard/announcements";
          return "/dashboard/news";
        },
        roles: ALL_ROLES,
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          </svg>
        ),
      },
      {
        label: "Complaints",
        href: "/dashboard/complaints",
        roles: ["TRAINEE", "LOCAL_DIRECTOR", "MAIN_DIRECTOR", "SYSTEM_ADMIN"],
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
      {
        label: "Notifications",
        href: "/dashboard/notifications",
        roles: ALL_ROLES,
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Reports",
    items: [
      {
        label: "Reports",
        href: (role) => {
          if (role === "LOCAL_DIRECTOR") return "/dashboard/lmd/reports";
          return "/dashboard/director/reports";
        },
        roles: DIRECTOR_ROLES,
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
      },
      {
        label: "LMD Reports",
        href: "/dashboard/director/lmd-reports",
        roles: ADMIN_ROLES,
        icon: (
          <svg
            width="16"
            height="16"
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
            <line x1="23" y1="21" x2="23" y2="19" />
            <line x1="19" y1="21" x2="19" y2="15" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Admin",
    items: [
      {
        label: "ID Cards",
        href: "/dashboard/id-cards",
        roles: ADMIN_ROLES,
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        ),
      },
      {
        label: "Missions",
        href: "/dashboard/missions",
        roles: ADMIN_ROLES,
        icon: (
          <svg
            width="16"
            height="16"
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
      {
        label: "Users",
        href: "/dashboard/users",
        roles: ADMIN_ROLES,
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
      },
      {
        label: "Audit Logs",
        href: "/dashboard/audit",
        roles: ["SYSTEM_ADMIN"],
        icon: (
          <svg
            width="16"
            height="16"
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
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
        ),
      },
      {
        label: "Settings",
        href: "/dashboard/settings",
        roles: ["SYSTEM_ADMIN"],
        icon: (
          <svg
            width="16"
            height="16"
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
    ],
  },
];

function resolveHref(
  href: string | ((role: UserRole) => string),
  role: UserRole,
): string {
  return typeof href === "function" ? href(role) : href;
}

function roleLabel(role: UserRole): string {
  const map: Record<UserRole, string> = {
    SYSTEM_ADMIN: "System Admin",
    MAIN_DIRECTOR: "Union Director",
    LOCAL_DIRECTOR: "Local Director",
    TRAINER: "Trainer",
    TRAINEE: "Trainee",
  };
  return map[role] ?? role;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type SidebarProps = {
  user: {
    name: string | null;
    email: string | null;
    role: UserRole;
    homeMissionCode: LocalMissionCode;
  };
  unreadCount?: number;
};

export default function Sidebar({ user, unreadCount = 0 }: SidebarProps) {
  const displayName = user.name ?? user.email ?? "User";

  return (
    <aside className="flex h-full w-56 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-700 text-sm font-medium text-teal-100">
          M
        </div>
        <div>
          <p className="text-sm font-medium leading-tight text-gray-900">
            1000MM BD
          </p>
          <p className="text-xs text-gray-500">Training Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) =>
            item.roles.includes(user.role),
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.section} className="mb-1">
              <p className="mb-1 mt-4 px-2 text-[10px] font-medium uppercase tracking-widest text-gray-400">
                {section.section}
              </p>
              {visibleItems.map((item) => {
                const href = resolveHref(item.href, user.role);
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {item.label === "Notifications" && unreadCount > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-semibold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-200 px-3 py-3">
        <div className="mb-1 flex items-center gap-2.5 px-2 py-1">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-teal-800 text-[11px] font-medium text-teal-100">
            {initials(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-gray-900">
              {displayName}
            </p>
            <p className="text-[11px] text-gray-500">
              {user.homeMissionCode} · {roleLabel(user.role)}
            </p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
