import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";
import { LmdDeployedMissionariesExportButton } from "./_components/LmdDeployedMissionariesExportButton";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const statusLabel: Record<string, string> = {
  PENDING: "Pending", ACTIVE: "Active", COMPLETED: "Completed", REJECTED: "Rejected",
};
const statusClass: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-teal-100 text-teal-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  REJECTED: "bg-red-100 text-red-600",
};

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function LmdDeployedMissionariesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; gender?: string; district?: string; programId?: string }>;
}) {
  await requireRole(["LOCAL_DIRECTOR"]);
  const session = await auth();
  const { year, month, gender, district, programId } = await searchParams;
  const yearNum  = year  ? parseInt(year,  10) : undefined;
  const monthNum = month ? parseInt(month, 10) : undefined;
  const hasFilter = !!(year || month || gender || district || programId);

  const lmdMission = await prisma.localMission.findFirst({
    where: { directorId: session!.user!.id },
  });
  if (!lmdMission) return <p className="text-sm text-gray-500">No mission assigned.</p>;

  let startDateFilter: { gte: Date; lt: Date } | undefined;
  if (yearNum && monthNum) {
    startDateFilter = { gte: new Date(yearNum, monthNum - 1, 1), lt: new Date(yearNum, monthNum, 1) };
  } else if (yearNum) {
    startDateFilter = { gte: new Date(yearNum, 0, 1), lt: new Date(yearNum + 1, 0, 1) };
  } else if (monthNum) {
    const cy = new Date().getFullYear();
    startDateFilter = { gte: new Date(cy, monthNum - 1, 1), lt: new Date(cy, monthNum, 1) };
  }

  const [deployments, yearRows, programs, districtRows] = await Promise.all([
    prisma.missionaryDeployment.findMany({
      where: {
        deletedAt: null,
        missionary: {
          homeMissionId: lmdMission.id,
          ...((gender || district) ? {
            applications: {
              some: {
                status: "ACCEPTED",
                ...(gender ? { applicantGender: gender as "MALE" | "FEMALE" } : {}),
                ...(district ? { presentAddressDistrict: district } : {}),
              },
            },
          } : {}),
          ...(programId ? {
            enrollmentsAsTrainee: {
              some: { programId, deletedAt: null },
            },
          } : {}),
        },
        ...(startDateFilter ? { startDate: startDateFilter } : {}),
      },
      orderBy: { startDate: "desc" },
      include: {
        missionary: {
          select: {
            fullName: true,
            fullNameBangla: true,
            phone: true,
            applications: {
              where: { status: "ACCEPTED" },
              select: { applicantGender: true, presentAddressDistrict: true, referenceNumber: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            enrollmentsAsTrainee: {
              where: { deletedAt: null },
              select: { program: { select: { code: true } } },
              orderBy: { enrolledAt: "desc" },
              take: 1,
            },
          },
        },
        mission: { select: { code: true, name: true } },
      },
    }),
    prisma.missionaryDeployment.findMany({
      where: { deletedAt: null, missionary: { homeMissionId: lmdMission.id } },
      select: { startDate: true },
    }),
    prisma.trainingProgram.findMany({
      where: {
        deletedAt: null,
        enrollments: {
          some: {
            deletedAt: null,
            trainee: { homeMissionId: lmdMission.id },
          },
        },
      },
      orderBy: { startDate: "desc" },
      select: { id: true, code: true },
    }),
    prisma.user.findMany({
      where: {
        homeMissionId: lmdMission.id,
        deletedAt: null,
        applications: { some: { status: "ACCEPTED", presentAddressDistrict: { not: null } } },
      },
      select: {
        applications: {
          where: { status: "ACCEPTED", presentAddressDistrict: { not: null } },
          select: { presentAddressDistrict: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  const availableYears = [...new Set(yearRows.map((d) => new Date(d.startDate).getFullYear()))].sort((a, b) => b - a);
  const districts = [...new Set(
    districtRows.flatMap((u) => u.applications.map((a) => a.presentAddressDistrict)).filter(Boolean) as string[]
  )].sort();

  const filterLabel = [
    lmdMission.name,
    yearNum  ? String(yearNum)      : null,
    monthNum ? MONTHS[monthNum - 1] : null,
    gender === "MALE" ? "Male" : gender === "FEMALE" ? "Female" : null,
    district ?? null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Print-only header */}
      <div className="hidden print:block mb-4">
        <div className="flex items-center justify-between border-b-2 border-gray-800 pb-3 mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/1000mm-logo.png" alt="1000MM" className="h-12 w-auto" />
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">1000 Missionary Movement Bangladesh</p>
            <h1 className="text-base font-bold text-gray-900 mt-0.5">Deployed Missionaries</h1>
            <p className="text-xs text-gray-600 mt-0.5">{filterLabel}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {deployments.length} {deployments.length !== 1 ? "Missionaries" : "Missionary"}
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/sda-logo.png" alt="SDA" className="h-12 w-auto" />
        </div>
      </div>

      {/* Screen header */}
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Deployed Missionaries</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {lmdMission.name} · {deployments.length} {deployments.length !== 1 ? "Missionaries" : "Missionary"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LmdDeployedMissionariesExportButton
            year={year}
            month={month}
            gender={gender}
            district={district}
            programId={programId}
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
        <select name="district" defaultValue={district ?? ""} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20">
          <option value="">All districts</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <button type="submit" className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors">
          Filter
        </button>
        {hasFilter && (
          <Link href="/dashboard/lmd/missionaries/deployed" className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Clear
          </Link>
        )}
      </form>

      {deployments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center print:hidden">
          <p className="text-sm text-gray-400">No deployed missionaries found.</p>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Deployed To</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 print:hidden">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Gender</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">District</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 print:hidden">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deployments.map((d, i) => {
                const app = d.missionary.applications[0];
                const prog = d.missionary.enrollmentsAsTrainee[0]?.program;
                return (
                  <tr key={d.id} className="hover:bg-gray-50 print:hover:bg-transparent transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-gray-900">{d.missionary.fullName}</p>
                      {d.missionary.fullNameBangla && (
                        <p className="text-[11px] text-gray-500">{d.missionary.fullNameBangla}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{app?.referenceNumber ?? "—"}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{prog?.code ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">{d.mission.code}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">{fmtDate(d.startDate)}</td>
                    <td className="px-4 py-2.5 print:hidden">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClass[d.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {statusLabel[d.status] ?? d.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">{app?.applicantGender === "MALE" ? "M" : "F"}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">{app?.presentAddressDistrict ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 print:hidden">{d.missionary.phone ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-gray-300">
              <tr className="bg-gray-50 print:bg-white">
                <td className="px-4 py-2 text-xs font-semibold text-gray-700" colSpan={10}>
                  Total: {deployments.length} {deployments.length !== 1 ? "Missionaries" : "Missionary"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
