import Link from "next/link";
import SignOutButton from "./sign-out-button";
import { UserRole } from "@1000mm/db";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";

type NavItem = {
  label: string;
  href: string | ((role: UserRole) => string);
  icon: React.ReactNode;
  roles: UserRole[];
};

const ALL_ROLES: UserRole[] = [
  "SYSTEM_ADMIN",
  "MAIN_DIRECTOR",
  "SECRETARY",
  "ASSOCIATE_DIRECTOR",
  "LOCAL_DIRECTOR",
  "TRAINER",
  "TRAINEE",
];
const DIRECTOR_ROLES: UserRole[] = [
  "SYSTEM_ADMIN",
  "MAIN_DIRECTOR",
  "SECRETARY",
  "ASSOCIATE_DIRECTOR",
  "LOCAL_DIRECTOR",
];
const ADMIN_ROLES: UserRole[] = ["SYSTEM_ADMIN", "MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR"];

const NAV_SECTIONS: { section: string; labelColor: string; iconColor: string; hoverClass: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    labelColor: "text-gray-400",
    iconColor: "text-gray-500",
    hoverClass: "hover:bg-gray-100 hover:text-gray-900",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        roles: ALL_ROLES,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Applications",
    labelColor: "text-blue-400",
    iconColor: "text-blue-500",
    hoverClass: "hover:bg-blue-50 hover:text-blue-700",
    items: [
      {
        label: "Applications",
        href: (role) => {
          if (role === "LOCAL_DIRECTOR") return "/dashboard/lmd/applications";
          if (role === "SECRETARY" || role === "ASSOCIATE_DIRECTOR") return "/dashboard/secretary/applications";
          return "/dashboard/director/applications";
        },
        roles: DIRECTOR_ROLES,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
          </svg>
        ),
      },
      {
        label: "My Application",
        href: "/dashboard/my-application",
        roles: ["TRAINEE"],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
          </svg>
        ),
      },
      {
        label: "Windows",
        href: (role) =>
          (role === "SECRETARY" || role === "ASSOCIATE_DIRECTOR") ? "/dashboard/secretary/windows" : "/dashboard/director/windows",
        roles: ADMIN_ROLES,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Training",
    labelColor: "text-teal-500",
    iconColor: "text-teal-600",
    hoverClass: "hover:bg-teal-50 hover:text-teal-700",
    items: [
      {
        label: "Programs",
        href: (role) => {
          if (role === "SECRETARY" || role === "ASSOCIATE_DIRECTOR") return "/dashboard/secretary/programs";
          if (role === "MAIN_DIRECTOR" || role === "SYSTEM_ADMIN") return "/dashboard/director/programs";
          return "/dashboard/programs";
        },
        roles: [...ADMIN_ROLES, "TRAINER"],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        ),
      },
      {
        label: "My Program",
        href: "/dashboard/my-program",
        roles: ["TRAINEE"],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        ),
      },
      {
        label: "Trainees",
        href: "/dashboard/trainees",
        roles: [...ADMIN_ROLES, "LOCAL_DIRECTOR", "TRAINER"],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        label: "Deployments",
        href: (role) => {
          if (role === "LOCAL_DIRECTOR") return "/dashboard/lmd/deployments";
          if (role === "SECRETARY" || role === "ASSOCIATE_DIRECTOR") return "/dashboard/secretary/deployments";
          return "/dashboard/director/deployments";
        },
        roles: DIRECTOR_ROLES,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
        ),
      },
      {
        label: "Assignments",
        href: "/dashboard/assignments",
        roles: ["TRAINEE"],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        ),
      },
      {
        label: "Attendance",
        href: "/dashboard/attendance",
        roles: [...ADMIN_ROLES, "LOCAL_DIRECTOR"],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3m0 4h4V17m-4 0h4" />
          </svg>
        ),
      },
      {
        label: "Resources",
        href: "/dashboard/resources",
        roles: ALL_ROLES,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
      {
        label: "Field Reports",
        href: (role) => {
          if (role === "LOCAL_DIRECTOR") return "/dashboard/lmd/field-reports";
          if (role === "SECRETARY" || role === "ASSOCIATE_DIRECTOR") return "/dashboard/secretary/field-reports";
          if (role === "MAIN_DIRECTOR" || role === "SYSTEM_ADMIN") return "/dashboard/director/field-reports";
          return "/dashboard/field-reports";
        },
        roles: ["TRAINEE", ...DIRECTOR_ROLES],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        ),
      },
      {
        label: "Field Statistics",
        href: (role) => {
          if (role === "LOCAL_DIRECTOR") return "/dashboard/lmd/field-reports/stats";
          if (role === "SECRETARY" || role === "ASSOCIATE_DIRECTOR") return "/dashboard/secretary/field-reports/stats";
          return "/dashboard/director/field-reports/stats";
        },
        roles: [...DIRECTOR_ROLES],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Communication",
    labelColor: "text-violet-400",
    iconColor: "text-violet-500",
    hoverClass: "hover:bg-violet-50 hover:text-violet-700",
    items: [
      {
        label: "Communication",
        href: "/dashboard/communication",
        roles: ALL_ROLES,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" />
          </svg>
        ),
      },
      {
        label: "News",
        href: (role) => {
          if (role === "SYSTEM_ADMIN") return "/dashboard/news/announcements";
          return "/dashboard/news";
        },
        roles: ALL_ROLES,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          </svg>
        ),
      },
      {
        label: "Complaints",
        href: "/dashboard/complaints",
        roles: ["TRAINEE", "LOCAL_DIRECTOR", "MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
      {
        label: "Notifications",
        href: "/dashboard/notifications",
        roles: ALL_ROLES,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Reports",
    labelColor: "text-amber-500",
    iconColor: "text-amber-600",
    hoverClass: "hover:bg-amber-50 hover:text-amber-700",
    items: [
      {
        label: "Reports",
        href: (role) => {
          if (role === "LOCAL_DIRECTOR") return "/dashboard/lmd/reports";
          if (role === "SECRETARY" || role === "ASSOCIATE_DIRECTOR") return "/dashboard/secretary/reports";
          return "/dashboard/director/reports";
        },
        roles: DIRECTOR_ROLES,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
      },
      {
        label: "LMD Reports",
        href: (role) =>
          (role === "SECRETARY" || role === "ASSOCIATE_DIRECTOR") ? "/dashboard/secretary/lmd-reports" : "/dashboard/director/lmd-reports",
        roles: ADMIN_ROLES,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="23" y1="21" x2="23" y2="19" /><line x1="19" y1="21" x2="19" y2="15" />
          </svg>
        ),
      },
      {
        label: "Missionaries",
        href: (role) =>
          role === "LOCAL_DIRECTOR" ? "/dashboard/lmd/missionaries" : "/dashboard/director/missionaries",
        roles: [...ADMIN_ROLES, "LOCAL_DIRECTOR"],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
      },
      {
        label: "Deployed Missionaries",
        href: "/dashboard/lmd/missionaries/deployed",
        roles: ["LOCAL_DIRECTOR"],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        ),
      },
      {
        label: "Salary",
        href: "/dashboard/lmd/salary",
        roles: ["LOCAL_DIRECTOR"],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        ),
      },
      {
        label: "Financial",
        href: (role) => {
          if (role === "LOCAL_DIRECTOR") return "/dashboard/lmd/financial";
          if (role === "SECRETARY" || role === "ASSOCIATE_DIRECTOR") return "/dashboard/secretary/financial";
          if (role === "MAIN_DIRECTOR") return "/dashboard/director/financial";
          return "/dashboard/financial";
        },
        roles: DIRECTOR_ROLES,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Admin",
    labelColor: "text-rose-400",
    iconColor: "text-rose-500",
    hoverClass: "hover:bg-rose-50 hover:text-rose-700",
    items: [
      {
        label: "Program Applicants",
        href: (role) =>
          (role === "SECRETARY" || role === "ASSOCIATE_DIRECTOR")
            ? "/dashboard/secretary/programs/applicants"
            : "/dashboard/director/programs/applicants",
        roles: ADMIN_ROLES,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="17 11 19 13 23 9" />
          </svg>
        ),
      },
      {
        label: "ID Cards",
        href: "/dashboard/id-cards",
        roles: ADMIN_ROLES,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        ),
      },
      {
        label: "Missions",
        href: "/dashboard/missions",
        roles: ADMIN_ROLES,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        ),
      },
      {
        label: "Users",
        href: "/dashboard/users",
        roles: ["SYSTEM_ADMIN"],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        ),
      },
      {
        label: "Attendance Records",
        href: "/dashboard/system-admin/attendance",
        roles: ["SYSTEM_ADMIN", "MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR"],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        ),
      },
      {
        label: "Trainer Applications",
        href: "/dashboard/system-admin/trainer-applications",
        roles: ["SYSTEM_ADMIN"],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        ),
      },
      {
        label: "Audit Logs",
        href: "/dashboard/audit",
        roles: ["SYSTEM_ADMIN"],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
          </svg>
        ),
      },
      {
        label: "Urgent Reports",
        href: "/dashboard/system-admin/urgent-reports",
        roles: ["SYSTEM_ADMIN"],
        icon: <AlertTriangle />,
      },
      {
        label: "Salary",
        href: "/dashboard/salary",
        roles: ADMIN_ROLES,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        ),
      },
      {
        label: "Contact Messages",
        href: "/dashboard/system-admin/contact-messages",
        roles: ADMIN_ROLES,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
          </svg>
        ),
      },
      {
        label: "Website Projects",
        href: "/dashboard/system-admin/projects",
        roles: ["SYSTEM_ADMIN"],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /><path d="M7 8h4M7 11h6" />
          </svg>
        ),
      },
      {
        label: "Testimonies",
        href: "/dashboard/system-admin/testimonials",
        roles: ["SYSTEM_ADMIN"],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="11" y2="14" />
          </svg>
        ),
      },
      {
        label: "Settings",
        href: "/dashboard/settings",
        roles: ["SYSTEM_ADMIN"],
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ),
      },
    ],
  },
];

