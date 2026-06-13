/**
 * lib/reports/queries.ts
 * All DB query functions for Director reports.
 * Each returns plain serializable data — no Prisma objects.
 */

import { prisma } from "@1000mm/db";

// ─── Shared filter type ───────────────────────────────────────────────────────

export type ReportFilters = {
  programId?: string; // filter to specific TrainingProgram
  year?: number; // filter by submission year
};

function buildApplicationWhere(filters: ReportFilters) {
  const where: Record<string, unknown> = {
    deletedAt: null,
    status: { not: "DRAFT" },
  };
  if (filters.programId) {
    where.window = { programId: filters.programId };
  }
  if (filters.year) {
    where.submittedAt = {
      gte: new Date(`${filters.year}-01-01`),
      lt: new Date(`${filters.year + 1}-01-01`),
    };
  }
  return where;
}

// ─── Report 1: Application Pipeline ──────────────────────────────────────────

export type PipelineData = {
  funnelStages: { stage: string; count: number }[];
  byMission: {
    mission: string;
    submitted: number;
    underReview: number;
    recommended: number;
    accepted: number;
    rejected: number;
    returnedToApplicant: number;
  }[];
  avgDaysPerStage: {
    stage: string;
    avgDays: number | null;
  }[];
  lmdBottlenecks: {
    lmdName: string;
    mission: string;
    pendingCount: number;
    avgDaysInReview: number | null;
  }[];
  totals: {
    submitted: number;
    recommended: number;
    accepted: number;
    rejected: number;
    conversionRate: number;
  };
};

export async function getPipelineData(
  filters: ReportFilters,
): Promise<PipelineData> {
  const where = buildApplicationWhere(filters) as any;

  const apps = await prisma.application.findMany({
    where,
    select: {
      status: true,
      submittedAt: true,
      lmdReviewStartedAt: true,
      lmdReviewCompletedAt: true,
      directorReviewStartedAt: true,
      directorReviewCompletedAt: true,
      lastTransitionAt: true,
      submittedFromMission: { select: { code: true } },
      lmdReviewer: { select: { fullName: true } },
    },
  });

  const missions = ["EBM", "NBM", "SBM", "WBM"];

  // Funnel stages
  const statusGroups: Record<string, number> = {};
  for (const app of apps) {
    statusGroups[app.status] = (statusGroups[app.status] ?? 0) + 1;
  }

  const funnelStages = [
    { stage: "Submitted", count: apps.length },
    {
      stage: "LMD Review",
      count: apps.filter((a) =>
        [
          "UNDER_LMD_REVIEW",
          "RECOMMENDED",
          "UNDER_MAIN_DIRECTOR_REVIEW",
          "ACCEPTED",
          "REJECTED",
        ].includes(a.status),
      ).length,
    },
    {
      stage: "Recommended",
      count: apps.filter((a) =>
        [
          "RECOMMENDED",
          "UNDER_MAIN_DIRECTOR_REVIEW",
          "ACCEPTED",
          "REJECTED",
        ].includes(a.status),
      ).length,
    },
    {
      stage: "Director Review",
      count: apps.filter((a) =>
        ["UNDER_MAIN_DIRECTOR_REVIEW", "ACCEPTED", "REJECTED"].includes(
          a.status,
        ),
      ).length,
    },
    {
      stage: "Accepted",
      count: apps.filter((a) => a.status === "ACCEPTED").length,
    },
  ];

  // By mission
  const byMission = missions.map((code) => ({
    mission: code,
    submitted: apps.filter((a) => a.submittedFromMission.code === code).length,
    underReview: apps.filter(
      (a) =>
        a.submittedFromMission.code === code &&
        ["UNDER_LMD_REVIEW"].includes(a.status),
    ).length,
    recommended: apps.filter(
      (a) =>
        a.submittedFromMission.code === code &&
        [
          "RECOMMENDED",
          "UNDER_MAIN_DIRECTOR_REVIEW",
          "ACCEPTED",
          "REJECTED",
        ].includes(a.status),
    ).length,
    accepted: apps.filter(
      (a) => a.submittedFromMission.code === code && a.status === "ACCEPTED",
    ).length,
    rejected: apps.filter(
      (a) => a.submittedFromMission.code === code && a.status === "REJECTED",
    ).length,
    returnedToApplicant: apps.filter(
      (a) =>
        a.submittedFromMission.code === code &&
        a.status === "RETURNED_TO_APPLICANT",
    ).length,
  }));

  // Avg days per stage
  function avgDays(durations: number[]): number | null {
    if (durations.length === 0) return null;
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  }

  const lmdDurations = apps
    .filter((a) => a.lmdReviewStartedAt && a.lmdReviewCompletedAt)
    .map(
      (a) =>
        (a.lmdReviewCompletedAt!.getTime() - a.lmdReviewStartedAt!.getTime()) /
        86400000,
    );

  const directorDurations = apps
    .filter((a) => a.directorReviewStartedAt && a.directorReviewCompletedAt)
    .map(
      (a) =>
        (a.directorReviewCompletedAt!.getTime() -
          a.directorReviewStartedAt!.getTime()) /
        86400000,
    );

  const submissionToLmd = apps
    .filter((a) => a.submittedAt && a.lmdReviewStartedAt)
    .map(
      (a) =>
        (a.lmdReviewStartedAt!.getTime() - a.submittedAt!.getTime()) / 86400000,
    );

  const avgDaysPerStage = [
    { stage: "Submission → LMD picks up", avgDays: avgDays(submissionToLmd) },
    { stage: "LMD review duration", avgDays: avgDays(lmdDurations) },
    { stage: "Director review duration", avgDays: avgDays(directorDurations) },
  ];

  // LMD bottlenecks — currently in review
  const lmdBottleneckMap = new Map<
    string,
    { name: string; mission: string; count: number; totalDays: number }
  >();
  for (const app of apps.filter(
    (a) =>
      a.status === "UNDER_LMD_REVIEW" && a.lmdReviewer && a.lmdReviewStartedAt,
  )) {
    const key = app.lmdReviewer!.fullName;
    const days = (Date.now() - app.lmdReviewStartedAt!.getTime()) / 86400000;
    const existing = lmdBottleneckMap.get(key);
    if (existing) {
      existing.count++;
      existing.totalDays += days;
    } else {
      lmdBottleneckMap.set(key, {
        name: key,
        mission: app.submittedFromMission.code,
        count: 1,
        totalDays: days,
      });
    }
  }

  const lmdBottlenecks = [...lmdBottleneckMap.values()]
    .map((e) => ({
      lmdName: e.name,
      mission: e.mission,
      pendingCount: e.count,
      avgDaysInReview: e.count > 0 ? Math.round(e.totalDays / e.count) : null,
    }))
    .sort((a, b) => b.pendingCount - a.pendingCount);

  const accepted = apps.filter((a) => a.status === "ACCEPTED").length;
  const submitted = apps.length;

  return {
    funnelStages,
    byMission,
    avgDaysPerStage,
    lmdBottlenecks,
    totals: {
      submitted,
      recommended: apps.filter((a) =>
        [
          "RECOMMENDED",
          "UNDER_MAIN_DIRECTOR_REVIEW",
          "ACCEPTED",
          "REJECTED",
        ].includes(a.status),
      ).length,
      accepted,
      rejected: apps.filter((a) => a.status === "REJECTED").length,
      conversionRate:
        submitted > 0 ? Math.round((accepted / submitted) * 100) : 0,
    },
  };
}

