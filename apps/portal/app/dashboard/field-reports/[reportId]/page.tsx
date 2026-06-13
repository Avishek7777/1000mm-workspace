import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { CommentForm } from "./_components/CommentForm";

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

function Metric({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-gray-900">{value ?? 0}</p>
    </div>
  );
}

export default async function FieldReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { reportId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { homeMission: true },
  });
  if (!user) redirect("/login");

  const report = await prisma.fieldReport.findUnique({
    where: { id: reportId },
    include: {
      trainee: {
        include: {
          homeMission: {
            include: { director: { select: { fullName: true } } },
          },
        },
      },
      program: { select: { code: true, title: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { fullName: true, role: true } } },
      },
    },
  });

  if (!report) redirect("/dashboard/field-reports");

  // Access control
  const isTrainee = user.role === "TRAINEE";
  const isLmd = user.role === "LOCAL_DIRECTOR";
  const isStaff = ["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(user.role);
  const isOwner = report.traineeId === user.id;

  // LMD can only see reports from their mission
  const lmdMission = isLmd
    ? await prisma.localMission.findFirst({ where: { directorId: user.id } })
    : null;

  const canView =
    isOwner ||
    isStaff ||
    (isLmd && lmdMission?.id === report.trainee.homeMission?.id);

  if (!canView) redirect("/dashboard/field-reports");

  const canComment = isLmd || isStaff;

  const backHref = isLmd
    ? `/dashboard/lmd/field-reports`
    : isStaff
      ? `/dashboard/director/field-reports`
      : `/dashboard/field-reports`;

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      LOCAL_DIRECTOR: "Local Director",
      MAIN_DIRECTOR: "Union Director",
      SYSTEM_ADMIN: "System Admin",
      TRAINER: "Trainer",
      TRAINEE: "Trainee",
    };
    return map[role] ?? role;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={backHref}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ← Back to Reports
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-900">
            {MONTHS[report.reportMonth - 1]} {report.reportYear} — Field Report
          </h1>
        </div>
        <p className="mt-0.5 text-sm text-gray-500">
          {report.program.code} · {report.program.title}
        </p>
      </div>

      {/* Worker info */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Worker Information
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-gray-400">Name</p>
            <p className="font-medium text-gray-900">
              {report.trainee.fullName}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Email</p>
            <p className="font-medium text-gray-900">{report.trainee.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Mission</p>
            <p className="font-medium text-gray-900">
              {report.trainee.homeMission?.name ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Local Director</p>
            <p className="font-medium text-gray-900">
              {report.lmdNameSnapshot ??
                report.trainee.homeMission?.director?.fullName ??
                "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Workplace</p>
            <p className="font-medium text-gray-900">
              {report.workplaceSnapshot ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Submitted</p>
            <p className="font-medium text-gray-900">
              {new Date(report.submittedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Activity Metrics
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Total Activities" value={report.totalActivities} />
          <Metric label="Days of Work" value={report.daysOfWork} />
          <Metric label="Hours of Work" value={report.hoursOfWork} />
          <Metric label="People Reached" value={report.peopleReached} />
          <Metric label="Non-SDA Home Visits" value={report.nonSdaHomeVisits} />
          <Metric label="Bible Studies" value={report.bibleStudiesConducted} />
          <Metric label="Medical Visits" value={report.medicalVisits} />
          <Metric
            label="Worship Sessions"
            value={report.worshipSessionsTaken}
          />
          <Metric label="New Groups" value={report.newGroupsMade} />
          <Metric
            label="Baptism Candidates"
            value={report.baptismCandidatesPrepared}
          />
          <Metric label="Baptisms" value={report.numberOfBaptisms} />
        </div>
      </div>

      {/* Narrative sections */}
      {[
        {
          label: "Brief Description of Worker's Activities",
          value: report.activitiesSummary,
        },
        { label: "Training Received", value: report.trainingReceived },
        { label: "Story or Witness", value: report.storyOrWitness },
        { label: "Challenges Faced", value: report.challengesFaced },
        { label: "Prayer Requests", value: report.prayerRequests },
        {
          label: "Comments or Suggestions",
          value: report.commentsOrSuggestions,
        },
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

      {/* Comments */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Comments {report.comments.length > 0 && `(${report.comments.length})`}
        </p>

        {report.comments.length === 0 && !canComment && (
          <p className="text-sm text-gray-400">No comments yet.</p>
        )}

        <div className="space-y-4">
          {report.comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
                {c.author.fullName
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs font-medium text-gray-900">
                    {c.author.fullName}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {roleLabel(c.author.role)}
                  </p>
                  <p className="ml-auto text-[10px] text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {c.comment}
                </p>
              </div>
            </div>
          ))}
        </div>

        {canComment && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <CommentForm reportId={reportId} />
          </div>
        )}
      </div>
    </div>
  );
}
