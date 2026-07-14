"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Sidebar from "./sidebar";
import type { UserRole } from "@1000mm/db";

function PrintFooter({ userName, role }: { userName: string; role: UserRole }) {
  const [now, setNow] = useState("");
  useEffect(() => {
    const update = () =>
      setNow(
        new Date().toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    update();
    const onBeforePrint = () => update();
    window.addEventListener("beforeprint", onBeforePrint);
    return () => window.removeEventListener("beforeprint", onBeforePrint);
  }, []);

  return (
    <div className="hidden print:flex mt-8 border-t border-gray-200 pt-2 justify-between text-[8px] text-gray-400">
      <span>1000 Missionary Movement Bangladesh · Portal</span>
      <span>Printed by: {userName} · {(role ?? "").replace(/_/g, " ")}</span>
      <span>{now}</span>
    </div>
  );
}

type DashboardShellProps = {
  children: React.ReactNode;
  user: {
    id: string;
    role: UserRole;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    homeMissionCode?: string | null;
    isMissionary?: boolean;
  };
  unreadCount: number;
  applicantCount: number;
  lmdAttendanceEnabled?: boolean;
};

export default function DashboardShell({
  children,
  user,
  unreadCount,
  applicantCount,
  lmdAttendanceEnabled,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const sidebarProps = {
    user: {
      ...user,
      name: user.name ?? null,
      email: user.email ?? null,
      homeMissionCode: user.homeMissionCode ?? null,
    },
    unreadCount,
    applicantCount,
    lmdAttendanceEnabled,
  };

  return (
    <div
      className="min-h-screen"
      data-role={user.role}
      style={{ backgroundColor: "var(--dash-main-bg)" }}
    >
      {/* Mobile top bar */}
      <div
        className="print:hidden flex items-center justify-between border-b px-4 py-3 md:hidden"
        style={{
          backgroundColor: "var(--dash-sb-bg)",
          borderColor: "var(--dash-sb-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700">
            <Image src="/logos/1000mm-logo.png" alt="1000MM Logo" width={36} height={36} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--dash-sb-head)" }}>1000MM BD</p>
            <p className="text-xs" style={{ color: "var(--dash-sb-sub)" }}>Training Platform</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
          style={{
            borderColor: "var(--dash-sb-border)",
            backgroundColor: "transparent",
            color: "var(--dash-sb-sub)",
          }}
          aria-label="Open navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      <div className="md:flex md:h-screen md:overflow-hidden">
        {/* Mobile sidebar overlay */}
        <div className={`print:hidden fixed inset-0 z-40 md:hidden ${sidebarOpen ? "block" : "hidden"}`}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div
            className="relative flex h-full w-full max-w-xs flex-col shadow-xl"
            style={{ backgroundColor: "var(--dash-sb-bg)" }}
          >
            <div
              className="flex items-center justify-between gap-3 border-b px-4 py-4"
              style={{ borderColor: "var(--dash-sb-border)" }}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700">
                  <Image src="/logos/1000mm-logo.png" alt="1000MM Logo" width={36} height={36} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--dash-sb-head)" }}>1000MM BD</p>
                  <p className="text-xs" style={{ color: "var(--dash-sb-sub)" }}>Training Platform</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors"
                style={{ borderColor: "var(--dash-sb-border)", color: "var(--dash-sb-sub)" }}
                aria-label="Close navigation menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <Sidebar {...sidebarProps} hideLogo className="min-h-0 flex-1 w-full" />
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="print:hidden hidden md:flex md:w-56 md:flex-shrink-0">
          <Sidebar {...sidebarProps} className="h-full w-56" />
        </div>

        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8"
          style={{ backgroundColor: "var(--dash-main-bg)" }}
        >
          {children}
          <PrintFooter userName={user.name ?? user.email ?? "Unknown"} role={user.role} />
        </main>
      </div>
    </div>
  );
}
