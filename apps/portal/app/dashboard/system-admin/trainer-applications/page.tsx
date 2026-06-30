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
import { ExportButtons } from "./_components/ExportButtons";
import { FilterBar } from "../../_components/FilterBar";
import { PrintButton } from "@/components/PrintButton";

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
  searchParams: Promise<{ status?: string; year?: string; country?: string; mission?: string; search?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SYSTEM_ADMIN")
    redirect("/dashboard");

  const { status, year, country, mission, search } = await searchParams;
  const filterStatus =
    (status as "PENDING" | "APPROVED" | "REJECTED" | undefined) ?? undefined;
  const yearNum = year ? parseInt(year, 10) : undefined;

  const [allCountries, allYears, allMissions] = await Promise.all([
    prisma.trainerApplication.findMany({
      where: { country: { not: null } },
      select: { country: true },
      distinct: ["country"],
      orderBy: { country: "asc" },
    }),
    prisma.trainerApplication.findMany({ select: { createdAt: true } }).then((rows) =>
      [...new Set(rows.map((a) => new Date(a.createdAt).getFullYear()))].sort((a, b) => b - a),
    ),
    prisma.localMission.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const where = {
    ...(filterStatus ? { status: filterStatus } : {}),
    ...(yearNum ? { createdAt: { gte: new Date(`${yearNum}-01-01`), lt: new Date(`${yearNum + 1}-01-01`) } } : {}),
    ...(country ? { country } : {}),
    ...(mission ? { createdUser: { homeMissionId: mission } } : {}),
    ...(search ? { OR: [{ fullName: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }] } : {}),
  } as any;

  const [applications, counts] = await Promise.all([
    prisma.trainerApplication.findMany({
      where,
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
        <div className="flex items-center gap-2 print:hidden">
          <PrintButton label="Print" />
          <ExportButtons />
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        basePath="/dashboard/system-admin/trainer-applications"
        current={{ status: status ?? "", year: year ?? "", country: country ?? "", mission: mission ?? "", search: search ?? "" }}
        filters={[
          {
            name: "status",
            label: "Status",
            allLabel: `All (${Object.values(countMap).reduce((a, b) => a + b, 0)})`,
            options: (["PENDING", "APPROVED", "REJECTED"] as const).map((s) => ({
              value: s,
              label: `${s.charAt(0) + s.slice(1).toLowerCase()} (${countMap[s] ?? 0})`,
            })),
          },
          {
            name: "year",
            label: "Year",
            allLabel: "All years",
            options: allYears.map((y) => ({ value: String(y), label: String(y) })),
          },
          {
            name: "country",
            label: "Country",
            allLabel: "All countries",
            options: allCountries.map((c) => ({ value: c.country!, label: c.country! })),
          },
          {
            name: "mission",
            label: "Mission",
            allLabel: "All Mission",
            options: allMissions.map((m) => ({ value: m.id, label: m.name })),
          },
        ]}
      />

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
                    {app.country && (
                      <span className="ml-2 text-gray-500">· {app.country}</span>
                    )}
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

      {/* Print-only list */}
      {applications.length > 0 && (
        <div className="hidden print:block">
          <div className="flex items-center justify-between mb-4 border-b pb-3">
            <img src="/logos/1000mm-logo.png" alt="1000MM" className="h-12 w-auto" />
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">1000 Missionary Movement Bangladesh</p>
              <p className="text-xs text-gray-600 mt-0.5">Trainer Applications</p>
              {(status || year || country || mission) && (
                <p className="text-[10px] text-gray-500 mt-0.5">{[status, year, country, mission ? allMissions.find((m) => m.id === mission)?.name : undefined].filter(Boolean).join(" · ")}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-0.5">
                Generated {new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <img src="/logos/sda-logo.png" alt="SDA" className="h-12 w-auto" />
          </div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-400">
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">#</th>
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">Name</th>
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">Email</th>
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">Country</th>
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">Date</th>
                <th className="py-1.5 text-left font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, i) => (
                <tr key={app.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="py-1 pr-2 text-gray-400">{i + 1}</td>
                  <td className="py-1 pr-2 font-medium text-gray-900">{app.fullName}</td>
                  <td className="py-1 pr-2 text-gray-600">{app.email}</td>
                  <td className="py-1 pr-2 text-gray-600">{app.country ?? "—"}</td>
                  <td className="py-1 pr-2 text-gray-600">{new Date(app.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="py-1 text-gray-600">{app.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-right text-[10px] text-gray-400">Total: {applications.length}</p>
        </div>
      )}
    </div>
  );
}
