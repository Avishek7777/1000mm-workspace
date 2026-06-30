import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { AvailablePrograms } from "./_components/AvailablePrograms";
import { WithdrawApplicationButton } from "./_components/WithdrawApplicationButton";

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function programStatus(
  startDate: Date,
  endDate: Date,
): {
  label: string;
  color: string;
  bg: string;
} {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (now < start)
    return { label: "Upcoming", color: "text-blue-700", bg: "bg-blue-100" };
  if (now > end)
    return { label: "Completed", color: "text-gray-600", bg: "bg-gray-100" };
  return { label: "Active", color: "text-teal-700", bg: "bg-teal-100" };
}

function progressPercent(startDate: Date, endDate: Date): number {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

export default async function MyProgramPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      homeMission: {
        include: { director: { select: { fullName: true, email: true } } },
      },
    },
  });
  if (!user || user.role !== "TRAINEE") redirect("/dashboard");

  // ── Enrolled (placed by SA/UD) — drives the full program card below ──
  const enrolled = await prisma.programEnrollment.findFirst({
    where: { traineeId: user.id, deletedAt: null, status: "ENROLLED" },
    include: {
      program: true,
      application: {
        select: {
          referenceNumber: true,
          submittedAt: true,
          directorReviewCompletedAt: true,
        },
      },
      deploymentAssignedBy: { select: { fullName: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  // ── Pending application (consent given, awaiting placement) ──
  const applied = enrolled
    ? null
    : await prisma.programEnrollment.findFirst({
        where: { traineeId: user.id, deletedAt: null, status: "APPLIED" },
        include: { program: true },
      });

  // ── Accepted into the system? (basis for applying) ──
  const acceptedApp =
    enrolled || applied
      ? null
      : await prisma.application.findFirst({
          where: { applicantId: user.id, status: "ACCEPTED", deletedAt: null },
        });

  // ── Active programs available to apply to ──
  const activePrograms = acceptedApp
    ? await prisma.trainingProgram.findMany({
        where: {
          deletedAt: null,
          isPublished: true,
          endDate: { gte: new Date() },
        },
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          code: true,
          title: true,
          category: true,
          location: true,
          startDate: true,
          endDate: true,
          targetIntake: true,
          _count: {
            select: {
              enrollments: { where: { status: "ENROLLED", deletedAt: null } },
            },
          },
        },
      })
    : [];

  // ── State: applied, awaiting placement ──
  if (applied) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">My Program</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Your program application
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
            <p className="text-sm font-semibold text-amber-800">
              Application pending review
            </p>
          </div>
          <p className="text-xs leading-relaxed text-amber-700">
            You've applied to{" "}
            <span className="font-medium">{applied.program.title}</span>{" "}
            <span className="font-mono">({applied.program.code})</span>.
            Leadership will review and place you into the program soon. You'll
            see your full program details here once you're enrolled.
          </p>
          <p className="mt-2 text-[11px] text-amber-600">
            Applied on {formatDate(applied.appliedAt)}
          </p>
          <div className="mt-4">
            <WithdrawApplicationButton />
          </div>
        </div>
      </div>
    );
  }

  // ── State: accepted into the system, hasn't applied yet → browse + apply ──
  if (acceptedApp) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">My Program</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            You've been accepted — apply to an active program to get started.
          </p>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
          <p className="text-xs text-teal-800">
            Your application was accepted. Choose a program below and apply.
            Leadership will then place you into the program.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Active Programs
          </p>
          <AvailablePrograms
            programs={activePrograms.map((p) => ({
              id: p.id,
              code: p.code,
              title: p.title,
              category: p.category,
              location: p.location,
              startDate: p.startDate,
              endDate: p.endDate,
              spotsLeft: p.targetIntake - p._count.enrollments,
            }))}
          />
        </div>
      </div>
    );
  }

  // ── State: not accepted yet → waiting ──
  if (!enrolled) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">My Program</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Your training program details
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <svg
            className="mx-auto mb-3 h-10 w-10 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
            />
          </svg>
          <p className="text-sm font-medium text-gray-600">
            No active program yet
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Once your application has been accepted, you'll be able to apply to
            an active program from here.
          </p>
          <Link
            href="/dashboard/my-application"
            className="mt-4 inline-block rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            View My Application →
          </Link>
        </div>
      </div>
    );
  }

  // ── State: enrolled → full program card ──
  const enrollment = enrolled;

  // Field report stats (enrolled only)
  const reportCount = await prisma.fieldReport.count({
    where: { traineeId: user.id },
  });
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const hasThisMonthReport = await prisma.fieldReport.findFirst({
    where: {
      traineeId: user.id,
      reportMonth: currentMonth,
      reportYear: currentYear,
    },
  });

  const program = enrollment.program;
  const status = programStatus(program.startDate, program.endDate);
  const progress = progressPercent(program.startDate, program.endDate);
  const lmd = user.homeMission.director;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">My Program</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Your training program details and deployment
        </p>
      </div>

      {/* Program card */}
      <div className="rounded-xl border border-teal-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-gray-400">
                {program.code}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${status.bg} ${status.color}`}
              >
                {status.label}
              </span>
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {program.title}
            </h2>
            {program.titleBangla && (
              <p className="mt-0.5 text-sm text-gray-500">
                {program.titleBangla}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-[11px] text-gray-400">
            <span>{formatDate(program.startDate)}</span>
            <span>{progress}% complete</span>
            <span>{formatDate(program.endDate)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-teal-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Program details grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: "Category", value: program.category },
            { label: "Location", value: program.location ?? "—" },
            { label: "Start Date", value: formatDate(program.startDate) },
            { label: "End Date", value: formatDate(program.endDate) },
            {
              label: "Target Intake",
              value: `${program.targetIntake} trainees`,
            },
            {
              label: "Reference No.",
              value: enrollment.application?.referenceNumber ?? "—",
            },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[11px] text-gray-400">{item.label}</p>
              <p className="font-medium text-gray-900">{item.value}</p>
            </div>
          ))}
        </div>

        {program.summary && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500 leading-relaxed">
              {program.summary}
            </p>
          </div>
        )}
      </div>

      {/* Enrollment info */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Enrollment
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[11px] text-gray-400">Enrolled On</p>
            <p className="font-medium text-gray-900">
              {formatDate(enrollment.enrolledAt)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Accepted On</p>
            <p className="font-medium text-gray-900">
              {formatDate(enrollment.application?.directorReviewCompletedAt)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Attendance</p>
            <p
              className={`font-medium ${enrollment.attendanceConfirmed ? "text-teal-700" : "text-amber-600"}`}
            >
              {enrollment.attendanceConfirmed ? "Confirmed" : "Pending"}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">Certificate</p>
            <p
              className={`font-medium ${enrollment.certificateIssued ? "text-teal-700" : "text-gray-500"}`}
            >
              {enrollment.certificateIssued
                ? `Issued ${formatDate(enrollment.certificateIssuedAt)}`
                : "Not yet issued"}
            </p>
          </div>
        </div>
      </div>

      {/* Deployment info */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Deployment
        </p>
        {enrollment.deploymentLocation ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[11px] text-gray-400">Assigned Location</p>
              <p className="font-medium text-gray-900">
                {enrollment.deploymentLocation}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Assigned On</p>
              <p className="font-medium text-gray-900">
                {formatDate(enrollment.deploymentAssignedAt)}
              </p>
            </div>
            {enrollment.deploymentAssignedBy && (
              <div>
                <p className="text-[11px] text-gray-400">Assigned By</p>
                <p className="font-medium text-gray-900">
                  {enrollment.deploymentAssignedBy.fullName}
                </p>
              </div>
            )}
            <div>
              <p className="text-[11px] text-gray-400">Mission</p>
              <p className="font-medium text-gray-900">
                {user.homeMission.name}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            Your deployment location has not been assigned yet. Your Local
            Mission Director will assign it soon.
          </div>
        )}
      </div>

      {/* LMD info */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Your Local Mission Director
        </p>
        {lmd ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
              {lmd.fullName
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {lmd.fullName}
              </p>
              <p className="text-xs text-gray-500">
                {lmd.email} · {user.homeMission.name}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            No LMD assigned to your mission yet.
          </p>
        )}
      </div>

      {/* Field reports quick link */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Field Reports</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {reportCount} report{reportCount !== 1 ? "s" : ""} submitted
              {!hasThisMonthReport && (
                <span className="ml-2 text-amber-600 font-medium">
                  · {new Date().toLocaleString("en-US", { month: "long" })}{" "}
                  report due
                </span>
              )}
            </p>
          </div>
          <Link
            href="/dashboard/field-reports"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Reports →
          </Link>
        </div>
        {!hasThisMonthReport && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <Link
              href="/dashboard/field-reports/new"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800 transition-colors"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Submit {new Date().toLocaleString("en-US", { month: "long" })}{" "}
              Report
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
