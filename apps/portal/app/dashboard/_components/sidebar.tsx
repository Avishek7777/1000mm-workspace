import Link from "next/link";
import type { UserRole, LocalMissionCode } from "@prisma/client";
import SignOutButton from "./sign-out-button";

// ─── Nav item shape ───────────────────────────────────────────────────────────

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[]; // which roles see this item
};

// ─── Nav definitions ──────────────────────────────────────────────────────────

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
        href: "/dashboard",
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
        href: "/dashboard/applications",
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
        href: "/dashboard/windows",
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
        href: "/dashboard/programs",
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
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Admin",
    items: [
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

// ─── Role label helper ────────────────────────────────────────────────────────

function roleLabel(role: UserRole): string {
  const map: Record<UserRole, string> = {
    SYSTEM_ADMIN: "System Admin",
    MAIN_DIRECTOR: "Main Director",
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

// ─── Component ────────────────────────────────────────────────────────────────

type SidebarProps = {
  user: {
    name: string | null;
    email: string | null;
    role: UserRole;
    homeMissionCode: LocalMissionCode;
  };
};

export default function Sidebar({ user }: SidebarProps) {
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
              {visibleItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
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
