import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";
import { IdCardsClient } from "./_components/IdCardsClient";

export default async function IdCardsPage() {
  await requireRole(["SYSTEM_ADMIN", "MAIN_DIRECTOR"]);
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
  });
  const isSA = user?.role === "SYSTEM_ADMIN";
  const isUD = user?.role === "MAIN_DIRECTOR";

  // Check permission for UD
  if (isUD) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "idcards.printing_enabled" },
    });
    const enabled = (setting?.value as boolean | null) ?? false;
    if (!enabled) redirect("/dashboard/director");
  }

  // Get setting state for SA
  const printingSetting = isSA
    ? await prisma.systemSetting.findUnique({
        where: { key: "idcards.printing_enabled" },
      })
    : null;
  const printingEnabled = (printingSetting?.value as boolean | null) ?? false;

  // Programs with accepted enrollments
  const programs = await prisma.trainingProgram.findMany({
    where: {
      deletedAt: null,
      enrollments: {
        some: { deletedAt: null, application: { status: "ACCEPTED" } },
      },
    },
    orderBy: { startDate: "desc" },
    select: { id: true, code: true, title: true },
  });

  return (
    <IdCardsClient
      isSA={isSA}
      printingEnabled={printingEnabled}
      programs={programs}
    />
  );
}
