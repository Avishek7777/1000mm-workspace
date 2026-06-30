import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";
import { DirectorMissionariesExportButton } from "./_components/DirectorMissionariesExportButton";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function DirectorMissionariesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; gender?: string; programId?: string; mission?: string }>;
}) {
  await requireRole(["MAIN_DIRECTOR", "SYSTEM_ADMIN", "SECRETARY", "ASSOCIATE_DIRECTOR"]);
  const { year, month, gender, programId, mission } = await searchParams;
  const yearNum  = year  ? parseInt(year,  10) : undefined;
  const monthNum = month ? parseInt(month, 10) : undefined;
  const hasFilter = !!(year || month || gender || programId || mission);

  // Build enrolledAt date range
  let enrolledAtFilter: { gte: Date; lt: Date } | undefined;
  if (yearNum && monthNum) {
    enrolledAtFilter = { gte: new Date(yearNum, monthNum - 1, 1), lt: new Date(yearNum, monthNum, 1) };
  } else if (yearNum) {
    enrolledAtFilter = { gte: new Date(yearNum, 0, 1), lt: new Date(yearNum + 1, 0, 1) };
  } else if (monthNum) {
    const cy = new Date().getFullYear();
    enrolledAtFilter = { gte: new Date(cy, monthNum - 1, 1), lt: new Date(cy, monthNum, 1) };
  }

  const [enrollments, yearRows, programs, missions] = await Promise.all([
    prisma.programEnrollment.findMany({
      where: {
        deletedAt: null,
        application: {
          status: "ACCEPTED",
          ...(gender ? { applicantGender: gender as "MALE" | "FEMALE" } : {}),
          ...(mission ? { submittedFromMission: { code: mission } } : {}),
        },
        ...(programId ? { programId } : {}),
        ...(enrolledAtFilter ? { enrolledAt: enrolledAtFilter } : {}),
      },
      orderBy: [{ trainee: { homeMission: { code: "asc" } } }, { enrolledAt: "desc" }],
      include: {
        trainee: {
          select: {
            fullName: true,
            fullNameBangla: true,
            phone: true,
            homeMission: { select: { code: true, name: true } },
          },
        },
        application: {
          select: {
            applicantGender: true,
            presentAddressDistrict: true,
            referenceNumber: true,
          },
        },
        program: { select: { id: true, code: true, title: true } },
      },
    }),
    prisma.programEnrollment.findMany({
      where: { deletedAt: null, application: { status: "ACCEPTED" } },
      select: { enrolledAt: true },
    }),
    prisma.trainingProgram.findMany({
      where: { deletedAt: null, enrollments: { some: { deletedAt: null } } },
      orderBy: { startDate: "desc" },
      select: { id: true, code: true },
    }),
    prisma.localMission.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
      select: { code: true },
    }),
  ]);

  const availableYears = [...new Set(yearRows.map((e) => new Date(e.enrolledAt).getFullYear()))].sort((a, b) => b - a);

  const filterLabel = [
    mission ?? "All missions",
    programId ? (programs.find((p) => p.id === programId)?.code ?? programId) : null,
    yearNum  ? String(yearNum)         : null,
    monthNum ? MONTHS[monthNum - 1]    : null,
    gender === "MALE" ? "Male" : gender === "FEMALE" ? "Female" : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Print-only header */}
      <div className="hidden print:block mb-4">
        <div className="flex items-center justify-between border-b-2 border-gray-800 pb-3 mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/1000mm-logo.png" alt="1000MM" className="h-12 w-auto" />
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">1000 Missionary Movement Bangladesh</p>
            <h1 className="text-base font-bold text-gray-900 mt-0.5">Missionaries List</h1>
            <p className="text-xs text-gray-600 mt-0.5">{filterLabel}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {enrollments.length} {enrollments.length !== 1 ? "Missionaries" : "Missionary"}
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/sda-logo.png" alt="SDA" className="h-12 w-auto" />
        </div>
      </div>

      {/* Screen header */}
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Missionaries</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {enrollments.length} {enrollments.length !== 1 ? "Missionaries" : "Missionary"} · {filterLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DirectorMissionariesExportButton
            year={year}
            month={month}
            gender={gender}
            programId={programId}
            mission={mission}
          />
          <PrintButton label="Print List" />
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="print:hidden flex flex-wrap items-center gap-2">
        <select name="year" defaultValue={year ?? ""} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
          <option value="">All years</option>
          {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select name="month" defaultValue={month ?? ""} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
          <option value="">All months</option>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select name="gender" defaultValue={gender ?? ""} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
          <option value="">All genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
        <select name="programId" defaultValue={programId ?? ""} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
          <option value="">All programs</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
        </select>
        <select name="mission" defaultValue={mission ?? ""} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
          <option value="">All missions</option>
          {missions.map((m) => <option key={m.code} value={m.code}>{m.code}</option>)}
        </select>
        <button type="submit" className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors">
          Filter
        </button>
        {hasFilter && (
          <Link href="/dashboard/director/missionaries" className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Clear
          </Link>
        )}
      </form>

      {enrollments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center print:hidden">
          <p className="text-sm text-gray-400">No missionaries found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-hidden rounded-xl border border-gray-200 bg-white print:border-0">
          <table className="w-full text-sm border-collapse">
            <thead className="border-b border-gray-200 bg-gray-50 print:bg-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Ref No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Mission</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Program</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Enrolled</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Gender</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">District</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 print:hidden">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enrollments.map((e, i) => (
                <tr key={e.id} className="hover:bg-gray-50 print:hover:bg-transparent transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-900">{e.trainee.fullName}</p>
                    {e.trainee.fullNameBangla && (
                      <p className="text-[11px] text-gray-500">{e.trainee.fullNameBangla}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{e.application?.referenceNumber ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 print:bg-transparent print:text-gray-700 print:px-0">
                      {e.trainee.homeMission?.code ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{e.program.code}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">
                    {new Date(e.enrolledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{e.application?.applicantGender === "MALE" ? "M" : "F"}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{e.application?.presentAddressDistrict ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500 print:hidden">{e.trainee.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-300">
              <tr className="bg-gray-50 print:bg-white">
                <td className="px-4 py-2 text-xs font-semibold text-gray-700" colSpan={9}>
                  Total: {enrollments.length} {enrollments.length !== 1 ? "Missionaries" : "Missionary"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
