import { prisma } from "@1000mm/db";
import { requireRole } from "@/lib/auth/helpers";
import { loadScholarships } from "@/lib/scholarshipQueries";
import { ScholarshipStatusCard } from "@/app/dashboard/_components/scholarships/ScholarshipStatusCard";
import { ScholarshipExportButtons } from "@/app/dashboard/_components/scholarships/ScholarshipExportButtons";

export const dynamic = "force-dynamic";

export default async function LmdScholarshipsPage() {
  const user = await requireRole(["LOCAL_DIRECTOR"]);

  const mission = await prisma.localMission.findFirst({
    where: { directorId: user.id },
    select: { id: true, code: true, name: true },
  });

  if (!mission) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-lg font-semibold text-gray-900">Scholarship Applications</h1>
        <p className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400">
          No mission is assigned to your account.
        </p>
      </div>
    );
  }

  const requests = await loadScholarships({ missionId: mission.id });
  const awaiting = requests.filter((r) =>
    ["SUBMITTED", "UNDER_LMD_REVIEW"].includes(r.status),
  );
  const decided = requests.filter(
    (r) => !["SUBMITTED", "UNDER_LMD_REVIEW"].includes(r.status),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Scholarship Applications</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {mission.name} ({mission.code})
          </p>
        </div>
        <ScholarshipExportButtons />
      </div>

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
          Awaiting your review
          {awaiting.length > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-700">
              {awaiting.length}
            </span>
          )}
        </h2>
        {awaiting.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
            Nothing waiting on you
          </p>
        ) : (
          <div className="space-y-3">
            {awaiting.map((r) => (
              <ScholarshipStatusCard key={r.id} request={r} viewer="LMD" />
            ))}
          </div>
        )}
      </section>

      {decided.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Decided
          </h2>
          <div className="space-y-3">
            {decided.map((r) => (
              <ScholarshipStatusCard key={r.id} request={r} viewer="LMD" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
