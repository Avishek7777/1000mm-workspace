import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { FieldReportPdf } from "@/lib/exports/FieldReportPdf";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!viewer) return new NextResponse("Unauthorized", { status: 401 });

  const r = await prisma.fieldReport.findFirst({
    where: { id },
    include: {
      trainee: {
        select: {
          id: true,
          fullName: true,
          email: true,
          homeMissionId: true,
          homeMission: { select: { code: true, name: true, directorId: true } },
        },
      },
      program: { select: { code: true, title: true } },
      fieldProject: { select: { name: true, stage: true, progressPercent: true } },
    },
  });
  if (!r) return new NextResponse("Not found", { status: 404 });

  // Author, their LMD, or an oversight role.
  const isAuthor = r.traineeId === viewer.id;
  const isOversight = ["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN", "TRAINER"].includes(viewer.role);
  const isTheirLmd =
    viewer.role === "LOCAL_DIRECTOR" && r.trainee.homeMission?.directorId === viewer.id;
  if (!isAuthor && !isOversight && !isTheirLmd) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const buffer = await renderToBuffer(
    FieldReportPdf({
      traineeName: r.trainee.fullName,
      traineeEmail: r.trainee.email,
      missionName: r.trainee.homeMission
        ? `${r.trainee.homeMission.name} (${r.trainee.homeMission.code})`
        : "—",
      programTitle: `${r.program.code} — ${r.program.title}`,
      period: `${MONTHS[r.reportMonth - 1]} ${r.reportYear}`,
      submittedAt: new Date(r.submittedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      workplace: r.workplaceSnapshot ?? "—",
      lmdName: r.lmdNameSnapshot ?? "—",
      // Snapshot first: what the project was called when this was written.
      projectName: r.projectNameSnapshot ?? r.fieldProject?.name ?? null,
      projectRole: r.projectRoleSnapshot ?? null,
      projectProgress:
        r.fieldProject?.progressPercent != null ? `${r.fieldProject.progressPercent}%` : null,
      metrics: [
        { label: "Total Activities", value: r.totalActivities },
        { label: "Days of Work", value: r.daysOfWork },
        { label: "Hours of Work", value: r.hoursOfWork },
        { label: "Non-SDA Home Visits", value: r.nonSdaHomeVisits },
        { label: "Bible Studies", value: r.bibleStudiesConducted },
        { label: "Medical Visits", value: r.medicalVisits },
        { label: "Worship Sessions", value: r.worshipSessionsTaken },
        { label: "New Groups Made", value: r.newGroupsMade },
        { label: "Baptism Candidates", value: r.baptismCandidatesPrepared },
        { label: "Baptisms", value: r.numberOfBaptisms },
        { label: "People Reached", value: r.peopleReached ?? 0 },
      ],
      narratives: [
        { label: "Activities Summary", value: r.activitiesSummary },
        { label: "Training Received", value: r.trainingReceived },
        { label: "Story or Witness", value: r.storyOrWitness },
        { label: "Challenges Faced", value: r.challengesFaced },
        { label: "Comments or Suggestions", value: r.commentsOrSuggestions },
        { label: "Prayer Requests", value: r.prayerRequests },
      ],
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="field-report-${r.reportYear}-${String(r.reportMonth).padStart(2, "0")}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
