import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isSettingEnabled, SETTINGS } from "@/lib/settings";
import { ApplicantActions } from "./_components/ApplicantActions";

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ProgramApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<{
    program?: string;
    mission?: string;
    year?: string;
    q?: string;
  }>;
}) {
  const user = await requireRole(["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"]);
  if (user.role === "MAIN_DIRECTOR" || user.role === "SECRETARY" || user.role === "ASSOCIATE_DIRECTOR") {
    const allowed = await isSettingEnabled(SETTINGS.UD_CAN_MANAGE_PROGRAMS);
    if (!allowed) redirect("/dashboard/director");
  }

  const { program, mission, year, q } = await searchParams;
  const yearNum = year ? parseInt(year, 10) : undefined;
  const search = q?.trim() || undefined;

  // All pending (APPLIED) enrollments
  const applicants = await prisma.programEnrollment.findMany({
    where: {
      deletedAt: null,
      status: "APPLIED",
      ...(program ? { programId: program } : {}),
      ...(mission || search
        ? {
            trainee: {
              ...(mission ? { homeMission: { code: mission as any } } : {}),
              ...(search
                ? {
                    OR: [
                      { fullName: { contains: search, mode: "insensitive" as const } },
                      { email: { contains: search, mode: "insensitive" as const } },
                    ],
                  }
                : {}),
            },
          }
        : {}),
      ...(yearNum
        ? {
            appliedAt: {
              gte: new Date(`${yearNum}-01-01`),
              lt: new Date(`${yearNum + 1}-01-01`),
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
    },
    orderBy: { appliedAt: "asc" }, // oldest first — fairness queue
  });

  // Each trainee's accepted application (for the recommendation reference)
  const traineeIds = applicants.map((a) => a.traineeId);
  const acceptedApps = traineeIds.length
    ? await prisma.application.findMany({
        where: {
          applicantId: { in: traineeIds },
          status: "ACCEPTED",
          deletedAt: null,
        },
        select: {
          applicantId: true,
          referenceNumber: true,
          directorReviewCompletedAt: true,
        },
      })
    : [];
  const appMap = new Map(acceptedApps.map((a) => [a.applicantId, a]));

  // Programs that currently have pending applicants — for the filter
  const programsWithApplicants = await prisma.trainingProgram.findMany({
    where: {
      deletedAt: null,
      enrollments: { some: { status: "APPLIED", deletedAt: null } },
    },
    orderBy: { startDate: "desc" },
    select: { id: true, code: true, title: true },
  });

  const missions = await prisma.localMission.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    select: { code: true },
  });

  const appliedYears = [
    ...new Set(
      (
        await prisma.programEnrollment.findMany({
          where: { deletedAt: null, status: "APPLIED", appliedAt: { not: null } },
          select: { appliedAt: true },
        })
      )
        .map((e) => new Date(e.appliedAt!).getFullYear()),
    ),
  ].sort((a, b) => b - a);

  // Group applicants by program for display
  const byProgram = new Map<
    string,
    { program: (typeof applicants)[number]["program"]; rows: typeof applicants }
  >();
  for (const a of applicants) {
    const entry = byProgram.get(a.program.id);
    if (entry) entry.rows.push(a);
    else byProgram.set(a.program.id, { program: a.program, rows: [a] });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/director/programs"
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ← Back to Programs
          </Link>
          <h1 className="mt-1 text-lg font-semibold text-gray-900">
            Program Applicants
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {applicants.length} trainee{applicants.length !== 1 ? "s" : ""}{" "}
            awaiting enrollment
          </p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap items-center gap-2">
        <select
          name="program"
          defaultValue={program ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All programs</option>
          {programsWithApplicants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.title}
            </option>
          ))}
        </select>
        <select
          name="mission"
          defaultValue={mission ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All missions</option>
          {missions.map((m) => (
            <option key={m.code} value={m.code}>
              {m.code}
            </option>
          ))}
        </select>
        <select
          name="year"
          defaultValue={year ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All years</option>
          {appliedYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name or email…"
          className="w-48 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Filter
        </button>
        {(program || mission || year || search) && (
          <Link
            href="?"
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Empty state */}
      {applicants.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">
            No trainees are awaiting enrollment right now.
          </p>
        </div>
      )}

      {/* Grouped by program */}
      {[...byProgram.values()].map(({ program: prog, rows }) => (
        <div
          key={prog.id}
          className="overflow-x-auto overflow-hidden rounded-xl border border-gray-200 bg-white"
        >
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-gray-400">
                {prog.code}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {prog.title}
              </span>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              {rows.length} pending
            </span>
          </div>

          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-white">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  Trainee
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  Mission
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  Reference
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  Applied
                </th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((a) => {
                const app = appMap.get(a.traineeId);
                return (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {a.trainee.fullName}
                      </p>
                      <p className="text-xs text-gray-400">{a.trainee.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                        {a.trainee.homeMission?.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-500">
                        {app?.referenceNumber ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(a.appliedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ApplicantActions
                        enrollmentId={a.id}
                        traineeName={a.trainee.fullName}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
