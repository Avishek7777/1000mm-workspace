import { requireRole } from "@/lib/auth/helpers";
import { getProgramsForFilter } from "@/lib/reports/queries";
import { ReportsClient } from "./_components/ReportsClient";

export default async function DirectorReportsPage() {
  await requireRole(["MAIN_DIRECTOR", "SYSTEM_ADMIN"]);
  const programs = await getProgramsForFilter();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Reports</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Generate, analyse and export programme reports
        </p>
      </div>
      <ReportsClient programs={programs} />
    </div>
  );
}
