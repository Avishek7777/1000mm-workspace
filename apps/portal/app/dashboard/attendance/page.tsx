import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { isSettingEnabled, SETTINGS } from "@/lib/settings";
import { redirect } from "next/navigation";
import Link from "next/link";
import { QrScanner } from "./_components/QrScanner";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const session = await auth();
  await requireRole([
    "SYSTEM_ADMIN",
    "MAIN_DIRECTOR",
    "SECRETARY",
    "ASSOCIATE_DIRECTOR",
    "LOCAL_DIRECTOR",
  ]);

  // LMD access is gated by SA setting
  if (session?.user?.role === "LOCAL_DIRECTOR") {
    const enabled = await isSettingEnabled(SETTINGS.LMD_ATTENDANCE_ENABLED);
    if (!enabled) redirect("/dashboard");
  }

  const { program: selectedId } = await searchParams;

  // Only programmes that actually have someone to scan.
  const programs = await prisma.trainingProgram.findMany({
    where: {
      deletedAt: null,
      enrollments: { some: { deletedAt: null, status: "ENROLLED" } },
    },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      code: true,
      title: true,
      startDate: true,
      endDate: true,
      _count: {
        select: { enrollments: { where: { deletedAt: null, status: "ENROLLED" } } },
      },
    },
  });

  const selected = programs.find((p) => p.id === selectedId) ?? null;

  // Attendance is taken for one day at a time; everything below is today's.
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const todayScans = selected
    ? await prisma.attendanceScan.findMany({
        where: {
          programId: selected.id,
          scannedAt: { gte: dayStart, lt: dayEnd },
        },
        orderBy: { scannedAt: "desc" },
        select: {
          id: true,
          scannedAt: true,
          enrollmentId: true,
          trainee: {
            select: { fullName: true, homeMission: { select: { code: true } } },
          },
        },
      })
    : [];

  // AttendanceScan.enrollmentId is a bare column with no relation, so the
  // applications behind today's scans are resolved separately rather than by
  // adding a foreign key to a table that already has rows.
  const scanApplications = todayScans.length
    ? await prisma.programEnrollment.findMany({
        where: { id: { in: todayScans.map((s) => s.enrollmentId) } },
        select: {
          id: true,
          application: {
            select: { applicantFullName: true, referenceNumber: true },
          },
        },
      })
    : [];
  const applicationByEnrollment = new Map(
    scanApplications.map((e) => [e.id, e.application]),
  );

  const today = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          Attendance Scanner
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">{today}</p>
      </div>

      {/* Programme picker — attendance is always for one programme */}
      <form
        method="GET"
        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm print:hidden"
      >
        <label
          htmlFor="program"
          className="mb-2 block text-sm font-semibold text-gray-900"
        >
          Program
        </label>
        {programs.length === 0 ? (
          <p className="text-sm text-gray-400">
            No program has any enrolled trainees yet.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              id="program"
              name="program"
              defaultValue={selected?.id ?? ""}
              className="min-w-[240px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">Select a program…</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.title} ({p._count.enrollments} enrolled)
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
            >
              {selected ? "Change" : "Start"}
            </button>
          </div>
        )}
      </form>

      {!selected ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-14 text-center">
          <p className="text-sm text-gray-400">
            Choose a program above to start scanning.
          </p>
        </div>
      ) : (
        <>
          {/* Today's tally for the chosen programme */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-teal-900">
                  {selected.code}
                </p>
                <p className="text-xs text-teal-700">
                  {todayScans.length} of {selected._count.enrollments} scanned
                  today
                </p>
              </div>
              <Link
                href={`/dashboard/system-admin/attendance?program=${selected.id}`}
                className="rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-medium text-teal-800 hover:bg-teal-50 transition-colors"
              >
                Full register →
              </Link>
            </div>
          </div>

          <QrScanner
            programId={selected.id}
            programCode={selected.code}
            scannedToday={todayScans.length}
          />

          {/* Scanned today — the register for this session */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Scanned Today
              </h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                {todayScans.length}
              </span>
            </div>
            {todayScans.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">
                Nobody scanned yet today.
              </p>
            ) : (
              <ul className="max-h-80 divide-y divide-gray-50 overflow-y-auto">
                {todayScans.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 px-5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {/* The reviewed name, as on the card */}
                        {applicationByEnrollment.get(s.enrollmentId)
                          ?.applicantFullName ?? s.trainee.fullName}
                      </p>
                      <p className="font-mono text-[11px] text-gray-400">
                        {applicationByEnrollment.get(s.enrollmentId)
                          ?.referenceNumber ?? "—"}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                        {s.trainee.homeMission?.code ?? "—"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(s.scannedAt).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
