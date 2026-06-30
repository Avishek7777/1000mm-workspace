import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getFieldReportStats,
  getTopTrainees,
  getSummaryTotals,
  getAvailableYears,
} from "@/lib/fieldReportStats";
import { FieldReportStatsClient } from "../../../director/field-reports/stats/_components/FieldReportStatsClient";
import { LmdDistrictStats, type DistrictStat, type MissionaryStat } from "./_components/LmdDistrictStats";
import { LmdTopRankings } from "./_components/LmdTopRankings";
import { PrintButton } from "@/components/PrintButton";
import { FilterBar } from "../../../_components/FilterBar";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default async function LmdFieldReportStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  await requireRole(["LOCAL_DIRECTOR"]);
  const session = await auth();
  const { year, month } = await searchParams;
  const yearNum  = year  ? parseInt(year,  10) : undefined;
  const monthNum = month ? parseInt(month, 10) : undefined;

  const lmdMission = await prisma.localMission.findFirst({
    where: { directorId: session!.user!.id },
  });
  if (!lmdMission) redirect("/dashboard/lmd");

  // Fetch field reports with district info for district/missionary aggregations
  const reportsWithDetail = await prisma.fieldReport.findMany({
    where: {
      trainee: { homeMissionId: lmdMission.id },
      ...(yearNum  ? { reportYear:  yearNum  } : {}),
      ...(monthNum ? { reportMonth: monthNum } : {}),
    },
    include: {
      trainee: {
        select: {
          id: true,
          fullName: true,
          applications: {
            where: { status: "ACCEPTED" },
            select: { presentAddressDistrict: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  // Aggregate by district
  const districtMap = new Map<string, DistrictStat>();
  const missionaryMap = new Map<string, MissionaryStat>();

  for (const r of reportsWithDetail) {
    const district = r.trainee.applications[0]?.presentAddressDistrict ?? "Unknown";

    if (!districtMap.has(district)) {
      districtMap.set(district, { district, baptisms: 0, peopleReached: 0, visits: 0, baptismCandidates: 0, reportCount: 0 });
    }
    const d = districtMap.get(district)!;
    d.baptisms          += r.numberOfBaptisms;
    d.peopleReached     += r.peopleReached ?? 0;
    d.visits            += r.nonSdaHomeVisits;
    d.baptismCandidates += r.baptismCandidatesPrepared;
    d.reportCount++;

    // Aggregate by missionary
    const name = r.trainee.fullName;
    if (!missionaryMap.has(name)) {
      missionaryMap.set(name, { fullName: name, baptisms: 0, peopleReached: 0, visits: 0, baptismCandidates: 0 });
    }
    const m = missionaryMap.get(name)!;
    m.baptisms          += r.numberOfBaptisms;
    m.peopleReached     += r.peopleReached ?? 0;
    m.visits            += r.nonSdaHomeVisits;
    m.baptismCandidates += r.baptismCandidatesPrepared;
  }

  const districtStats = Array.from(districtMap.values()).sort((a, b) => b.baptisms - a.baptisms);
  const missionaryStats = Array.from(missionaryMap.values()).sort((a, b) => b.baptisms - a.baptisms);

  const [monthly, quarterly, yearly, topTrainees, totals, availableYears] = await Promise.all([
    getFieldReportStats("monthly",   lmdMission.id, yearNum, undefined, undefined, monthNum),
    getFieldReportStats("quarterly", lmdMission.id, yearNum, undefined, undefined, monthNum),
    getFieldReportStats("yearly",    lmdMission.id),
    getTopTrainees(lmdMission.id, 10, yearNum, undefined, undefined, monthNum),
    getSummaryTotals(lmdMission.id, yearNum, undefined, undefined, monthNum),
    getAvailableYears(lmdMission.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Link
              href="/dashboard/lmd/field-reports"
              className="print:hidden text-xs text-gray-500 hover:text-gray-700"
            >
              ← Field Reports
            </Link>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Field Report Statistics</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {lmdMission.name}{yearNum ? ` · ${yearNum}` : ""} · Monthly, quarterly, and yearly aggregations
          </p>
        </div>
        <PrintButton label="Print Stats" />
      </div>

      {/* Year filter */}
      <FilterBar
        basePath="/dashboard/lmd/field-reports/stats"
        current={{ year: year ?? "", month: month ?? "" }}
        className="print:hidden"
        filters={[
          {
            name: "year",
            label: "Year",
            allLabel: "All years",
            options: availableYears.map((y) => ({ value: String(y), label: String(y) })),
          },
          {
            name: "month",
            label: "Month",
            allLabel: "All months",
            options: MONTHS.map((m, i) => ({ value: String(i + 1), label: m })),
          },
        ]}
      />

      <FieldReportStatsClient
        initialMode="monthly"
        monthlyData={monthly}
        quarterlyData={quarterly}
        yearlyData={yearly}
        topTrainees={topTrainees}
        totals={totals}
        isStaff={false}
      />

      <LmdTopRankings missionaryStats={missionaryStats} districtStats={districtStats} />

      <LmdDistrictStats districtStats={districtStats} missionaryStats={missionaryStats} />
    </div>
  );
}
