import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const isSA = user.role === "SYSTEM_ADMIN";
  const isUD =
    user.role === "MAIN_DIRECTOR" ||
    user.role === "SECRETARY" ||
    user.role === "ASSOCIATE_DIRECTOR";

  if (!isSA && !isUD) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const programId = searchParams.get("programId");

  if (!programId) {
    return NextResponse.json(
      { error: "programId is required" },
      { status: 400 },
    );
  }

  const enrollments = await prisma.programEnrollment.findMany({
    where: {
      deletedAt: null,
      programId,
      // See api/id-cards/route.ts — roster membership, not application link.
      status: "ENROLLED",
    },
    include: {
      trainee: {
        select: {
          fullName: true,
          homeMission: { select: { code: true } },
        },
      },
      application: {
        // Same identity rule as the printed card, so what an admin ticks here
        // is what comes out of the printer.
        select: { referenceNumber: true, applicantFullName: true },
      },
    },
    orderBy: [
      { trainee: { homeMission: { code: "asc" } } },
      { trainee: { fullName: "asc" } },
    ],
  });

  const result = enrollments.map((e) => ({
    enrollmentId: e.id,
    fullName: e.application?.applicantFullName ?? e.trainee.fullName,
    referenceNumber:
      e.application?.referenceNumber ?? e.id.slice(-8).toUpperCase(),
    missionCode: e.trainee.homeMission?.code ?? "—",
    deploymentLocation: e.deploymentLocation ?? null,
  }));

  return NextResponse.json(result);
}
