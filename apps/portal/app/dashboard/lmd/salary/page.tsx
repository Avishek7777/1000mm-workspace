import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { LmdSalaryAssignForm } from "./_components/LmdSalaryAssignForm";
import { RemoveSalaryAssignmentButton } from "./_components/RemoveSalaryAssignmentButton";
import { LmdSalaryExportButton } from "./_components/LmdSalaryExportButton";
import { PrintButton } from "@/components/PrintButton";
import Link from "next/link";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function LmdSalaryPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; gender?: string; district?: string }>;
}) {
  await requireRole(["LOCAL_DIRECTOR"]);
  const session = await auth();
  const { year, month, gender, district } = await searchParams;

  const thisYear = new Date().getFullYear();
  const yearNum  = year  ? parseInt(year,  10) : thisYear;
  const monthNum = month ? parseInt(month, 10) : undefined;
  const hasFilter = !!(month || gender || district || (year && parseInt(year, 10) !== thisYear));

  const lmd = await prisma.user.findUnique({ where: { id: session!.user!.id } });
  const mission = await prisma.localMission.findFirst({ where: { directorId: lmd!.id } });

  if (!mission) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-gray-500">No mission assigned to your account.</p>
      </div>
    );
  }

  // Build application filter for gender + district
  const appFilter: Record<string, unknown> = { status: "ACCEPTED" };
  if (gender === "MALE" || gender === "FEMALE") appFilter.applicantGender = gender;
  if (district) appFilter.presentAddressDistrict = district;
  const hasAppFilter = !!(gender || district);

  // Build month range filter for assignment createdAt
  let assignmentCreatedAtFilter: Record<string, Date> | undefined;
  if (monthNum) {
    assignmentCreatedAtFilter = {
      gte: new Date(yearNum, monthNum - 1, 1),
      lt:  new Date(yearNum, monthNum,     1),
    };
  }

  const [missionaries, range, assignments, districtRows, availableYears] = await Promise.all([
    prisma.user.findMany({
      where: {
        homeMissionId: mission.id,
        isMissionary: true,
        isActive: true,
        ...(hasAppFilter ? { applications: { some: appFilter } } : {}),
        ...(monthNum ? {
          salaryAssignments: {
            some: { missionId: mission.id, cycle: yearNum, createdAt: assignmentCreatedAtFilter },
          },
        } : {}),
      },
      orderBy: { fullName: "asc" },
      include: {
        applications: {
          where: { status: "ACCEPTED" },
          select: { applicantGender: true, presentAddressDistrict: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.salaryRange.findUnique({ where: { missionId: mission.id } }),
    prisma.salaryAssignment.findMany({
      where: {
        missionId: mission.id,
        cycle: yearNum,
        ...(assignmentCreatedAtFilter ? { createdAt: assignmentCreatedAtFilter } : {}),
      },
    }),
    prisma.application.findMany({
      where: {
        status: "ACCEPTED",
        applicant: { homeMissionId: mission.id, isMissionary: true },
        presentAddressDistrict: { not: null },
      },
      select: { presentAddressDistrict: true },
      distinct: ["presentAddressDistrict"],
      orderBy: { presentAddressDistrict: "asc" },
    }),
    prisma.salaryAssignment.findMany({
      where: { missionId: mission.id },
      select: { cycle: true },
      distinct: ["cycle"],
      orderBy: { cycle: "desc" },
    }),
  ]);

  const assignmentMap = new Map(assignments.map((a) => [a.missionaryId, a]));
  const districts = districtRows.map((d) => d.presentAddressDistrict!).filter(Boolean);
  const years = availableYears.map((r) => r.cycle);
  if (!years.includes(thisYear)) years.unshift(thisYear);


  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* Print-only header */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-teal-700 pb-4 mb-2">
        <img src="/logos/1000mm-logo.png" alt="1000MM" className="h-14 w-auto" />
        <div className="text-center">
          <p className="text-base font-bold text-gray-900">1000 Missionary Movement Bangladesh</p>
          <p className="text-sm font-semibold text-teal-700 mt-0.5">Missionary Deployment &amp; Salary List</p>
          <p className="text-xs text-gray-600 mt-1">
            {mission.name}
            {" · "}Cycle {yearNum}
            {monthNum ? ` · ${MONTHS[monthNum - 1]}` : ""}
            {gender ? ` · ${gender === "MALE" ? "Male" : "Female"}` : ""}
            {district ? ` · ${district}` : ""}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">{missionaries.length} missionaries · Cycle {yearNum}</p>
        </div>
        <img src="/logos/sda-logo.png" alt="SDA" className="h-14 w-auto" />
      </div>

      {/* Screen header */}
      <div className="print:hidden flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Missionary Deployment &amp; Salary</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {mission.name} · Cycle {yearNum}
            {monthNum ? ` · ${MONTHS[monthNum - 1]}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LmdSalaryExportButton year={String(yearNum)} month={month} gender={gender} district={district} />
          <PrintButton label="Print" />
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="print:hidden flex flex-wrap items-center gap-2">
        <select
          name="year"
          defaultValue={String(yearNum)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          name="month"
          defaultValue={month ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All months</option>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select
          name="gender"
          defaultValue={gender ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
        <select
          name="district"
          defaultValue={district ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All districts</option>
          {districts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Filter
        </button>
        {hasFilter && (
          <Link
            href="/dashboard/lmd/salary"
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {!range && (
        <div className="print:hidden rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No salary range has been set for your mission yet. Contact the Union Director.
        </div>
      )}

      {range && (
        <div className="print:hidden rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          Allowed range: ৳{range.minAmount.toLocaleString()} – ৳{range.maxAmount.toLocaleString()}
        </div>
      )}

      {missionaries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">No missionaries found for the selected filters.</p>
          {hasFilter && (
            <Link href="/dashboard/lmd/salary" className="mt-2 inline-block text-xs text-teal-600 hover:underline">
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Print-only table */}
          <div className="hidden print:block">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-400 bg-gray-50">
                  <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">#</th>
                  <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">Name</th>
                  <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">Gender</th>
                  <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">District</th>
                  <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">Deployment</th>
                  <th className="py-1.5 pr-2 text-right font-semibold text-gray-700">Amount (৳)</th>
                  <th className="py-1.5 text-left font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {missionaries.map((m, i) => {
                  const a = assignmentMap.get(m.id);
                  const app = m.applications[0];
                  return (
                    <tr key={m.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="py-1 pr-2 text-gray-400">{i + 1}</td>
                      <td className="py-1 pr-2 font-medium text-gray-900">{m.fullName}</td>
                      <td className="py-1 pr-2 text-gray-600">{app?.applicantGender === "MALE" ? "Male" : app?.applicantGender === "FEMALE" ? "Female" : "—"}</td>
                      <td className="py-1 pr-2 text-gray-600">{app?.presentAddressDistrict ?? "—"}</td>
                      <td className="py-1 pr-2 text-gray-600">{a?.deploymentLocation ?? "—"}</td>
                      <td className="py-1 pr-2 text-right text-gray-700">{a ? a.amount.toLocaleString() : "—"}</td>
                      <td className="py-1 text-gray-600">{a ? "Assigned" : "Pending"}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 font-bold">
                  <td className="py-1.5 pr-2 text-gray-600" colSpan={5}>Total ({missionaries.length})</td>
                  <td className="py-1.5 pr-2 text-right text-teal-700">
                    ৳{missionaries.reduce((s, m) => s + (assignmentMap.get(m.id)?.amount ?? 0), 0).toLocaleString()}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Screen cards */}
          <div className="print:hidden space-y-4">
            {missionaries.map((m) => {
              const existing = assignmentMap.get(m.id);
              const app = m.applications[0];
              return (
                <div key={m.id} className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{m.fullName}</p>
                      <p className="text-xs text-gray-400">
                        {m.email}
                        {app?.applicantGender ? ` · ${app.applicantGender === "MALE" ? "Male" : "Female"}` : ""}
                        {app?.presentAddressDistrict ? ` · ${app.presentAddressDistrict}` : ""}
                      </p>
                    </div>
                    {existing && (
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-medium text-teal-700">
                          ✓ Assigned
                        </span>
                        <RemoveSalaryAssignmentButton missionaryId={m.id} cycle={yearNum} />
                      </div>
                    )}
                  </div>
                  {range ? (
                    <LmdSalaryAssignForm
                      missionaryId={m.id}
                      cycle={yearNum}
                      minAmount={range.minAmount}
                      maxAmount={range.maxAmount}
                      existing={existing ? { amount: existing.amount, deploymentLocation: existing.deploymentLocation ?? "" } : null}
                    />
                  ) : (
                    <p className="text-xs text-gray-400 italic">Set a salary range first to assign salary.</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
