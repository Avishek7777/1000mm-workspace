import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import { BioDataForm } from "./_components/BioDataForm";

export default async function NewApplicationPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Check if there's already a submitted/active application
  const existingSubmitted = await prisma.application.findFirst({
    where: {
      applicantId: userId,
      deletedAt: null,
      status: {
        notIn: ["DRAFT", "WITHDRAWN"],
      },
    },
  });

  if (existingSubmitted) {
    redirect("/dashboard/my-application");
  }

  // Check for open window
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { homeMission: true },
  });

  const activeWindow = await prisma.applicationWindow.findFirst({
    where: {
      state: "OPEN",
      deletedAt: null,
      applicationCloseDate: { gte: new Date() },
      OR: [
        { scopedToMissionId: null },
        { scopedToMissionId: user?.homeMissionId },
      ],
    },
    include: { program: true },
    orderBy: { applicationOpenDate: "desc" },
  });

  // Resume existing draft if any
  const existingDraft = await prisma.application.findFirst({
    where: {
      applicantId: userId,
      status: "DRAFT",
      deletedAt: null,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <BioDataForm
        applicantName={user?.fullName ?? ""}
        missionCode={user?.homeMission?.code ?? ""}
        missionName={user?.homeMission?.name ?? ""}
        windowOpen={!!activeWindow}
        windowCloseDate={
          activeWindow?.applicationCloseDate?.toISOString() ?? null
        }
        programTitle={activeWindow?.program?.title ?? null}
        existingDraftId={existingDraft?.id ?? null}
      />
    </div>
  );
}
