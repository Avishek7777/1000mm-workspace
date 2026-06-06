import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const REPORT_PROMPTS: Record<string, (data: unknown) => string> = {
  pipeline: (data: any) => `
You are an executive assistant to the Union Director of Bangladesh Adventist Union Mission (BAUM).
Analyze the following missionary training application pipeline data and write a concise executive summary (3-4 paragraphs).
Focus on: overall health of the pipeline, which missions are performing well vs struggling, LMD bottlenecks, and specific actionable recommendations the Director can take this week.
Be direct and specific — use the actual numbers. Write in professional English.

Data:
- Total applications: ${data.totals.submitted}
- Recommended: ${data.totals.recommended}
- Accepted: ${data.totals.accepted} (${data.totals.conversionRate}% conversion rate)
- Rejected: ${data.totals.rejected}
- Pipeline funnel: ${JSON.stringify(data.funnelStages)}
- By mission: ${JSON.stringify(data.byMission)}
- Average days per stage: ${JSON.stringify(data.avgDaysPerStage)}
- LMD bottlenecks (currently in review): ${JSON.stringify(data.lmdBottlenecks)}
`,

  demographics: (data: any) => `
You are an executive assistant to the Union Director of Bangladesh Adventist Union Mission (BAUM).
Analyze the following applicant demographics data and write a concise executive summary (3-4 paragraphs).
Focus on: who the program is reaching, any gaps in representation (gender, age, denomination, geography), and recommendations for outreach strategy.
Use the actual numbers. Write in professional English.

Data:
- Total applicants analyzed: ${data.total}
- Gender: ${JSON.stringify(data.genderBreakdown)}
- Age groups: ${JSON.stringify(data.ageGroups)}
- Marital status: ${JSON.stringify(data.maritalStatus)}
- Denomination: ${JSON.stringify(data.denomination)}
- Mission representation: ${JSON.stringify(data.missionRepresentation)}
- Top districts: ${JSON.stringify(data.topDistricts)}
`,

  decisions: (data: any) => `
You are an executive assistant to the Union Director of Bangladesh Adventist Union Mission (BAUM).
Analyze the following application decision quality data and write a concise executive summary (3-4 paragraphs).
Focus on: overall acceptance rate, which missions/LMDs have the best and worst quality recommendations, patterns in rejection reasons, and what this means for the programme's standards.
Use the actual numbers. Write in professional English.

Data:
- Overall: ${JSON.stringify(data.overallRates)}
- By mission: ${JSON.stringify(data.byMission)}
- By LMD recommender: ${JSON.stringify(data.byLmd)}
- Top rejection reasons: ${JSON.stringify(data.rejectionReasons)}
`,

  growth: (data: any) => `
You are an executive assistant to the Union Director of Bangladesh Adventist Union Mission (BAUM).
Analyze the following year-on-year growth data and write a concise executive summary (3-4 paragraphs).
Focus on: overall growth trend, which missions are growing fastest, conversion rate trends, and what this means for the programme's future capacity needs.
Use the actual numbers. Write in professional English.

Data:
- Year-by-year summary: ${JSON.stringify(data.byYear)}
- By mission by year: ${JSON.stringify(data.byMissionByYear)}
`,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured in .env.local." },
      { status: 500 },
    );
  }

  const body = await req.json();
  const { reportType, data } = body;

  const promptFn = REPORT_PROMPTS[reportType];
  if (!promptFn) {
    return NextResponse.json(
      { error: "Unknown report type." },
      { status: 400 },
    );
  }

  const prompt = promptFn(data);

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 800,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Gemini error:", err);
    return NextResponse.json(
      { error: "AI insights generation failed. Check your API key." },
      { status: 500 },
    );
  }

  const result = await response.json();
  const text =
    result?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "No insights generated.";

  return NextResponse.json({ insights: text });
}
