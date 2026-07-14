import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { SETTINGS } from "@/lib/settings";
import { SalaryRangeForm } from "./_components/SalaryRangeForm";
import { SalaryWindowForm } from "./_components/SalaryWindowForm";

export default async function SalaryPage() {
  const user = await requireRole(["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"]);
  const isSA = user.role === "SYSTEM_ADMIN";

  const currentCycle = new Date().getFullYear();

  const [missions, ranges, windowStartSetting, windowEndSetting] = await Promise.all([
    prisma.localMission.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
    }),
    prisma.salaryRange.findMany({
      include: { mission: { select: { code: true } } },
    }),
    prisma.systemSetting.findUnique({ where: { key: SETTINGS.SALARY_WINDOW_START } }),
    prisma.systemSetting.findUnique({ where: { key: SETTINGS.SALARY_WINDOW_END } }),
  ]);

  const windowStart = (windowStartSetting?.value as number) ?? 8;
  const windowEnd = (windowEndSetting?.value as number) ?? 14;

  const rangeMap = new Map(ranges.map((r) => [r.missionId, r]));

  const pendingCount = await prisma.salaryRequest.count({
    where: { status: "PENDING" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Salary Management
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Set stipend ranges for each mission · Cycle {currentCycle}
          </p>
        </div>
        <Link
          href="/dashboard/salary/requests"
          className="relative rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          View Requests
          {pendingCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </Link>
      </div>

      {/* Request window control — SA only */}
      {isSA && (
        <SalaryWindowForm windowStart={windowStart} windowEnd={windowEnd} />
      )}

      <div className="space-y-4">
        {missions.map((mission) => {
          const existing = rangeMap.get(mission.id);
          return (
            <div
              key={mission.id}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                  {mission.code}
                </span>
                <p className="text-sm font-medium text-gray-900">
                  {mission.name}
                </p>
                {existing && (
                  <span className="ml-auto text-xs text-gray-400">
                    Last set: cycle {existing.cycle}
                  </span>
                )}
              </div>
              <SalaryRangeForm
                missionId={mission.id}
                missionCode={mission.code}
                currentCycle={currentCycle}
                existing={
                  existing
                    ? {
                        minAmount: existing.minAmount,
                        maxAmount: existing.maxAmount,
                        cycle: existing.cycle,
                      }
                    : null
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
