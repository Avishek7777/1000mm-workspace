import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";

const LMD_DOC_KINDS = [
  "RECOMMENDATION_LETTER",
  "SWORN_STATEMENT",
  "EXCOM_VOTE_COPY",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId } = await params;

  // Must be the LMD for this mission
  const lmdUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { directedMission: true },
  });

  if (
    !lmdUser ||
    lmdUser.role !== "LOCAL_DIRECTOR" ||
    !lmdUser.directedMission
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const app = await prisma.application.findFirst({
    where: {
      id: applicationId,
      submittedFromMissionId: lmdUser.directedMission.id,
      deletedAt: null,
    },
    include: {
      submittedFromMission: true,
      window: { include: { program: { select: { title: true } } } },
      documents: {
        where: { deletedAt: null, kind: { in: LMD_DOC_KINDS as any } },
        select: { kind: true, fileName: true },
      },
      recommendation: {
        include: {
          recommender: { select: { fullName: true } },
        },
      },
    },
  });

  if (!app || app.status !== "RECOMMENDED") {
    return NextResponse.json(
      { error: "Not found or not yet recommended." },
      { status: 404 },
    );
  }

  const data = {
    referenceNumber: app.referenceNumber ?? applicationId,
    applicantFullName: app.applicantFullName,
    missionName: app.submittedFromMission.name,
    programTitle: app.window.program.title,
    recommendedAt:
      app.recommendation?.recommendedAt?.toISOString() ??
      new Date().toISOString(),
    lmdFullName: app.recommendation?.recommender?.fullName ?? lmdUser.fullName,
    writtenComment: app.recommendation?.writtenComment ?? null,
    documents: LMD_DOC_KINDS.map((kind) => {
      const doc = app.documents.find((d) => d.kind === kind);
      return {
        kind,
        fileName: doc?.fileName ?? "",
        uploaded: !!doc,
      };
    }),
  };

  return NextResponse.json(data);
}