// ─── Report 2: Applicant Demographics ────────────────────────────────────────

export type DemographicsData = {
  genderBreakdown: { label: string; count: number; pct: number }[];
  ageGroups: { label: string; count: number; pct: number }[];
  maritalStatus: { label: string; count: number; pct: number }[];
  denomination: { label: string; count: number; pct: number }[];
  bloodType: { label: string; count: number; pct: number }[];
  missionRepresentation: { mission: string; count: number; pct: number }[];
  topDistricts: { district: string; count: number }[];
  total: number;
};

export async function getDemographicsData(
  filters: ReportFilters,
): Promise<DemographicsData> {
  const where = buildApplicationWhere(filters) as any;

  const apps = await prisma.application.findMany({
    where,
    select: {
      applicantGender: true,
      applicantAge: true,
      applicantMaritalStatus: true,
      applicantDenomination: true,
      applicantBloodType: true,
      presentAddressDistrict: true,
      submittedFromMission: { select: { code: true } },
    },
  });

  const total = apps.length;
  if (total === 0) {
    return {
      genderBreakdown: [],
      ageGroups: [],
      maritalStatus: [],
      denomination: [],
      bloodType: [],
      missionRepresentation: [],
      topDistricts: [],
      total: 0,
    };
  }

  function toPct(count: number) {
    return Math.round((count / total) * 100);
  }
  function groupBy<T>(arr: T[], fn: (item: T) => string) {
    return arr.reduce(
      (acc, item) => {
        const key = fn(item);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
  function toBreakdown(groups: Record<string, number>) {
    return Object.entries(groups)
      .map(([label, count]) => ({
        label: label || "Unknown",
        count,
        pct: toPct(count),
      }))
      .sort((a, b) => b.count - a.count);
  }

  // Age groups
  const ageGroupMap: Record<string, number> = {
    "16–20": 0,
    "21–25": 0,
    "26–30": 0,
    "31–35": 0,
    "36–45": 0,
    "46+": 0,
  };
  for (const app of apps) {
    const age = app.applicantAge;
    if (age <= 20) ageGroupMap["16–20"]++;
    else if (age <= 25) ageGroupMap["21–25"]++;
    else if (age <= 30) ageGroupMap["26–30"]++;
    else if (age <= 35) ageGroupMap["31–35"]++;
    else if (age <= 45) ageGroupMap["36–45"]++;
    else ageGroupMap["46+"]++;
  }

  const ageGroups = Object.entries(ageGroupMap).map(([label, count]) => ({
    label,
    count,
    pct: toPct(count),
  }));

  // District top 10
  const districtGroups = groupBy(
    apps,
    (a) => a.presentAddressDistrict ?? "Unknown",
  );
  const topDistricts = Object.entries(districtGroups)
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Mission representation
  const missionGroups = groupBy(apps, (a) => a.submittedFromMission.code);
  const missionRepresentation = Object.entries(missionGroups)
    .map(([mission, count]) => ({ mission, count, pct: toPct(count) }))
    .sort((a, b) => b.count - a.count);

  return {
    genderBreakdown: toBreakdown(
      groupBy(apps, (a) => a.applicantGender ?? "Unknown"),
    ),
    ageGroups,
    maritalStatus: toBreakdown(
      groupBy(apps, (a) => a.applicantMaritalStatus ?? "Unknown"),
    ),
    denomination: toBreakdown(
      groupBy(apps, (a) => a.applicantDenomination ?? "Unknown"),
    ),
    bloodType: toBreakdown(
      groupBy(apps, (a) => a.applicantBloodType ?? "Unknown"),
    ),
    missionRepresentation,
    topDistricts,
    total,
  };
}

// ─── Report 3: Decision Quality ───────────────────────────────────────────────

export type DecisionsData = {
  overallRates: {
    accepted: number;
    acceptedPct: number;
    rejected: number;
    rejectedPct: number;
    returnedToApplicant: number;
    returnedToApplicantPct: number;
    returnedToLmd: number;
    returnedToLmdPct: number;
    total: number;
  };
  byMission: {
    mission: string;
    total: number;
    accepted: number;
    acceptedPct: number;
    rejected: number;
    rejectedPct: number;
    returnedToApplicant: number;
    returnedToLmd: number;
  }[];
  byLmd: {
    lmdName: string;
    mission: string;
    recommended: number;
    accepted: number;
    acceptedPct: number;
    rejected: number;
    returnedToLmd: number;
  }[];
  rejectionReasons: { reason: string; count: number }[];
};

export async function getDecisionsData(
  filters: ReportFilters,
): Promise<DecisionsData> {
  const where = buildApplicationWhere(filters) as any;

  const apps = await prisma.application.findMany({
    where,
    select: {
      status: true,
      rejectionReason: true,
      submittedFromMission: { select: { code: true } },
      lmdReviewer: { select: { fullName: true } },
    },
  });

  const total = apps.length;
  const missions = ["EBM", "NBM", "SBM", "WBM"];

  function pct(n: number, d: number) {
    return d > 0 ? Math.round((n / d) * 100) : 0;
  }

  const accepted = apps.filter((a) => a.status === "ACCEPTED").length;
  const rejected = apps.filter((a) => a.status === "REJECTED").length;
  const returnedToApplicant = apps.filter(
    (a) => a.status === "RETURNED_TO_APPLICANT",
  ).length;
  const returnedToLmd = apps.filter(
    (a) => a.status === "RETURNED_TO_LMD",
  ).length;

  const byMission = missions.map((code) => {
    const m = apps.filter((a) => a.submittedFromMission.code === code);
    const mt = m.length;
    return {
      mission: code,
      total: mt,
      accepted: m.filter((a) => a.status === "ACCEPTED").length,
      acceptedPct: pct(m.filter((a) => a.status === "ACCEPTED").length, mt),
      rejected: m.filter((a) => a.status === "REJECTED").length,
      rejectedPct: pct(m.filter((a) => a.status === "REJECTED").length, mt),
      returnedToApplicant: m.filter((a) => a.status === "RETURNED_TO_APPLICANT")
        .length,
      returnedToLmd: m.filter((a) => a.status === "RETURNED_TO_LMD").length,
    };
  });

  // By LMD
  const lmdMap = new Map<
    string,
    {
      name: string;
      mission: string;
      recommended: number;
      accepted: number;
      rejected: number;
      returnedToLmd: number;
    }
  >();
  for (const app of apps) {
    if (!app.lmdReviewer) continue;
    const key = app.lmdReviewer.fullName;
    const existing = lmdMap.get(key) ?? {
      name: key,
      mission: app.submittedFromMission.code,
      recommended: 0,
      accepted: 0,
      rejected: 0,
      returnedToLmd: 0,
    };
    if (
      [
        "RECOMMENDED",
        "UNDER_MAIN_DIRECTOR_REVIEW",
        "ACCEPTED",
        "REJECTED",
        "RETURNED_TO_LMD",
      ].includes(app.status)
    )
      existing.recommended++;
    if (app.status === "ACCEPTED") existing.accepted++;
    if (app.status === "REJECTED") existing.rejected++;
    if (app.status === "RETURNED_TO_LMD") existing.returnedToLmd++;
    lmdMap.set(key, existing);
  }

  const byLmd = [...lmdMap.values()]
    .map((e) => ({
      lmdName: e.name,
      mission: e.mission,
      recommended: e.recommended,
      accepted: e.accepted,
      acceptedPct: pct(e.accepted, e.recommended),
      rejected: e.rejected,
      returnedToLmd: e.returnedToLmd,
    }))
    .sort((a, b) => b.recommended - a.recommended);

  // Rejection reasons — simple word frequency grouping
  const reasonCounts = new Map<string, number>();
  for (const app of apps.filter((a) => a.rejectionReason)) {
    const reason = app.rejectionReason!.trim();
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
  }
  const rejectionReasons = [...reasonCounts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    overallRates: {
      accepted,
      acceptedPct: pct(accepted, total),
      rejected,
      rejectedPct: pct(rejected, total),
      returnedToApplicant,
      returnedToApplicantPct: pct(returnedToApplicant, total),
      returnedToLmd,
      returnedToLmdPct: pct(returnedToLmd, total),
      total,
    },
    byMission,
    byLmd,
    rejectionReasons,
  };
}

// ─── Report 6: Year-on-Year Growth ───────────────────────────────────────────

export type GrowthData = {
  years: number[];
  byYear: {
    year: number;
    applicants: number;
    accepted: number;
    programs: number;
    conversionRate: number;
  }[];
  byMissionByYear: {
    mission: string;
    data: { year: number; count: number }[];
  }[];
  counters: {
    missionCode: string;
    year: number;
    lastSerial: number;
  }[];
};

export async function getGrowthData(): Promise<GrowthData> {
  // Use ApplicationCounter for fast per-mission per-year totals
  const counters = await prisma.applicationCounter.findMany({
    orderBy: [{ year: "asc" }, { missionCode: "asc" }],
  });

  const years = [...new Set(counters.map((c) => c.year))].sort();

  // Get accepted + program counts per year
  const yearStats = await Promise.all(
    years.map(async (year) => {
      const [accepted, programs] = await Promise.all([
        prisma.application.count({
          where: {
            deletedAt: null,
            status: "ACCEPTED",
            submittedAt: {
              gte: new Date(`${year}-01-01`),
              lt: new Date(`${year + 1}-01-01`),
            },
          },
        }),
        prisma.trainingProgram.count({
          where: {
            deletedAt: null,
            startDate: {
              gte: new Date(`${year}-01-01`),
              lt: new Date(`${year + 1}-01-01`),
            },
          },
        }),
      ]);

      const applicants = counters
        .filter((c) => c.year === year)
        .reduce((sum, c) => sum + c.lastSerial, 0);

      return {
        year,
        applicants,
        accepted,
        programs,
        conversionRate:
          applicants > 0 ? Math.round((accepted / applicants) * 100) : 0,
      };
    }),
  );

  // Per-mission per-year
  const missions = ["EBM", "NBM", "SBM", "WBM"];
  const byMissionByYear = missions.map((mission) => ({
    mission,
    data: years.map((year) => ({
      year,
      count:
        counters.find((c) => c.missionCode === mission && c.year === year)
          ?.lastSerial ?? 0,
    })),
  }));

  return {
    years,
    byYear: yearStats,
    byMissionByYear,
    counters: counters.map((c) => ({
      missionCode: c.missionCode,
      year: c.year,
      lastSerial: c.lastSerial,
    })),
  };
}

// ─── Programs list (for filter dropdown) ─────────────────────────────────────

export async function getProgramsForFilter() {
  return prisma.trainingProgram.findMany({
    where: { deletedAt: null },
    orderBy: { startDate: "desc" },
    select: { id: true, title: true, code: true, startDate: true },
  });
}
