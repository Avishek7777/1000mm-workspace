import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import NewFieldReportForm from "./NewFieldReportForm";

export default async function NewFieldReportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      homeMission: {
        include: { director: { select: { fullName: true } } },
      },
    },
  });
  if (!user || user.role !== "TRAINEE") redirect("/dashboard");

  // Must have an ACCEPTED enrollment
  const enrollment = await prisma.programEnrollment.findFirst({
    where: {
      traineeId: user.id,
      deletedAt: null,
      application: { status: "ACCEPTED" },
    },
    include: {
      program: { select: { title: true, code: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  if (!enrollment) redirect("/dashboard/field-reports");

  return (
    <NewFieldReportForm
      traineeInfo={{
        fullName: user.fullName,
        email: user.email,
        missionName: user.homeMission?.name ?? "—",
        lmdName: user.homeMission?.director?.fullName ?? null,
        workplace: enrollment.deploymentLocation ?? null,
        programTitle: `${enrollment.program.code} — ${enrollment.program.title}`,
      }}
    />
  );
}
