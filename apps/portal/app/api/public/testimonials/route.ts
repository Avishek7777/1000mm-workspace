import { NextResponse } from "next/server";
import { prisma } from "@1000mm/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const testimonies = await prisma.testimony.findMany({
    where: { isPublished: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      location: true,
      quote: true,
      color: true,
    },
  });

  return NextResponse.json(testimonies, {
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
