// apps/portal/app/api/public/programs/route.ts
// Public endpoint — no auth required.
// Returns all upcoming/active published training programs.

import { NextResponse } from "next/server";
import { prisma } from "@1000mm/db";

const WEBSITE_URL =
  process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://1000mm.org.bd";

export async function GET() {
  const programs = await prisma.trainingProgram.findMany({
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
      summary: true,
      startDate: true,
      endDate: true,
      location: true,
      targetIntake: true,
      isMain: true,
      enrollments: {
        where: { deletedAt: null },
        select: { id: true },
      },
      applicationWindows: {
        where: {
          deletedAt: null,
          state: { in: ["OPEN", "ADVERTISING"] },
        },
        take: 1,
        select: { state: true, applicationCloseDate: true },
      },
    },
  });

  return NextResponse.json(programs, {
    headers: {
      "Access-Control-Allow-Origin": WEBSITE_URL,
      "Cache-Control": "no-store",
    },
  });
}
