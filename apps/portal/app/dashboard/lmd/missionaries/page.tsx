import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";
import { LmdMissionariesExportButton } from "./_components/LmdMissionariesExportButton";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function LmdMissionariesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; gender?: string; district?: string; programId?: string }>;
}) {
  await requireRole(["LOCAL_DIRECTOR"]);
  const session = await auth();
  const { year, month, gender, district, programId } = await searchParams;
  const yearNum  = year  ? parseInt(year,  10) : undefined;
  const monthNum = month ? parseInt(month, 10) : undefined;

  const lmdMission = await prisma.localMission.findFirst({
    where: { directorId: session!.user!.id },
  });
  if (!lmdMission) return <p className="text-sm text-gray-500">No mission assigned.</p>;

  // Programs within this mission for filter
  const programs = await prisma.trainingProgram.findMany({
    where: {
      deletedAt: null,
      enrollments: { some: { deletedAt: null, application: { status: "ACCEPTED", submittedFromMissionId: lmdMission.id } } },
    },
    orderBy: { startDate: "desc" },
    select: { id: true, code: true, title: true },
  });

  // Build enrolledAt date range from year + month
  let enrolledAtFilter: { gte: Date; lt: Date } | undefined;
  if (yearNum && monthNum) {
    enrolledAtFilter = { gte: new Date(yearNum, monthNum - 1, 1), lt: new Date(yearNum, monthNum, 1) };
  } else if (yearNum) {
    enrolledAtFilter = { gte: new Date(yearNum, 0, 1), lt: new Date(yearNum + 1, 0, 1) };
  } else if (monthNum) {
    const cy = new Date().getFullYear();
    enrolledAtFilter = { gte: new Date(cy, monthNum - 1, 1), lt: new Date(cy, monthNum, 1) };
  }

  // Missionaries: users enrolled in this mission's programs
  const enrollments = await prisma.programEnrollment.findMany({
    where: {
      deletedAt: null,
      application: {
        status: "ACCEPTED",
        submittedFromMissionId: lmdMission.id,
        ...(gender ? { applicantGender: gender as "MALE" | "FEMALE" } : {}),
        ...(district ? { presentAddressDistrict: { contains: district, mode: "insensitive" as const } } : {}),
      },
      ...(programId ? { programId } : {}),
      ...(enrolledAtFilter ? { enrolledAt: enrolledAtFilter } : {}),
    },
    orderBy: { enrolledAt: "desc" },
    include: {
      trainee: {
        select: {
          fullName: true,
          fullNameBangla: true,
          phone: true,
          profilePicture: true,
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
  });

  // Year options from enrolledAt
  const yearRows = await prisma.programEnrollment.findMany({
    where: {
      deletedAt: null,
      application: { status: "ACCEPTED", submittedFromMissionId: lmdMission.id },
    },
    select: { enrolledAt: true },
  });
  const availableYears = [...new Set(yearRows.map((e) => new Date(e.enrolledAt).getFullYear()))].sort((a, b) => b - a);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Missionaries</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {lmdMission.name} · {enrollments.length} {enrollments.length !== 1 ? "Missionaries" : "Missionary"}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <LmdMissionariesExportButton
            year={year}
            month={month}
            gender={gender}
            district={district}
            programId={programId}
          />
          <PrintButton label="Print List" />
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-4">
        <h1 className="text-base font-bold text-gray-900">1000 Missionary Movement Bangladesh — Missionaries Name List</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {lmdMission.name} · Printed {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
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
        {programs.length > 0 && (
          <select name="programId" defaultValue={programId ?? ""} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
            <option value="">All programs</option>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
          </select>
        )}
        <select name="gender" defaultValue={gender ?? ""} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
          <option value="">All genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
        <input type="text" name="district" defaultValue={district ?? ""} placeholder="District…" className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 w-32" />
        <button type="submit" className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors">Filter</button>
        {(year || month || gender || district || programId) && (
          <Link href="/dashboard/lmd/missionaries" className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Clear</Link>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Program</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Gender</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">District</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 print:hidden">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enrollments.map((e, i) => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-900">{e.trainee.fullName}</p>
                    {e.trainee.fullNameBangla && <p className="text-[11px] text-gray-500">{e.trainee.fullNameBangla}</p>}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{e.application?.referenceNumber ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{e.program.code}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{e.application?.applicantGender === "MALE" ? "M" : "F"}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{e.application?.presentAddressDistrict ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500 print:hidden">{e.trainee.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
