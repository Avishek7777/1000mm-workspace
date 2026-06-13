import { requireRole } from "@/lib/auth/helpers";
import { ReportsClient } from "./_components/ReportsClient";
import { prisma } from "@1000mm/db";

export default async function DirectorReportsPage() {
  await requireRole(["MAIN_DIRECTOR", "SYSTEM_ADMIN"]);
  const programs = (
    await prisma.trainingProgram.findMany({
      where: { deletedAt: null, isPublished: true },
      select: { id: true, code: true, title: true, startDate: true },
      orderBy: { startDate: "desc" },
    })
  ).map((p) => ({ ...p, startDate: p.startDate.toISOString() }));

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
