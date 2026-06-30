import { NextResponse } from "next/server";
import { prisma } from "@1000mm/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const projects = await prisma.project.findMany({
    where: { isPublished: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      description: true,
      location: true,
      date: true,
      images: true,
      tags: true,
      status: true,
      goal: true,
      participants: true,
      highlight: true,
      body: true,
      budget: true,
      objectives: true,
    },
  });

  return NextResponse.json(projects, {
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
