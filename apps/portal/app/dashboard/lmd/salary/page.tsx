import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { LmdSalaryAssignForm } from "./_components/LmdSalaryAssignForm";
import { RemoveSalaryAssignmentButton } from "./_components/RemoveSalaryAssignmentButton";
import { LmdSalaryExportButton } from "./_components/LmdSalaryExportButton";
import { SubmitSalaryRequestButton } from "./_components/SubmitSalaryRequestButton";
import { PrintButton } from "@/components/PrintButton";
import { SETTINGS } from "@/lib/settings";
import Link from "next/link";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function LmdSalaryPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; gender?: string; district?: string; program?: string }>;
}) {
  await requireRole(["LOCAL_DIRECTOR"]);
  const session = await auth();
  const { year, month, gender, district, program } = await searchParams;

  const thisYear = new Date().getFullYear();
  const yearNum  = year  ? parseInt(year,  10) : thisYear;
  const monthNum = month ? parseInt(month, 10) : undefined;
  const hasFilter = !!(month || gender || district || program || (year && parseInt(year, 10) !== thisYear));

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

  const [missionaries, range, assignments, districtRows, availableYears, programs] = await Promise.all([
    prisma.user.findMany({
      where: {
        homeMissionId: mission.id,
        isMissionary: true,
        isActive: true,
        ...(hasAppFilter ? { applications: { some: appFilter } } : {}),
        // Program: missionaries enrolled in the selected training program
        ...(program ? {
          enrollmentsAsTrainee: {
            some: { programId: program, deletedAt: null },
          },
        } : {}),
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
    // Programs with enrollments from this mission — for the filter
    prisma.trainingProgram.findMany({
      where: {
        deletedAt: null,
        enrollments: {
          some: { deletedAt: null, trainee: { homeMissionId: mission.id } },
        },
      },
      orderBy: { startDate: "desc" },
      select: { id: true, code: true, title: true },
    }),
  ]);

  // Active deployment per missionary — the single source of truth for
  // "where is this person deployed," mirrored automatically into
  // SalaryAssignment.deploymentLocation on assignment (see deploymentSync.ts).
  const activeDeployments = await prisma.missionaryDeployment.findMany({
    where: { missionaryId: { in: missionaries.map((m) => m.id) }, status: "ACTIVE", deletedAt: null },
    select: { missionaryId: true, location: true },
  });
  const deploymentLocationMap = new Map(activeDeployments.map((d) => [d.missionaryId, d.location]));

  const assignmentMap = new Map(assignments.map((a) => [a.missionaryId, a]));
  const districts = districtRows.map((d) => d.presentAddressDistrict!).filter(Boolean);
  const years = availableYears.map((r) => r.cycle);
  if (!years.includes(thisYear)) years.unshift(thisYear);

  // ── This month's salary requests (LMD submits on the missionary's behalf) ──
  // Only relevant while viewing the current cycle year — a request is always
  // for the real current month, regardless of which year the list is filtered to.
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  const [windowStartSetting, windowEndSetting, currentMonthRequests] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: SETTINGS.SALARY_WINDOW_START } }),
    prisma.systemSetting.findUnique({ where: { key: SETTINGS.SALARY_WINDOW_END } }),
    yearNum === thisYear
      ? prisma.salaryRequest.findMany({
          where: { missionId: mission.id, month: currentMonth, year: thisYear },
        })
      : Promise.resolve([]),
  ]);
  const windowStart = (windowStartSetting?.value as number) ?? 8;
  const windowEnd = (windowEndSetting?.value as number) ?? 14;
  const isSalaryWindowOpen = currentDay >= windowStart && currentDay <= windowEnd;
  const requestMap = new Map(currentMonthRequests.map((r) => [r.missionaryId, r]));
  const REQUEST_STATUS_STYLES: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-teal-100 text-teal-700",
    REJECTED: "bg-red-100 text-red-700",
  };


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
            {program ? ` · ${programs.find((p) => p.id === program)?.code ?? ""}` : ""}
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
          <LmdSalaryExportButton year={String(yearNum)} month={month} gender={gender} district={district} program={program} />
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
        <select
          name="program"
          defaultValue={program ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All programs</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.code} — {p.title}</option>
          ))}
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
              const deploymentLocation = deploymentLocationMap.get(m.id) ?? null;
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
                  {!deploymentLocation ? (
                    <p className="text-xs text-amber-600 italic">
                      No active field deployment on record —{" "}
                      <a href="/dashboard/lmd/deployments" className="underline">assign one in Deployments</a>{" "}
                      before setting salary.
                    </p>
                  ) : range ? (
                    <LmdSalaryAssignForm
                      missionaryId={m.id}
                      cycle={yearNum}
                      minAmount={range.minAmount}
                      maxAmount={range.maxAmount}
                      deploymentLocation={deploymentLocation}
                      existing={existing ? { amount: existing.amount } : null}
                    />
                  ) : (
                    <p className="text-xs text-gray-400 italic">Set a salary range first to assign salary.</p>
                  )}

                  {/* This month's salary request — LMD submits on the missionary's behalf */}
                  {yearNum === thisYear && existing && (
                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-500">
                        {MONTHS[currentMonth - 1]} {thisYear} salary request
                      </p>
                      {(() => {
                        const req = requestMap.get(m.id);
                        if (req) {
                          return (
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${REQUEST_STATUS_STYLES[req.status]}`}
                            >
                              {req.status}
                            </span>
                          );
                        }
                        return (
                          <SubmitSalaryRequestButton
                            missionaryId={m.id}
                            isWindowOpen={isSalaryWindowOpen}
                            windowStart={windowStart}
                            windowEnd={windowEnd}
                          />
                        );
                      })()}
                    </div>
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