function resolveHref(href: string | ((role: UserRole) => string), role: UserRole): string {
  return typeof href === "function" ? href(role) : href;
}

function roleLabel(role: UserRole): string {
  const map: Record<UserRole, string> = {
    SYSTEM_ADMIN: "System Admin",
    MAIN_DIRECTOR: "Union Director",
    SECRETARY: "Secretary",
    ASSOCIATE_DIRECTOR: "Associate Director",
    LOCAL_DIRECTOR: "Local Director",
    TRAINER: "Trainer",
    TRAINEE: "Trainee",
  };
  return map[role] ?? role;
}

function affiliationLabel(role: UserRole, missionCode: string | null): string {
  switch (role) {
    case "SYSTEM_ADMIN":        return "HQ";
    case "MAIN_DIRECTOR":       return "Union";
    case "SECRETARY":           return "Union";
    case "ASSOCIATE_DIRECTOR":  return "Union";
    case "TRAINER":             return "National";
    default:                    return missionCode ?? "";
  }
}

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

type SidebarProps = {
  user: {
    name: string | null;
    email: string | null;
    image?: string | null;
    role: UserRole;
    homeMissionCode: string | null;
    isMissionary?: boolean;
  };
  unreadCount?: number;
  pendingTrainerApplications?: number;
  applicantCount?: number;
  lmdAttendanceEnabled?: boolean;
  className?: string;
  /** Hide the logo header (the mobile drawer renders its own). */
  hideLogo?: boolean;
};

