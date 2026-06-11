// apps/portal/app/api/public/programs/[id]/route.ts
// Public endpoint — no auth required.
// Returns a single published training program by ID.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@1000mm/db";

const WEBSITE_URL =
  process.env.NEXT_PUBLIC_WEBSITE_URL ?? "http://localhost:3000";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const program = await prisma.trainingProgram.findFirst({
    where: { id, deletedAt: null, isPublished: true },
    select: {
      id: true,
      code: true,
      title: true,
      titleBangla: true,
      category: true,
      summary: true,
      summaryBangla: true,
      startDate: true,
      endDate: true,
      location: true,
      locationBangla: true,
      targetIntake: true,
      maxIntake: true,
      isMain: true,
      // enrollment count
      enrollments: {
        where: { deletedAt: null },
        select: { id: true },
      },
      // application windows that are open or advertising
      applicationWindows: {
        where: {
          deletedAt: null,
          state: { in: ["OPEN", "ADVERTISING"] },
        },
        orderBy: { applicationCloseDate: "asc" },
        take: 1,
        select: {
          id: true,
          state: true,
          advertisingStartDate: true,
          applicationOpenDate: true,
          applicationCloseDate: true,
          trainingStartDate: true,
          targetIntake: true,
        },
      },
    },
  });

  if (!program) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(program, {
    headers: {
      "Access-Control-Allow-Origin": WEBSITE_URL,
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
    },
  });
}
