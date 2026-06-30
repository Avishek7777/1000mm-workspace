import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { IdCardsClient } from "./_components/IdCardsClient";

export default async function IdCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; mission?: string }>;
}) {
  await requireRole(["SYSTEM_ADMIN", "SECRETARY", "ASSOCIATE_DIRECTOR", "MAIN_DIRECTOR"]);
  const { year, mission } = await searchParams;
  const yearNum = year ? parseInt(year, 10) : undefined;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
  });
  const isSA = user?.role === "SYSTEM_ADMIN";
  const isUD = user?.role === "MAIN_DIRECTOR" || user?.role === "SECRETARY" || user?.role === "ASSOCIATE_DIRECTOR";

  // Check permission for UD
  if (isUD) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "idcards.printing_enabled" },
    });
    const enabled = (setting?.value as boolean | null) ?? false;
    if (!enabled) redirect("/dashboard/director");
  }

  // Get setting state for SA
  const printingSetting = isSA
    ? await prisma.systemSetting.findUnique({
        where: { key: "idcards.printing_enabled" },
      })
    : null;
  const printingEnabled = (printingSetting?.value as boolean | null) ?? false;

  // All missions for filter
  const missions = await prisma.localMission.findMany({
    where: { deletedAt: null }, orderBy: { code: "asc" }, select: { code: true },
  });
  const missionCodes = missions.map((m) => m.code);

  // Programs with accepted enrollments (filtered by year/mission)
  const programs = await prisma.trainingProgram.findMany({
    where: {
      deletedAt: null,
      ...(yearNum ? { startDate: { gte: new Date(`${yearNum}-01-01`), lt: new Date(`${yearNum + 1}-01-01`) } } : {}),
      enrollments: {
        some: {
          deletedAt: null,
          application: {
            status: "ACCEPTED",
            ...(mission ? { submittedFromMission: { code: mission } } : {}),
          },
        },
      },
    },
    orderBy: { startDate: "desc" },
    select: { id: true, code: true, title: true, startDate: true },
  });

  // Year options from all programs with enrollments
  const allProgramYears = await prisma.trainingProgram.findMany({
    where: { deletedAt: null, enrollments: { some: { deletedAt: null, application: { status: "ACCEPTED" } } } },
    select: { startDate: true },
  });
  const availableYears = [...new Set(allProgramYears.map((p) => new Date(p.startDate).getFullYear()))].sort((a, b) => b - a);

  const hasFilter = !!(year || mission);

  return (
    <>
      {/* Filters */}
      <div className="mx-auto max-w-4xl px-4 pt-4 print:hidden">
        <form method="GET" className="flex flex-wrap items-center gap-2">
          <select
            name="year"
            defaultValue={year ?? ""}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">All years</option>
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            name="mission"
            defaultValue={mission ?? ""}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="">All missions</option>
            {missionCodes.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
          >
            Filter
          </button>
          {hasFilter && (
            <Link
              href="/dashboard/id-cards"
              className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      <IdCardsClient
        isSA={isSA}
        printingEnabled={printingEnabled}
        programs={programs}
      />
    </>
  );
}
