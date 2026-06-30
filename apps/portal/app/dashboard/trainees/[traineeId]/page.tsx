import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CertificateButton } from "./_components/CertificateButton";

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

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function TraineeDetailPage({
  params,
}: {
  params: Promise<{ traineeId: string }>;
}) {
  await requireRole([
    "MAIN_DIRECTOR",
    "SYSTEM_ADMIN",
    "LOCAL_DIRECTOR",
    "TRAINER",
  ]);
  const session = await auth();
  const { traineeId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
  });
  const isLmd = user?.role === "LOCAL_DIRECTOR";
  const isStaff = ["MAIN_DIRECTOR", "SYSTEM_ADMIN"].includes(user?.role ?? "");

  // Trainee profile
  const trainee = await prisma.user.findUnique({
    where: { id: traineeId },
    include: {
      homeMission: {
        include: { director: { select: { fullName: true } } },
      },
    },
  });
  if (!trainee || trainee.role !== "TRAINEE") redirect("/dashboard/trainees");

  // LMD scope check
  if (isLmd) {
    const lmdMission = await prisma.localMission.findFirst({
      where: { directorId: user!.id },
    });
    if (!lmdMission || trainee.homeMissionId !== lmdMission.id)
      redirect("/dashboard/trainees");
  }

  // Enrollment + application
  const enrollment = await prisma.programEnrollment.findFirst({
    where: { traineeId, deletedAt: null, application: { status: "ACCEPTED" } },
    include: {
      program: true,
      application: {
        select: {
          referenceNumber: true,
          submittedAt: true,
          directorReviewCompletedAt: true,
          applicantFullName: true,
          applicantDateOfBirth: true,
          applicantGender: true,
          applicantMobileNo: true,
          applicantEmail: true,
          applicantChurchName: true,
          presentAddressDistrict: true,
          presentAddressUpazila: true,
        },
      },
      deploymentAssignedBy: { select: { fullName: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  // Field reports
  const fieldReports = await prisma.fieldReport.findMany({
    where: { traineeId },
    orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }],
    select: {
      id: true,
      reportMonth: true,
      reportYear: true,
      totalActivities: true,
      numberOfBaptisms: true,
      peopleReached: true,
      submittedAt: true,
    },
  });

  const totalBaptisms = fieldReports.reduce(
    (s, r) => s + r.numberOfBaptisms,
    0,
  );
  const totalActivities = fieldReports.reduce(
    (s, r) => s + r.totalActivities,
    0,
  );
  const totalPeopleReached = fieldReports.reduce(
    (s, r) => s + (r.peopleReached ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/dashboard/trainees"
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ← Back to Trainees
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">
          {trainee.fullName}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {trainee.homeMission.name} · {trainee.email}
        </p>
      </div>

      {/* Personal info */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Profile
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          {[
            { label: "Full Name", value: trainee.fullName },
            { label: "Email", value: trainee.email },
            { label: "Mission", value: trainee.homeMission.name },
            {
              label: "Local Director",
              value: trainee.homeMission.director?.fullName ?? "—",
            },
            { label: "Date of Birth", value: formatDate(trainee.dateOfBirth) },
            {
              label: "Reference No.",
              value: enrollment?.application?.referenceNumber ?? "—",
            },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[11px] text-gray-400">{item.label}</p>
              <p className="font-medium text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Enrollment + deployment */}
      {enrollment && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Enrollment & Deployment
            </p>
            {isStaff && (
              <CertificateButton
                enrollmentId={enrollment.id}
                issued={enrollment.certificateIssued}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            {[
              { label: "Program", value: `${enrollment.program.code}` },
              {
                label: "Enrolled On",
                value: formatDate(enrollment.enrolledAt),
              },
              {
                label: "Accepted On",
                value: formatDate(
                  enrollment.application?.directorReviewCompletedAt,
                ),
              },
              {
                label: "Deployment",
                value: enrollment.deploymentLocation ?? "Not assigned",
              },
              {
                label: "Assigned By",
                value: enrollment.deploymentAssignedBy?.fullName ?? "—",
              },
              {
                label: "Assigned On",
                value: formatDate(enrollment.deploymentAssignedAt),
              },
              {
                label: "Attendance",
                value: enrollment.attendanceConfirmed ? "Confirmed" : "Pending",
              },
              {
                label: "Certificate",
                value: enrollment.certificateIssued ? "Issued" : "Not issued",
              },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[11px] text-gray-400">{item.label}</p>
                <p className="font-medium text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Field report summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Field Reports ({fieldReports.length})
          </p>
          {fieldReports.length > 0 && (
            <div className="flex gap-4 text-xs text-gray-500">
              <span>
                Activities:{" "}
                <strong className="text-gray-900">{totalActivities}</strong>
              </span>
              <span>
                Baptisms:{" "}
                <strong className="text-teal-700">{totalBaptisms}</strong>
              </span>
              <span>
                Reached:{" "}
                <strong className="text-gray-900">{totalPeopleReached}</strong>
              </span>
            </div>
          )}
        </div>

        {fieldReports.length === 0 ? (
          <p className="text-xs text-gray-400">
            No field reports submitted yet.
          </p>
        ) : (
          <div className="space-y-2">
            {fieldReports.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/field-reports/${r.id}`}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900">
                  {MONTHS[r.reportMonth - 1]} {r.reportYear}
                </span>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Activities: {r.totalActivities}</span>
                  <span>Baptisms: {r.numberOfBaptisms}</span>
                  {r.peopleReached != null && (
                    <span>Reached: {r.peopleReached}</span>
                  )}
                  <span className="text-gray-300">
                    {formatDate(r.submittedAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
