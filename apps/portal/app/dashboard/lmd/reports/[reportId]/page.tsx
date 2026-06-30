import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PrintButton } from "./_components/PrintButton";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default async function LmdReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  await requireRole(["LOCAL_DIRECTOR", "MAIN_DIRECTOR", "SYSTEM_ADMIN"]);
  const session = await auth();
  const { reportId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
  });
  const isStaff = ["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(user!.role);
  const isLmd = user!.role === "LOCAL_DIRECTOR";

  const report = await prisma.lmdReport.findUnique({
    where: { id: reportId },
    include: {
      lmd: { select: { fullName: true, email: true } },
      mission: { select: { name: true, code: true } },
      window: { select: { state: true } },
    },
  });

  if (!report) redirect("/dashboard/lmd/reports");

  // LMD can only see their own reports
  if (isLmd && report.lmdId !== user!.id) redirect("/dashboard/lmd/reports");

  // Top performers from field reports for this month/year in this mission
  const monthFieldReports = await prisma.fieldReport.findMany({
    where: {
      reportYear: report.reportYear,
      reportMonth: report.reportMonth,
      trainee: { homeMissionId: report.missionId },
    },
    include: { trainee: { select: { fullName: true } } },
    orderBy: { numberOfBaptisms: "desc" },
  });

  const topByBaptisms = [...monthFieldReports].sort((a, b) => b.numberOfBaptisms - a.numberOfBaptisms).slice(0, 3);
  const topByVisits = [...monthFieldReports].sort((a, b) => b.nonSdaHomeVisits - a.nonSdaHomeVisits).slice(0, 3);
  const topByReached = [...monthFieldReports].sort((a, b) => (b.peopleReached ?? 0) - (a.peopleReached ?? 0)).slice(0, 3).filter((r) => (r.peopleReached ?? 0) > 0);

  const backHref = isStaff
    ? "/dashboard/director/lmd-reports"
    : "/dashboard/lmd/reports";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Print-only header */}
      <div className="hidden print:block mb-2">
        <p className="text-base font-bold text-gray-900">
          1000 Missionary Movement Bangladesh
        </p>
        <h1 className="text-xl font-semibold text-gray-900 mt-1">
          {MONTHS[report.reportMonth - 1]} {report.reportYear} — Mission Report
        </h1>
        <p className="text-sm text-gray-600 mt-0.5">
          {report.mission.name} · {report.lmd.fullName ?? report.lmd.email}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Printed on{" "}
          {new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <hr className="mt-3 border-gray-300" />
      </div>

      {/* Screen header */}
      <div className="print:hidden">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={backHref}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ← Back to Reports
          </Link>
          <PrintButton />
        </div>
        <h1 className="mt-2 text-lg font-semibold text-gray-900">
          {MONTHS[report.reportMonth - 1]} {report.reportYear} — Mission Report
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {report.mission.name} · {report.lmd.fullName}
        </p>
      </div>

      {/* Submitted by / date */}
      <div className="rounded-xl border border-teal-200 bg-teal-50 print:bg-white print:border-gray-200 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-teal-700">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            Submitted by <strong>{report.lmd.fullName}</strong>
          </span>
        </div>
        <span className="text-xs text-teal-600">
          {new Date(report.submittedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Metrics */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Aggregated Metrics
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Trainees" value={report.totalTrainees} />
          <Metric label="Total Activities" value={report.totalActivities} />
          <Metric label="Days of Work" value={report.totalDaysOfWork} />
          <Metric label="Hours of Work" value={report.totalHoursOfWork} />
          <Metric label="Non-SDA Visits" value={report.totalNonSdaHomeVisits} />
          <Metric label="Bible Studies" value={report.totalBibleStudies} />
          <Metric label="Medical Visits" value={report.totalMedicalVisits} />
          <Metric
            label="Worship Sessions"
            value={report.totalWorshipSessions}
          />
          <Metric label="New Groups" value={report.totalNewGroups} />
          <Metric
            label="Baptism Candidates"
            value={report.totalBaptismCandidates}
          />
          <Metric label="Baptisms" value={report.totalBaptisms} />
          <Metric label="People Reached" value={report.totalPeopleReached} />
        </div>
      </div>

      {/* Narrative sections */}
      {[
        { label: "Overall Summary", value: report.overallSummary },
        { label: "Challenges and Needs", value: report.challengesAndNeeds },
        {
          label: "Recommendations to Director",
          value: report.recommendationsToDirector,
        },
        { label: "Prayer Requests", value: report.prayerRequests },
      ]
        .filter((s) => s.value)
        .map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {s.label}
            </p>
            <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
              {s.value}
            </p>
          </div>
        ))}

      {/* Top performers this month */}
      {monthFieldReports.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Top Performers — {MONTHS[report.reportMonth - 1]} {report.reportYear}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Most Baptisms", list: topByBaptisms, key: "numberOfBaptisms" as const, unit: "bap." },
              { label: "Most Visits", list: topByVisits, key: "nonSdaHomeVisits" as const, unit: "visits" },
              { label: "Most Reached", list: topByReached, key: "peopleReached" as const, unit: "reached" },
            ].map(({ label, list, key, unit }) => (
              <div key={label}>
                <p className="text-[10px] font-medium uppercase text-gray-400 mb-2">{label}</p>
                {list.length === 0 ? (
                  <p className="text-xs text-gray-300 italic">No data</p>
                ) : (
                  <ol className="space-y-1">
                    {list.map((r, i) => (
                      <li key={r.id} className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-gray-400 w-4">{i + 1}.</span>
                        <span className="flex-1 text-xs truncate text-gray-800">{r.trainee.fullName}</span>
                        <span className="text-xs font-semibold text-teal-700">{r[key] ?? 0} {unit}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
