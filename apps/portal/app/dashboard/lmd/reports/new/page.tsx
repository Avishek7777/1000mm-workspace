import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";
import LmdReportForm from "./_components/LmdReportForm";

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

export default async function NewLmdReportPage({
  searchParams,
}: {
  searchParams: Promise<{ windowId?: string }>;
}) {
  await requireRole(["LOCAL_DIRECTOR"]);
  const session = await auth();
  const { windowId } = await searchParams;

  if (!windowId) redirect("/dashboard/lmd/reports");

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
    include: { homeMission: true },
  });
  if (!user) redirect("/login");

  const window = await prisma.lmdReportWindow.findUnique({
    where: { id: windowId },
  });
  if (!window || window.state !== "OPEN") redirect("/dashboard/lmd/reports");

  // Check not already submitted
  const existing = await prisma.lmdReport.findUnique({
    where: {
      lmdId_reportMonth_reportYear: {
        lmdId: user.id,
        reportMonth: window.reportMonth,
        reportYear: window.reportYear,
      },
    },
  });
  if (existing) redirect(`/dashboard/lmd/reports/${existing.id}`);

  // Get mission
  const mission = await prisma.localMission.findFirst({
    where: { directorId: user.id },
  });
  if (!mission) redirect("/dashboard/lmd/reports");

  // Fetch trainee field reports for this month to show preview
  const traineeReports = await prisma.fieldReport.findMany({
    where: {
      reportMonth: window.reportMonth,
      reportYear: window.reportYear,
      trainee: { homeMissionId: mission.id },
    },
    include: {
      trainee: { select: { fullName: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  // Pre-aggregate
  const agg = traineeReports.reduce(
    (acc, r) => ({
      totalTrainees: acc.totalTrainees + 1,
      totalActivities: acc.totalActivities + r.totalActivities,
      totalDaysOfWork: acc.totalDaysOfWork + r.daysOfWork,
      totalHoursOfWork: acc.totalHoursOfWork + r.hoursOfWork,
      totalNonSdaHomeVisits: acc.totalNonSdaHomeVisits + r.nonSdaHomeVisits,
      totalBibleStudies: acc.totalBibleStudies + r.bibleStudiesConducted,
      totalMedicalVisits: acc.totalMedicalVisits + r.medicalVisits,
      totalWorshipSessions: acc.totalWorshipSessions + r.worshipSessionsTaken,
      totalNewGroups: acc.totalNewGroups + r.newGroupsMade,
      totalBaptismCandidates:
        acc.totalBaptismCandidates + r.baptismCandidatesPrepared,
      totalBaptisms: acc.totalBaptisms + r.numberOfBaptisms,
      totalPeopleReached: acc.totalPeopleReached + (r.peopleReached ?? 0),
    }),
    {
      totalTrainees: 0,
      totalActivities: 0,
      totalDaysOfWork: 0,
      totalHoursOfWork: 0,
      totalNonSdaHomeVisits: 0,
      totalBibleStudies: 0,
      totalMedicalVisits: 0,
      totalWorshipSessions: 0,
      totalNewGroups: 0,
      totalBaptismCandidates: 0,
      totalBaptisms: 0,
      totalPeopleReached: 0,
    },
  );

  return (
    <LmdReportForm
      windowId={windowId}
      periodLabel={`${MONTHS[window.reportMonth - 1]} ${window.reportYear}`}
      lmdName={user.fullName}
      missionName={mission.name}
      aggregated={agg}
      traineeReports={traineeReports.map((r) => ({
        traineeName: r.trainee.fullName,
        activities: r.totalActivities,
        baptisms: r.numberOfBaptisms,
        peopleReached: r.peopleReached ?? 0,
      }))}
    />
  );
}
