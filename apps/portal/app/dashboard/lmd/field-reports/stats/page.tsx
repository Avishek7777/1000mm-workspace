import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getFieldReportStats,
  getTopTrainees,
  getSummaryTotals,
} from "@/lib/fieldReportStats";
import { FieldReportStatsClient } from "../../../director/field-reports/stats/_components/FieldReportStatsClient";

export default async function LmdFieldReportStatsPage() {
  await requireRole(["LOCAL_DIRECTOR"]);
  const session = await auth();

  const lmdMission = await prisma.localMission.findFirst({
    where: { directorId: session!.user!.id },
  });
  if (!lmdMission) redirect("/dashboard/lmd");

  const [monthly, quarterly, yearly, topTrainees, totals] = await Promise.all([
    getFieldReportStats("monthly", lmdMission.id),
    getFieldReportStats("quarterly", lmdMission.id),
    getFieldReportStats("yearly", lmdMission.id),
    getTopTrainees(lmdMission.id, 10),
    getSummaryTotals(lmdMission.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Link
            href="/dashboard/lmd/field-reports"
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ← Field Reports
          </Link>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">
          Field Report Statistics
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {lmdMission.name} · Monthly, quarterly, and yearly aggregations
        </p>
      </div>

      <FieldReportStatsClient
        initialMode="monthly"
        monthlyData={monthly}
        quarterlyData={quarterly}
        yearlyData={yearly}
        topTrainees={topTrainees}
        totals={totals}
        isStaff={false}
      />
    </div>
  );
}
