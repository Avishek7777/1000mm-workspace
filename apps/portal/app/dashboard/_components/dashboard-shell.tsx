"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./sidebar";
import type { UserRole } from "@1000mm/db";

type DashboardShellProps = {
  children: React.ReactNode;
  user: {
    id: string;
    role: UserRole;
    name?: string | null;
    email?: string | null;
    homeMissionCode?: string | null;
    isMissionary?: boolean;
  };
  unreadCount: number;
};

export default function DashboardShell({
  children,
  user,
  unreadCount,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-sm font-medium text-teal-100">
            M
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">1000MM BD</p>
            <p className="text-xs text-gray-500">Training Platform</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          aria-label="Open navigation menu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      <div className="md:flex md:h-screen md:overflow-hidden">
        <div
          className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? "block" : "hidden"}`}
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 px-4 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-sm font-medium text-teal-100">
                  M
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">1000MM BD</p>
                  <p className="text-xs text-gray-500">Training Platform</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-label="Close navigation menu"
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
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <Sidebar
              user={user}
              unreadCount={unreadCount}
              className="h-full w-full"
            />
          </div>
        </div>

        <div className="hidden md:flex md:w-56 md:flex-shrink-0">
          <Sidebar
            user={user}
            unreadCount={unreadCount}
            className="h-full w-56"
          />
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
