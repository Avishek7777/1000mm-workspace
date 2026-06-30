import { NextResponse } from "next/server";
import { prisma } from "@1000mm/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug, isPublished: true },
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

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(project, {
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
