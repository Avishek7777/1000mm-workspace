import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { AssignDeploymentButton } from "./_components/AssignDeploymentButton";
import { ProgramFilter } from "./_components/ProgramFilter";

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function TraineesPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; mission?: string; q?: string }>;
}) {
  await requireRole([
    "MAIN_DIRECTOR",
    "SYSTEM_ADMIN",
    "LOCAL_DIRECTOR",
    "TRAINER",
  ]);
  const session = await auth();
  const { program, mission, q } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
    include: { homeMission: true },
  });
  if (!user) return null;

  const isStaff = ["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(user.role);
  const isLmd = user.role === "LOCAL_DIRECTOR";

  // LMD's mission for scoping
  const lmdMission = isLmd
    ? await prisma.localMission.findFirst({ where: { directorId: user.id } })
    : null;

  // Build enrollment query
  const enrollments = await prisma.programEnrollment.findMany({
    where: {
      deletedAt: null,
      application: { status: "ACCEPTED" },
      ...(program ? { programId: program } : {}),
      // Scope by mission for LMD/Trainer
      ...(!isStaff
        ? { trainee: { homeMissionId: lmdMission?.id ?? user.homeMissionId } }
        : mission
          ? { trainee: { homeMission: { code: mission as any } } }
          : {}),
      // Search by name
      ...(q
        ? {
            trainee: {
              fullName: { contains: q, mode: "insensitive" as const },
            },
          }
        : {}),
    },
    include: {
      trainee: {
        select: {
          id: true,
          fullName: true,
          email: true,
          homeMission: { select: { code: true, name: true } },
        },
      },
      program: { select: { id: true, code: true, title: true } },
      deploymentAssignedBy: { select: { fullName: true } },
      application: { select: { referenceNumber: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  // Get field report counts per trainee
  const traineeIds = enrollments.map((e) => e.traineeId);
  const reportCounts = await prisma.fieldReport.groupBy({
    by: ["traineeId"],
    where: { traineeId: { in: traineeIds } },
    _count: true,
  });
  const reportCountMap = new Map(
    reportCounts.map((r) => [r.traineeId, r._count]),
  );

  // Programs for filter
  const programs = await prisma.trainingProgram.findMany({
    where: { deletedAt: null, enrollments: { some: { deletedAt: null } } },
    orderBy: { startDate: "desc" },
    select: { id: true, code: true, title: true },
  });

  const missions = ["EBM", "NBM", "SBM", "WBM"];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Trainees</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {enrollments.length} enrolled trainee
          {enrollments.length !== 1 ? "s" : ""}
          {!isStaff && lmdMission ? ` · ${lmdMission.name}` : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <form method="GET" className="flex-1 min-w-48 max-w-xs">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name…"
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500"
          />
        </form>

        {/* Program filter */}
        <ProgramFilter
          programs={programs}
          currentProgram={program}
          currentMission={mission}
          currentQ={q}
        />

        {/* Mission filter — staff only */}
        {isStaff && (
          <div className="flex gap-1">
            <Link
              href={`?${new URLSearchParams({ ...(program ? { program } : {}), ...(q ? { q } : {}) })}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${!mission ? "border-teal-400 bg-teal-50 text-teal-800" : "border-gray-200 bg-white text-gray-600"}`}
            >
              All
            </Link>
            {missions.map((m) => (
              <Link
                key={m}
                href={`?${new URLSearchParams({ mission: m, ...(program ? { program } : {}), ...(q ? { q } : {}) })}`}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${mission === m ? "border-purple-400 bg-purple-50 text-purple-800" : "border-gray-200 bg-white text-gray-600"}`}
              >
                {m}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {enrollments.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <svg
            className="mx-auto mb-3 h-8 w-8 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
          <p className="text-sm text-gray-400">No trainees found.</p>
        </div>
      )}

      {/* Table */}
      {enrollments.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Trainee
                </th>
                {isStaff && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Mission
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Program
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Enrolled
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Deployment
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                  Reports
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                  Attendance
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                  Certificate
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {enrollments.map((e) => {
                const reportCount = reportCountMap.get(e.traineeId) ?? 0;
                return (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    {/* Trainee */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {e.trainee.fullName}
                      </p>
                      <p className="text-xs text-gray-400">{e.trainee.email}</p>
                      {e.application?.referenceNumber && (
                        <p className="font-mono text-[10px] text-gray-300">
                          {e.application.referenceNumber}
                        </p>
                      )}
                    </td>

                    {/* Mission — staff only */}
                    {isStaff && (
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                          {e.trainee.homeMission?.code}
                        </span>
                      </td>
                    )}

                    {/* Program */}
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-gray-600">
                        {e.program.code}
                      </p>
                    </td>

                    {/* Enrolled date */}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(e.enrolledAt)}
                    </td>

                    {/* Deployment */}
                    <td className="px-4 py-3">
                      {e.deploymentLocation ? (
                        <div>
                          <p className="text-xs font-medium text-gray-700">
                            {e.deploymentLocation}
                          </p>
                          {e.deploymentAssignedBy && (
                            <p className="text-[10px] text-gray-400">
                              by {e.deploymentAssignedBy.fullName}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            Not assigned
                          </span>
                          {isLmd && (
                            <AssignDeploymentButton
                              enrollmentId={e.id}
                              traineeName={e.trainee.fullName}
                            />
                          )}
                        </div>
                      )}
                    </td>

                    {/* Report count */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-sm font-medium ${reportCount > 0 ? "text-teal-700" : "text-gray-400"}`}
                      >
                        {reportCount}
                      </span>
                    </td>

                    {/* Attendance */}
                    <td className="px-4 py-3 text-center">
                      {e.attendanceConfirmed ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-block h-5 w-5 rounded-full bg-gray-100" />
                      )}
                    </td>

                    {/* Certificate */}
                    <td className="px-4 py-3 text-center">
                      {e.certificateIssued ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-block h-5 w-5 rounded-full bg-gray-100" />
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/trainees/${e.traineeId}`}
                        className="text-xs text-teal-600 hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
