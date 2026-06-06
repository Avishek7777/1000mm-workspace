import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  getPipelineData,
  getDemographicsData,
  getDecisionsData,
  getGrowthData,
  getProgramsForFilter,
} from "@/lib/reports/queries";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const programId = searchParams.get("programId") || undefined;
  const year = searchParams.get("year")
    ? parseInt(searchParams.get("year")!)
    : undefined;

  const filters = { programId, year };

  try {
    switch (type) {
      case "pipeline":
        return NextResponse.json(await getPipelineData(filters));
      case "demographics":
        return NextResponse.json(await getDemographicsData(filters));
      case "decisions":
        return NextResponse.json(await getDecisionsData(filters));
      case "growth":
        return NextResponse.json(await getGrowthData());
      case "programs":
        return NextResponse.json(await getProgramsForFilter());
      default:
        return NextResponse.json(
          { error: "Unknown report type." },
          { status: 400 },
        );
    }
  } catch (err) {
    console.error("Report data error:", err);
    return NextResponse.json(
      { error: "Failed to generate report data." },
      { status: 500 },
    );
  }
}
