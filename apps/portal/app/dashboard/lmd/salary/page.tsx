import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { LmdSalaryAssignForm } from "./_components/LmdSalaryAssignForm";

export default async function LmdSalaryPage() {
  await requireRole(["LOCAL_DIRECTOR"]);
  const session = await auth();

  const lmd = await prisma.user.findUnique({
    where: { id: session!.user!.id },
  });

  const mission = await prisma.localMission.findFirst({
    where: { directorId: lmd!.id },
  });

  if (!mission) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-gray-500">
          No mission assigned to your account.
        </p>
      </div>
    );
  }

  const currentCycle = new Date().getFullYear();

  const [missionaries, range, assignments] = await Promise.all([
    prisma.user.findMany({
      where: { homeMissionId: mission.id, isMissionary: true, isActive: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.salaryRange.findUnique({ where: { missionId: mission.id } }),
    prisma.salaryAssignment.findMany({
      where: { missionId: mission.id, cycle: currentCycle },
    }),
  ]);

  const assignmentMap = new Map(assignments.map((a) => [a.missionaryId, a]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          Missionary Deployment & Salary
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {mission.name} · Cycle {currentCycle}
        </p>
      </div>

      {!range && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No salary range has been set for your mission yet. Contact the Union
          Director.
        </div>
      )}

      {range && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          Allowed range: ৳{range.minAmount.toLocaleString()} – ৳
          {range.maxAmount.toLocaleString()}
        </div>
      )}

      {missionaries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">
            No active missionaries in your mission.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {missionaries.map((m) => {
            const existing = assignmentMap.get(m.id);
            return (
              <div
                key={m.id}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {m.fullName}
                    </p>
                    <p className="text-xs text-gray-400">{m.email}</p>
                  </div>
                  {existing && (
                    <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-medium text-teal-700">
                      ✓ Assigned
                    </span>
                  )}
                </div>
                {range ? (
                  <LmdSalaryAssignForm
                    missionaryId={m.id}
                    cycle={currentCycle}
                    minAmount={range.minAmount}
                    maxAmount={range.maxAmount}
                    existing={
                      existing
                        ? {
                            amount: existing.amount,
                            deploymentLocation:
                              existing.deploymentLocation ?? "",
                          }
                        : null
                    }
                  />
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    Set a salary range first to assign salary.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
