import { prisma } from "@1000mm/db";
import { requireRole } from "@/lib/auth/helpers";
import { FilterBar } from "@/app/dashboard/_components/FilterBar";
import { RequestDeploymentForm } from "./_components/RequestDeploymentForm";
import { CancelRequestButton, EndDeploymentButton } from "./_components/DeploymentActions";
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

export default async function LmdDeploymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await requireRole(["LOCAL_DIRECTOR"]);
  const sp = await searchParams;
  const statusFilter = VALID_STATUSES.includes(sp.status as DeploymentStatus)
    ? (sp.status as DeploymentStatus)
    : undefined;
  const yearFilter = sp.year ?? undefined;
  const programFilter = sp.program ?? undefined;

  const [lmdMission, deployments, allYears, programs] = await Promise.all([
    prisma.localMission.findFirst({ where: { directorId: user.id } }),
    prisma.missionaryDeployment.findMany({
      where: {
        requestedById: user.id,
        deletedAt: null,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(yearFilter
          ? {
              startDate: {
                gte: new Date(parseInt(yearFilter), 0, 1),
                lt: new Date(parseInt(yearFilter) + 1, 0, 1),
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
      },
      include: {
        missionary: { select: { id: true, fullName: true } },
        mission: { select: { code: true, name: true } },
        reviewedBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.missionaryDeployment.findMany({
      where: { requestedById: user.id, deletedAt: null },
      select: { startDate: true },
      distinct: ["startDate"],
    }),
    // Programs with enrollments from this LMD's mission — for the filter
    prisma.trainingProgram.findMany({
      where: {
        deletedAt: null,
        enrollments: {
          some: {
            deletedAt: null,
            trainee: { homeMission: { directorId: user.id } },
          },
        },
      },
      orderBy: { startDate: "desc" },
      select: { id: true, code: true, title: true },
    }),
  ]);

  const yearOptions = [...new Set(allYears.map((d) => new Date(d.startDate).getFullYear()))]
    .sort((a, b) => b - a)
    .map((y) => ({ value: String(y), label: String(y) }));

  // Trainees in this mission for the request form
  const trainees = lmdMission
    ? await prisma.user.findMany({
        where: {
          homeMissionId: lmdMission.id,
          role: "TRAINEE",
          isActive: true,
          deletedAt: null,
        },
        select: { id: true, fullName: true },
        orderBy: { fullName: "asc" },
      })
    : [];

  const pending   = deployments.filter((d) => d.status === "PENDING");
  const active    = deployments.filter((d) => d.status === "ACTIVE");
  const history   = deployments.filter((d) => d.status === "COMPLETED" || d.status === "REJECTED");

  const current = { status: sp.status ?? "", year: sp.year ?? "", program: sp.program ?? "" };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Mission Field Deployments</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {lmdMission ? `${lmdMission.name} (${lmdMission.code})` : "No mission assigned"}
          </p>
        </div>
        {lmdMission && (
          <RequestDeploymentForm
            missionaries={trainees}
            missionName={`${lmdMission.name} (${lmdMission.code})`}
          />
        )}
      </div>

      {/* Filters + Export */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <FilterBar
          filters={[
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
              options: programs.map((p) => ({
                value: p.id,
                label: `${p.code} — ${p.title}`,
              })),
            },
          ]}
          current={current}
          basePath="/dashboard/lmd/deployments"
        />
        <MissionaryExportButtons
          status={sp.status}
          year={sp.year}
          program={sp.program}
        />
      </div>

      {/* Pending requests */}
      {(!statusFilter || statusFilter === "PENDING") && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Pending Approval
            {pending.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-700">
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
                  className="flex items-start justify-between rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-gray-900">{d.missionary.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {d.location ? `${d.location} · ` : ""}
                      {fmtDate(d.startDate)} → {d.endDate ? fmtDate(d.endDate) : "Open-ended"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {d.mission.code} · Requested {fmtDate(d.createdAt)}
                    </p>
                  </div>
                  <CancelRequestButton deploymentId={d.id} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Active deployments */}
      {(!statusFilter || statusFilter === "ACTIVE") && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Active Deployments
            {active.length > 0 && (
              <span className="ml-2 rounded-full bg-teal-100 px-1.5 py-0.5 text-teal-700">
                {active.length}
              </span>
            )}
          </h2>
          {active.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
              No active deployments
            </p>
          ) : (
            <div className="space-y-2">
              {active.map((d) => (
                <div
                  key={d.id}
                  className="flex items-start justify-between rounded-xl border border-teal-100 bg-teal-50/40 px-4 py-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-gray-900">{d.missionary.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {d.location ? `${d.location} · ` : ""}
                      {fmtDate(d.startDate)} → {d.endDate ? fmtDate(d.endDate) : "Open-ended"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {d.mission.code} · Approved by {d.reviewedBy?.fullName ?? "—"}
                    </p>
                  </div>
                  <EndDeploymentButton deploymentId={d.id} name={d.missionary.fullName} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* History */}
      {(!statusFilter || statusFilter === "COMPLETED" || statusFilter === "REJECTED") && history.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            History
          </h2>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-2">Missionary</th>
                  <th className="px-4 py-2">Location</th>
                  <th className="px-4 py-2">Period</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((d) => (
                  <tr key={d.id} className="bg-white">
                    <td className="px-4 py-2 font-medium text-gray-800">{d.missionary.fullName}</td>
                    <td className="px-4 py-2 text-gray-500">{d.location || "—"}</td>
                    <td className="px-4 py-2 text-gray-500">
                      {fmtDate(d.startDate)} → {d.endDate ? fmtDate(d.endDate) : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge[d.status]}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-400">{d.reviewNote || "—"}</td>
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