export default function Sidebar({
  user,
  unreadCount = 0,
  pendingTrainerApplications = 0,
  applicantCount = 0,
  lmdAttendanceEnabled = false,
  className,
  hideLogo = false,
}: SidebarProps) {
  const displayName = user.name ?? user.email ?? "User";

  return (
    <aside
      className={`flex h-full flex-col border-r ${className ?? "w-56"}`}
      style={{ backgroundColor: "var(--dash-sb-bg)", borderColor: "var(--dash-sb-border)" }}
    >
      {/* Logo */}
      {!hideLogo && (
        <div className="flex items-center gap-2.5 px-4 py-5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-700 text-sm font-medium text-teal-100">
            <Image src="/logos/1000mm-logo.png" alt="1000MM Logo" width={32} height={32} />
          </div>
          <div>
            <p className="text-sm font-medium leading-tight" style={{ color: "var(--dash-sb-head)" }}>
              1000MM BD
            </p>
            <p className="text-xs" style={{ color: "var(--dash-sb-sub)" }}>Training Platform</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (!item.roles.includes(user.role)) return false;
            if (item.label === "Attendance" && user.role === "LOCAL_DIRECTOR" && !lmdAttendanceEnabled) return false;
            return true;
          });
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.section} className="mb-1">
              <p className={`mb-1 mt-4 px-2 text-[10px] font-medium uppercase tracking-widest ${section.labelColor}`}>
                {section.section}
              </p>
              {visibleItems.map((item) => {
                const href = resolveHref(item.href, user.role);
                const badge =
                  item.label === "Notifications"
                    ? unreadCount
                    : item.label === "Trainer Applications"
                      ? pendingTrainerApplications
                      : item.label === "Program Applicants"
                        ? applicantCount
                        : 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${section.hoverClass}`}
                    style={{ color: "var(--dash-sb-text)" }}
                  >
                    <span className={section.iconColor}>{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 && (
                      <span className="relative flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-semibold text-white">
                        {item.label === "Notifications" && (
                          <span className="absolute inset-0 rounded-full bg-teal-600 animate-ping opacity-75" />
                        )}
                        <span className="relative">{badge > 99 ? "99+" : badge}</span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}

        {/* Missionary-only: Salary Request */}
        {user.isMissionary && user.role === "TRAINEE" && (
          <div className="mb-1">
            <p className="mb-1 mt-4 px-2 text-[10px] font-medium uppercase tracking-widest text-amber-500">
              Salary
            </p>
            <Link
              href="/dashboard/salary-request"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-amber-50 hover:text-amber-700"
              style={{ color: "var(--dash-sb-text)" }}
            >
              <span className="text-amber-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              <span className="flex-1">Salary Request</span>
            </Link>
          </div>
        )}
        {user.isMissionary && user.role === "TRAINEE" && (
          <Link href="/dashboard/urgent-reports" style={{ color: "var(--dash-sb-text)" }}>Urgent Reports</Link>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t px-3 py-3" style={{ borderColor: "var(--dash-sb-border)" }}>
        <div className="mb-1 flex items-center gap-2.5 px-2 py-1">
          <Link href="/dashboard/profile" className="flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500">
            {user.image ? (
              <Image
                src={user.image}
                alt={displayName}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-800 text-[11px] font-medium text-teal-100">
                {initials(displayName)}
              </div>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium" style={{ color: "var(--dash-sb-head)" }}>
              {displayName}
            </p>
            <p className="text-[11px]" style={{ color: "var(--dash-sb-sub)" }}>
              {affiliationLabel(user.role, user.homeMissionCode)} · {roleLabel(user.role)}
            </p>
          </div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
