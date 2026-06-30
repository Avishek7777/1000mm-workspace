import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { AttendanceExportButton } from "./_components/AttendanceExportButton";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default async function AttendanceManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; day?: string; mission?: string; program?: string; gender?: string }>;
}) {
  await requireRole(["SYSTEM_ADMIN", "MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR"]);

  const sp = await searchParams;
  const now = new Date();
  const thisYear = now.getFullYear();

  const yearNum = sp.year ? parseInt(sp.year, 10) : thisYear;
  const monthNum = sp.month ? parseInt(sp.month, 10) : undefined;
  const dayNum = sp.day ? parseInt(sp.day, 10) : undefined;
  const missionId = sp.mission || undefined;
  const programId = sp.program || undefined;

  // Build date range
  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;
  if (dayNum && monthNum) {
    dateFrom = new Date(yearNum, monthNum - 1, dayNum);
    dateTo = new Date(yearNum, monthNum - 1, dayNum + 1);
  } else if (monthNum) {
    dateFrom = new Date(yearNum, monthNum - 1, 1);
    dateTo = new Date(yearNum, monthNum, 1);
  } else {
    dateFrom = new Date(yearNum, 0, 1);
    dateTo = new Date(yearNum + 1, 0, 1);
  }

  const [scans, missions, programs] = await Promise.all([
    prisma.attendanceScan.findMany({
      where: {
        scannedAt: { gte: dateFrom, lt: dateTo },
        ...(missionId ? { missionId } : {}),
        ...(programId ? { programId } : {}),
      },
      include: {
        trainee: {
          select: {
            fullName: true,
            homeMission: { select: { code: true, name: true } },
            applications: {
              where: { status: "ACCEPTED" },
              select: { applicantGender: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
          program: { select: { code: true, title: true } },
        scannedBy: { select: { fullName: true } },
      },
      orderBy: { scannedAt: "desc" },
      take: 500,
    }),
    prisma.localMission.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.trainingProgram.findMany({
      where: { deletedAt: null },
      orderBy: { startDate: "desc" },
      select: { id: true, code: true, title: true },
    }),
  ]);

  const years = Array.from({ length: 6 }, (_, i) => thisYear - i);
  const hasFilter = !!(sp.year || sp.month || sp.day || sp.mission || sp.program);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Attendance Records</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {scans.length} scan{scans.length !== 1 ? "s" : ""} recorded
            {monthNum && dayNum ? ` on ${MONTHS[monthNum - 1]} ${dayNum}, ${yearNum}` : monthNum ? ` in ${MONTHS[monthNum - 1]} ${yearNum}` : ` in ${yearNum}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/attendance"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Scanner
          </Link>
          <AttendanceExportButton
            year={sp.year}
            month={sp.month}
            day={sp.day}
            mission={sp.mission}
            program={sp.program}
          />
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Year</label>
          <select name="year" defaultValue={sp.year ?? String(thisYear)} className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-teal-500">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Month</label>
          <select name="month" defaultValue={sp.month ?? ""} className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-teal-500">
            <option value="">All months</option>
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Day</label>
          <input
            type="number"
            name="day"
            defaultValue={sp.day ?? ""}
            min={1} max={31}
            placeholder="1–31"
            className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Mission</label>
          <select name="mission" defaultValue={sp.mission ?? ""} className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-teal-500">
            <option value="">All missions</option>
            {missions.map((m) => <option key={m.id} value={m.id}>{m.code}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Program</label>
          <select name="program" defaultValue={sp.program ?? ""} className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-teal-500">
            <option value="">All programs</option>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 transition-colors">
          Filter
        </button>
        {hasFilter && (
          <Link href="/dashboard/system-admin/attendance" className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto overflow-hidden">
        {scans.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No attendance records found for this period.</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-2.5 font-medium text-gray-500">#</th>
                <th className="px-4 py-2.5 font-medium text-gray-500">Name</th>
                <th className="px-4 py-2.5 font-medium text-gray-500">Mission</th>
                <th className="px-4 py-2.5 font-medium text-gray-500">Program</th>
                <th className="px-4 py-2.5 font-medium text-gray-500">Scanned At</th>
                <th className="px-4 py-2.5 font-medium text-gray-500">Scanned By</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((s, i) => (
                <tr key={s.id} className={i % 2 === 0 ? "border-b border-gray-50" : "border-b border-gray-50 bg-gray-50/40"}>
                  <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{s.trainee.fullName}</td>
                  <td className="px-4 py-2.5 text-violet-700 font-medium">{s.trainee.homeMission?.code ?? "—"}</td>
                  <td className="px-4 py-2.5 text-gray-600">{s.program.code}</td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {new Date(s.scannedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {" "}
                    {new Date(s.scannedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{s.scannedBy.fullName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
