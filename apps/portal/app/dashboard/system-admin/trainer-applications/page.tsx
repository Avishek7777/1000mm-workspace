// apps/portal/app/dashboard/system-admin/trainer-applications/page.tsx

import { prisma } from "@1000mm/db";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";

export const metadata = { title: "Trainer Applications" };

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    color: "bg-amber-100 text-amber-700",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

export default async function TrainerApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMIN")
    redirect("/dashboard");

  const { status } = await searchParams;
  const filterStatus =
    (status as "PENDING" | "APPROVED" | "REJECTED" | undefined) ?? undefined;

  const [applications, counts] = await Promise.all([
    prisma.trainerApplication.findMany({
      where: filterStatus ? { status: filterStatus } : undefined,
      orderBy: { createdAt: "desc" },
      include: { reviewedBy: { select: { fullName: true } } },
    }),
    prisma.trainerApplication.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const countMap = Object.fromEntries(
    counts.map((c) => [c.status, c._count.id]),
  );
  const totalPending = countMap["PENDING"] ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Trainer Applications
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and approve applications submitted from the website.
          </p>
        </div>
        {totalPending > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
            <Clock className="h-3.5 w-3.5" />
            {totalPending} pending
          </span>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 border-b border-gray-100 pb-0">
        {([undefined, "PENDING", "APPROVED", "REJECTED"] as const).map((s) => {
          const label = s ?? "All";
          const count = s
            ? (countMap[s] ?? 0)
            : applications.length + (filterStatus ? 0 : 0);
          const isActive = filterStatus === s;
          return (
            <Link
              key={label}
              href={s ? `?status=${s}` : "?"}
              className={`flex items-center gap-1.5 border-b-2 px-3 pb-3 pt-1 text-sm font-medium transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
              >
                {s
                  ? (countMap[s] ?? 0)
                  : Object.values(countMap).reduce((a, b) => a + b, 0)}
              </span>
            </Link>
          );
        })}
      </div>

      {/* List */}
      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16">
          <ClipboardList className="mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">No applications found.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {applications.map((app) => {
            const cfg = STATUS_CONFIG[app.status];
            const StatusIcon = cfg.icon;
            return (
              <Link
                key={app.id}
                href={`/dashboard/system-admin/trainer-applications/${app.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
              >
                {/* Avatar initial */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                  {app.fullName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">
                    {app.fullName}
                  </p>
                  <p className="truncate text-sm text-gray-500">{app.email}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {new Date(app.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {app.requestsInvitationLetter && (
                      <span className="ml-2 text-blue-500">
                        · Invitation letter requested
                      </span>
                    )}
                  </p>
                </div>

                {/* Status badge */}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {cfg.label}
                </span>

                <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
