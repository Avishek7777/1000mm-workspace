import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { AssignDeploymentButton } from "./_components/AssignDeploymentButton";
import { ProgramFilter } from "./_components/ProgramFilter";
import { PrintRosterButton } from "./_components/PrintRosterButton";
import { NameSheetButton } from "./_components/NameSheetButton";
import { TraineesExportButton } from "./_components/TraineesExportButton";

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
  searchParams: Promise<{ program?: string; mission?: string; q?: string; sheet?: string; gender?: string }>;
}) {
  await requireRole([
    "MAIN_DIRECTOR",
    "SECRETARY",
    "ASSOCIATE_DIRECTOR",
    "SYSTEM_ADMIN",
    "LOCAL_DIRECTOR",
    "TRAINER",
  ]);
  const session = await auth();
  const { program, mission, q, sheet, gender } = await searchParams;
  const isNameSheet = sheet === "names";

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
    include: { homeMission: true },
  });
  if (!user) return null;

  const isStaff = ["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"].includes(user.role);
  const isLmd = user.role === "LOCAL_DIRECTOR";
  const isTrainer = user.role === "TRAINER";
  const canAssignDeployment = isStaff || isLmd;

  // LMD's mission for scoping
  const lmdMission = isLmd
    ? await prisma.localMission.findFirst({ where: { directorId: user.id } })
    : null;

  // Build enrollment query
  const enrollments = await prisma.programEnrollment.findMany({
    where: {
      deletedAt: null,
      status: "ENROLLED",
      ...(program ? { programId: program } : {}),
      // Trainer: only trainees of programs they teach (via their topics)
      ...(isTrainer
        ? {
            program: {
              topics: { some: { trainerId: user.id, deletedAt: null } },
            },
          }
        : {}),
      ...(gender ? { application: { applicantGender: gender as "MALE" | "FEMALE" } } : {}),
      trainee: {
        // LMD: scope to own mission
        ...(isLmd
          ? { homeMissionId: lmdMission?.id ?? user.homeMissionId }
          : {}),
        // Staff: optional mission filter
        ...(isStaff && mission
          ? { homeMission: { code: mission as any } }
          : {}),
        // Name search
        ...(q ? { fullName: { contains: q, mode: "insensitive" as const } } : {}),
      },
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

  // Programs for filter — trainers only see programs they teach
  const programs = await prisma.trainingProgram.findMany({
    where: {
      deletedAt: null,
      enrollments: { some: { deletedAt: null } },
      ...(isTrainer
        ? { topics: { some: { trainerId: user.id, deletedAt: null } } }
        : {}),
    },
    orderBy: { startDate: "desc" },
    select: { id: true, code: true, title: true },
  });

  const missions = ["EBM", "NBM", "SBM", "WBM"];

  // Enrollments for the print roster — respects the same filters as the
  // on-screen table so "Print" outputs exactly what is being viewed.
  const rosterEnrollments = await prisma.programEnrollment.findMany({
    where: {
      deletedAt: null,
      status: "ENROLLED",
      ...(program ? { programId: program } : {}),
      ...(gender ? { application: { applicantGender: gender as "MALE" | "FEMALE" } } : {}),
      ...(isTrainer
        ? {
            program: {
              topics: { some: { trainerId: user.id, deletedAt: null } },
            },
          }
        : {}),
      trainee: {
        ...(isLmd
          ? { homeMissionId: lmdMission?.id ?? user.homeMissionId }
          : {}),
        ...(isStaff && mission
          ? { homeMission: { code: mission as any } }
          : {}),
        ...(q ? { fullName: { contains: q, mode: "insensitive" as const } } : {}),
      },
    },
    include: {
      trainee: {
        select: {
          id: true,
          fullName: true,
          homeMission: { select: { code: true } },
        },
      },
      program: {
        select: { code: true, title: true, startDate: true },
      },
      application: {
        select: {
          permanentAddressDistrict: true,
          permanentAddressUpazila: true,
          permanentAddressVillage: true,
          presentAddressDistrict: true,
          presentAddressUpazila: true,
          presentAddressVillage: true,
          permanentSameAsPresent: true,
        },
      },
    },
    orderBy: [{ program: { startDate: "asc" } }, { enrolledAt: "asc" }],
  });

  // ── Name sheet view ──
  if (isNameSheet) {
    const missionLabel = mission
      ? ` · ${mission}`
      : !isStaff && lmdMission
        ? ` · ${lmdMission.name}`
        : "";
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between print:hidden">
          <Link href="/dashboard/trainees" className="text-xs text-gray-500 hover:text-gray-700">
            ← Back to Trainees
          </Link>
          <PrintRosterButton />
        </div>
        <div>
          <p className="text-base font-bold text-gray-900">
            1000 Missionary Movement Bangladesh
          </p>
          <h1 className="text-lg font-semibold text-gray-900 mt-0.5">
            Trainees Name Sheet{missionLabel}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {rosterEnrollments.length} trainees ·{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-400">
              <th className="py-2 pr-3 text-left text-xs font-semibold text-gray-700">#</th>
              <th className="py-2 pr-3 text-left text-xs font-semibold text-gray-700">Name</th>
              {isStaff && (
                <th className="py-2 pr-3 text-left text-xs font-semibold text-gray-700">Mission</th>
              )}
              <th className="py-2 text-left text-xs font-semibold text-gray-700">Address</th>
            </tr>
          </thead>
          <tbody>
            {rosterEnrollments.map((e, i) => {
              const app = e.application;
              const addr = app
                ? app.permanentSameAsPresent
                  ? [app.presentAddressVillage, app.presentAddressUpazila, app.presentAddressDistrict].filter(Boolean).join(", ")
                  : [app.permanentAddressVillage, app.permanentAddressUpazila, app.permanentAddressDistrict].filter(Boolean).join(", ")
                : "—";
              return (
                <tr key={e.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="py-1.5 pr-3 text-xs text-gray-400">{i + 1}</td>
                  <td className="py-1.5 pr-3 text-xs font-medium text-gray-900">{e.trainee.fullName}</td>
                  {isStaff && (
                    <td className="py-1.5 pr-3 text-xs text-gray-600">{e.trainee.homeMission?.code ?? "—"}</td>
                  )}
                  <td className="py-1.5 text-xs text-gray-600">{addr || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rosterEnrollments.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No trainees to display.</p>
        )}
        <p className="text-[10px] text-gray-400 text-right print:block">
          Total: {rosterEnrollments.length} trainee{rosterEnrollments.length !== 1 ? "s" : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 print:text-xl print:font-bold">
            Trainees Roster
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {enrollments.length} enrolled trainee
            {enrollments.length !== 1 ? "s" : ""}
            {!isStaff && lmdMission ? ` · ${lmdMission.name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <TraineesExportButton
            program={program}
            mission={mission}
            gender={gender}
            q={q}
          />
          <NameSheetButton
            href={`?${new URLSearchParams({
              sheet: "names",
              ...(mission ? { mission } : {}),
              ...(program ? { program } : {}),
              ...(gender ? { gender } : {}),
              ...(q ? { q } : {}),
            })}`}
          />
          <PrintRosterButton />
        </div>
      </div>

      {/* Print-only org header */}
      <div className="hidden print:block text-xs text-gray-500 -mt-4">
        1000 Missionary Movement Bangladesh ·{" "}
        {new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>

      {/* Filters */}
      <div className="print:hidden flex flex-wrap items-center gap-2">
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
              href={`?${new URLSearchParams({ ...(program ? { program } : {}), ...(q ? { q } : {}), ...(gender ? { gender } : {}) })}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${!mission ? "border-teal-400 bg-teal-50 text-teal-800" : "border-gray-200 bg-white text-gray-600"}`}
            >
              All
            </Link>
            {missions.map((m) => (
              <Link
                key={m}
                href={`?${new URLSearchParams({ mission: m, ...(program ? { program } : {}), ...(q ? { q } : {}), ...(gender ? { gender } : {}) })}`}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${mission === m ? "border-purple-400 bg-purple-50 text-purple-800" : "border-gray-200 bg-white text-gray-600"}`}
              >
                {m}
              </Link>
            ))}
          </div>
        )}

        {/* Gender filter */}
        <div className="flex gap-1">
          <Link href={`?${new URLSearchParams({ ...(program ? { program } : {}), ...(mission ? { mission } : {}), ...(q ? { q } : {}) })}`} className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${!gender ? "border-teal-400 bg-teal-50 text-teal-800" : "border-gray-200 bg-white text-gray-600"}`}>All</Link>
          <Link href={`?${new URLSearchParams({ gender: "MALE", ...(program ? { program } : {}), ...(mission ? { mission } : {}), ...(q ? { q } : {}) })}`} className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${gender === "MALE" ? "border-blue-400 bg-blue-50 text-blue-800" : "border-gray-200 bg-white text-gray-600"}`}>Male</Link>
          <Link href={`?${new URLSearchParams({ gender: "FEMALE", ...(program ? { program } : {}), ...(mission ? { mission } : {}), ...(q ? { q } : {}) })}`} className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${gender === "FEMALE" ? "border-pink-400 bg-pink-50 text-pink-800" : "border-gray-200 bg-white text-gray-600"}`}>Female</Link>
        </div>
      </div>

      {/* Empty state */}
      {enrollments.length === 0 && (
        <div className="print:hidden rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
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
        <div className="print:hidden overflow-x-auto overflow-hidden rounded-xl border border-gray-200 bg-white">
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
                {/* Trainers only need the roster basics */}
                {!isTrainer && (
                  <>
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
                  </>
                )}
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

                    {/* Trainers only need the roster basics */}
                    {!isTrainer && (
                    <>
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
                          {canAssignDeployment && (
                            <div className="mt-1">
                              <AssignDeploymentButton
                                enrollmentId={e.id}
                                traineeName={e.trainee.fullName}
                                currentLocation={e.deploymentLocation}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            Not assigned
                          </span>
                          {canAssignDeployment && (
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
                    </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Print-only: full roster (all batches, no filter) */}
      <div className="hidden print:block">
        {/* Print header with logos */}
        <div className="flex items-center justify-between mb-4 border-b pb-3">
          <img src="/logos/1000mm-logo.png" alt="1000MM" className="h-12 w-auto" />
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">1000 Missionary Movement Bangladesh</p>
            <p className="text-xs text-gray-600 mt-0.5">Trainees Roster</p>
            {(program || mission || gender) && (
              <p className="text-[10px] text-gray-500 mt-0.5">
                {[
                  program
                    ? (programs.find((p) => p.id === program)?.code ?? program)
                    : "",
                  mission,
                  gender === "MALE" ? "Male" : gender === "FEMALE" ? "Female" : "",
                ].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="text-[10px] text-gray-400 mt-0.5">
              Printed {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <img src="/logos/sda-logo.png" alt="SDA" className="h-12 w-auto" />
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-400">
              <th className="py-2 pr-3 text-left text-xs font-semibold text-gray-700">
                #
              </th>
              <th className="py-2 pr-3 text-left text-xs font-semibold text-gray-700">
                Name
              </th>
              {isStaff && (
                <th className="py-2 pr-3 text-left text-xs font-semibold text-gray-700">
                  Mission
                </th>
              )}
              <th className="py-2 pr-3 text-left text-xs font-semibold text-gray-700">
                Address
              </th>
              <th className="py-2 pr-3 text-left text-xs font-semibold text-gray-700">
                Deployment
              </th>
              <th className="py-2 text-left text-xs font-semibold text-gray-700">
                Batch
              </th>
            </tr>
          </thead>
          <tbody>
            {rosterEnrollments.map((e, i) => {
              const app = e.application;
              const addr = app
                ? app.permanentSameAsPresent
                  ? [
                      app.presentAddressVillage,
                      app.presentAddressUpazila,
                      app.presentAddressDistrict,
                    ]
                      .filter(Boolean)
                      .join(", ")
                  : [
                      app.permanentAddressVillage,
                      app.permanentAddressUpazila,
                      app.permanentAddressDistrict,
                    ]
                      .filter(Boolean)
                      .join(", ")
                : "—";
              const batchYear = e.program.startDate
                ? new Date(e.program.startDate).getFullYear()
                : "—";
              return (
                <tr
                  key={e.id}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="py-1.5 pr-3 text-xs text-gray-400">
                    {i + 1}
                  </td>
                  <td className="py-1.5 pr-3 text-xs font-medium text-gray-900">
                    {e.trainee.fullName}
                  </td>
                  {isStaff && (
                    <td className="py-1.5 pr-3 text-xs text-gray-600">
                      {e.trainee.homeMission?.code ?? "—"}
                    </td>
                  )}
                  <td className="py-1.5 pr-3 text-xs text-gray-600">
                    {addr || "—"}
                  </td>
                  <td className="py-1.5 pr-3 text-xs text-gray-600">
                    {e.deploymentLocation ?? "—"}
                  </td>
                  <td className="py-1.5 text-xs text-gray-600">
                    {e.program.code} · {batchYear}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rosterEnrollments.length === 0 && (
          <p className="py-4 text-sm text-gray-400 text-center">
            No trainees to display.
          </p>
        )}
        <p className="mt-4 text-[10px] text-gray-400 text-right">
          Total: {rosterEnrollments.length} trainee
          {rosterEnrollments.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
