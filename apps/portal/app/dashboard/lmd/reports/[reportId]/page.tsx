import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";
import Link from "next/link";

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

  const backHref = isStaff
    ? "/dashboard/director/lmd-reports"
    : "/dashboard/lmd/reports";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={backHref}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ← Back to Reports
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">
          {MONTHS[report.reportMonth - 1]} {report.reportYear} — Mission Report
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {report.mission.name} · {report.lmd.fullName}
        </p>
      </div>

      {/* Submitted by / date */}
      <div className="rounded-xl border border-teal-200 bg-teal-50 px-5 py-3 flex items-center justify-between">
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
    </div>
  );
}
