import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import Link from "next/link";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default async function LmdFieldReportsPage() {
  await requireRole(["LOCAL_DIRECTOR"]);
  const session = await auth();

  // Get LMD's mission
  const lmdMission = await prisma.localMission.findFirst({
    where: { directorId: session!.user!.id },
  });
  if (!lmdMission)
    return <p className="text-sm text-gray-500">No mission assigned.</p>;

  const reports = await prisma.fieldReport.findMany({
    where: {
      trainee: { homeMissionId: lmdMission.id },
    },
    orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }],
    include: {
      trainee: { select: { fullName: true } },
      program: { select: { code: true } },
      _count: { select: { comments: true } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Field Reports</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {lmdMission.name} · {reports.length} report
          {reports.length !== 1 ? "s" : ""}
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">
            No field reports submitted yet from your mission.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Link
              key={r.id}
              href={`/dashboard/field-reports/${r.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">
                      {r.trainee.fullName}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">
                      {MONTHS[r.reportMonth - 1]} {r.reportYear}
                    </span>
                    <span className="font-mono text-[10px] text-gray-400">
                      {r.program.code}
                    </span>
                    {r._count.comments > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        {r._count.comments} comment
                        {r._count.comments !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Activities: {r.totalActivities}</span>
                    <span>Days: {r.daysOfWork}</span>
                    <span>Baptisms: {r.numberOfBaptisms}</span>
                    {r.peopleReached != null && (
                      <span>People reached: {r.peopleReached}</span>
                    )}
                  </div>
                </div>
                <span className="flex-shrink-0 text-[11px] text-gray-400">
                  {new Date(r.submittedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
