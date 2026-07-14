import { prisma } from "@1000mm/db";
import { requireRole } from "@/lib/auth/helpers";
import { FilterBar } from "@/app/dashboard/_components/FilterBar";
import { ReviewDeploymentButtons, EndActiveDeploymentButton } from "./_components/ReviewDeployment";
import { MissionaryExportButtons } from "./_components/MissionaryExportButtons";
import type { DeploymentStatus } from "@1000mm/db";

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const statusBadge: Record<string, string> = {
  PENDING:   "bg-amber-100 text-amber-700",
  ACTIVE:    "bg-teal-100 text-teal-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  REJECTED:  "bg-red-100 text-red-600",
};

const VALID_STATUSES = ["PENDING", "ACTIVE", "COMPLETED", "REJECTED"] as const;

export default async function DirectorDeploymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await requireRole(["SYSTEM_ADMIN", "SECRETARY", "ASSOCIATE_DIRECTOR", "MAIN_DIRECTOR"]);
  const sp = await searchParams;

  const statusFilter = VALID_STATUSES.includes(sp.status as DeploymentStatus)
    ? (sp.status as DeploymentStatus)
    : undefined;
  const missionFilter = sp.mission || undefined;
  const yearFilter = sp.year ? parseInt(sp.year) : undefined;
  const programFilter = sp.program || undefined;

  const baseWhere = {
    deletedAt: null,
    ...(missionFilter ? { mission: { code: missionFilter } } : {}),
    ...(yearFilter
      ? {
          startDate: {
            gte: new Date(yearFilter, 0, 1),
            lt: new Date(yearFilter + 1, 0, 1),
          },
        }
      : {}),
    // Program: missionaries enrolled in the selected training program
    ...(programFilter
      ? {
          missionary: {
            enrollmentsAsTrainee: {
              some: { programId: programFilter, deletedAt: null },
            },
          },
        }
      : {}),
  };

  const [pending, active, history, allYears, allMissions, allPrograms] = await Promise.all([
    prisma.missionaryDeployment.findMany({
      where: { ...baseWhere, status: "PENDING" },
      include: {
        missionary: { select: { id: true, fullName: true } },
        mission: { select: { code: true, name: true } },
        requestedBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.missionaryDeployment.findMany({
      where: { ...baseWhere, status: "ACTIVE" },
      include: {
        missionary: { select: { id: true, fullName: true } },
        mission: { select: { code: true, name: true } },
        requestedBy: { select: { fullName: true } },
        reviewedBy: { select: { fullName: true } },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.missionaryDeployment.findMany({
      where: { ...baseWhere, status: { in: ["COMPLETED", "REJECTED"] } },
      include: {
        missionary: { select: { id: true, fullName: true } },
        mission: { select: { code: true, name: true } },
        reviewedBy: { select: { fullName: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.missionaryDeployment.findMany({
      where: { deletedAt: null },
      select: { startDate: true },
      distinct: ["startDate"],
    }),
    prisma.localMission.findMany({
      where: { deletedAt: null },
      select: { code: true },
      orderBy: { code: "asc" },
    }),
    prisma.trainingProgram.findMany({
      where: { deletedAt: null, enrollments: { some: { deletedAt: null } } },
      orderBy: { startDate: "desc" },
      select: { id: true, code: true, title: true },
    }),
  ]);

  // Apply status filter to section visibility
  const showPending  = !statusFilter || statusFilter === "PENDING";
  const showActive   = !statusFilter || statusFilter === "ACTIVE";
  const showHistory  = !statusFilter || statusFilter === "COMPLETED" || statusFilter === "REJECTED";

  const yearOptions = [...new Set(allYears.map((d) => new Date(d.startDate).getFullYear()))]
    .sort((a, b) => b - a)
    .map((y) => ({ value: String(y), label: String(y) }));

  const missionOptions = allMissions.map((m) => ({ value: m.code, label: m.code }));

  const current = {
    status: sp.status ?? "",
    mission: sp.mission ?? "",
    year: sp.year ?? "",
    program: sp.program ?? "",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Missionary Deployments</h1>
          <p className="mt-0.5 text-sm text-gray-500">Review deployment requests and manage active deployments.</p>
        </div>
        <MissionaryExportButtons
          status={sp.status}
          mission={sp.mission}
          year={sp.year}
          program={sp.program}
        />
      </div>

      {/* Filters */}
      <FilterBar
        filters={[
          {
            name: "mission",
            label: "Mission",
            allLabel: "All Missions",
            options: missionOptions,
          },
          {
            name: "status",
            label: "Status",
            allLabel: "All Statuses",
            options: [
              { value: "PENDING",   label: "Pending" },
              { value: "ACTIVE",    label: "Active" },
              { value: "COMPLETED", label: "Completed" },
              { value: "REJECTED",  label: "Rejected" },
            ],
          },
          {
            name: "year",
            label: "Year",
            allLabel: "All Years",
            options: yearOptions,
          },
          {
            name: "program",
            label: "Program",
            allLabel: "All Programs",
            options: allPrograms.map((p) => ({
              value: p.id,
              label: `${p.code} — ${p.title}`,
            })),
          },
        ]}
        current={current}
        basePath="/dashboard/director/deployments"
      />

      {/* Pending Requests */}
      {showPending && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Pending Requests
            {pending.length > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-700">
                {pending.length}
              </span>
            )}
          </h2>
          {pending.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
              No pending requests
            </p>
          ) : (
            <div className="space-y-2">
              {pending.map((d) => (
                <div
                  key={d.id}
                  className="flex items-start justify-between rounded-xl border border-amber-100 bg-amber-50/30 px-4 py-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-gray-900">{d.missionary.fullName}</p>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">{d.mission.code}</span>
                      {d.location ? ` · ${d.location}` : ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      {fmtDate(d.startDate)} → {d.endDate ? fmtDate(d.endDate) : "Open-ended"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Requested by {d.requestedBy.fullName} on {fmtDate(d.createdAt)}
                    </p>
                  </div>
                  <ReviewDeploymentButtons deploymentId={d.id} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Active Deployments */}
      {showActive && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Active Deployments
            {active.length > 0 && (
              <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-teal-700">
                {active.length}
              </span>
            )}
          </h2>
          {active.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
              No active deployments
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-2">Missionary</th>
                    <th className="px-4 py-2">Mission</th>
                    <th className="px-4 py-2">Location</th>
                    <th className="px-4 py-2">Period</th>
                    <th className="px-4 py-2">Approved by</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {active.map((d) => (
                    <tr key={d.id} className="bg-white">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{d.missionary.fullName}</td>
                      <td className="px-4 py-2.5 text-gray-500">{d.mission.code}</td>
                      <td className="px-4 py-2.5 text-gray-500">{d.location || "—"}</td>
                      <td className="px-4 py-2.5 text-gray-500">
                        {fmtDate(d.startDate)} → {d.endDate ? fmtDate(d.endDate) : "Open"}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">{d.reviewedBy?.fullName ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right">
                        <EndActiveDeploymentButton deploymentId={d.id} name={d.missionary.fullName} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* History */}
      {showHistory && history.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Recent History
          </h2>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-2">Missionary</th>
                  <th className="px-4 py-2">Mission</th>
                  <th className="px-4 py-2">Period</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((d) => (
                  <tr key={d.id} className="bg-white">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{d.missionary.fullName}</td>
                    <td className="px-4 py-2.5 text-gray-500">{d.mission.code}</td>
                    <td className="px-4 py-2.5 text-gray-500">
                      {fmtDate(d.startDate)} → {d.endDate ? fmtDate(d.endDate) : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 font-medium ${statusBadge[d.status]}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400">{d.reviewNote || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
