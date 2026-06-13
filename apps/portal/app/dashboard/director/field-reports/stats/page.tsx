import { requireRole } from "@/lib/auth/helpers";
import Link from "next/link";
import {
  getFieldReportStats,
  getMissionStats,
  getTopTrainees,
  getSummaryTotals,
} from "@/lib/fieldReportStats";
import { FieldReportStatsClient } from "./_components/FieldReportStatsClient";

export default async function DirectorFieldReportStatsPage() {
  await requireRole(["MAIN_DIRECTOR", "SYSTEM_ADMIN"]);

  const [monthly, quarterly, yearly, missionStats, topTrainees, totals] =
    await Promise.all([
      getFieldReportStats("monthly"),
      getFieldReportStats("quarterly"),
      getFieldReportStats("yearly"),
      getMissionStats(),
      getTopTrainees(undefined, 10),
      getSummaryTotals(),
    ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Link
              href="/dashboard/director/field-reports"
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ← Field Reports
            </Link>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            Field Report Statistics
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            All missions · Monthly, quarterly, and yearly aggregations
          </p>
        </div>
      </div>

      <FieldReportStatsClient
        initialMode="monthly"
        monthlyData={monthly}
        quarterlyData={quarterly}
        yearlyData={yearly}
        missionStats={missionStats}
        topTrainees={topTrainees}
        totals={totals}
        isStaff={true}
      />
    </div>
  );
}
