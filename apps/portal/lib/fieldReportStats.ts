/**
 * lib/fieldReportStats.ts
 * All aggregation queries for field report statistics.
 * Pass missionId to scope to one mission (LMD), or leave undefined for all.
 */

import { prisma } from "@1000mm/db";

export type PeriodMode = "monthly" | "quarterly" | "yearly";

// ─── Raw aggregated row ───────────────────────────────────────────────────────

export type StatRow = {
  periodLabel: string; // "Jan 2026", "Q1 2026", "2026"
  periodSort: number; // for ordering (YYYYMM, YYYYQQ, YYYY)
  reportCount: number;
  activeTrainees: number;
  totalActivities: number;
  totalDaysOfWork: number;
  totalHoursOfWork: number;
  nonSdaHomeVisits: number;
  bibleStudies: number;
  medicalVisits: number;
  worshipSessions: number;
  newGroups: number;
  baptismCandidates: number;
  baptisms: number;
  peopleReached: number;
};

export type MissionStat = {
  missionCode: string;
  baptisms: number;
  peopleReached: number;
  reportCount: number;
};

export type TopTrainee = {
  fullName: string;
  missionCode: string;
  baptisms: number;
  peopleReached: number;
  reportCount: number;
};

// ─── Summary totals ───────────────────────────────────────────────────────────

export type SummaryTotals = {
  totalReports: number;
  activeTrainees: number;
  totalBaptisms: number;
  totalPeopleReached: number;
  totalActivities: number;
  totalBibleStudies: number;
  totalWorshipSessions: number;
  totalMedicalVisits: number;
  totalNewGroups: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function quarterLabel(month: number): string {
  if (month <= 3) return "Q1";
  if (month <= 6) return "Q2";
  if (month <= 9) return "Q3";
  return "Q4";
}

// ─── Main query ───────────────────────────────────────────────────────────────

async function fetchReports(missionId?: string) {
  return prisma.fieldReport.findMany({
    where: missionId ? { trainee: { homeMissionId: missionId } } : {},
    include: {
      trainee: {
        select: {
          fullName: true,
          homeMission: { select: { code: true } },
        },
      },
    },
    orderBy: [{ reportYear: "asc" }, { reportMonth: "asc" }],
  });
}

// ─── Aggregate by period ──────────────────────────────────────────────────────

export async function getFieldReportStats(
  mode: PeriodMode,
  missionId?: string,
): Promise<StatRow[]> {
  const reports = await fetchReports(missionId);

  type Bucket = Omit<StatRow, "periodLabel" | "periodSort"> & {
    trainees: Set<string>;
    key: string;
  };

  const buckets = new Map<string, Bucket>();

  for (const r of reports) {
    let key: string;
    if (mode === "monthly") {
      key = `${r.reportYear}-${String(r.reportMonth).padStart(2, "0")}`;
    } else if (mode === "quarterly") {
      const q = Math.ceil(r.reportMonth / 3);
      key = `${r.reportYear}-Q${q}`;
    } else {
      key = `${r.reportYear}`;
    }

    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        trainees: new Set(),
        reportCount: 0,
        activeTrainees: 0,
        totalActivities: 0,
        totalDaysOfWork: 0,
        totalHoursOfWork: 0,
        nonSdaHomeVisits: 0,
        bibleStudies: 0,
        medicalVisits: 0,
        worshipSessions: 0,
        newGroups: 0,
        baptismCandidates: 0,
        baptisms: 0,
        peopleReached: 0,
      });
    }

    const b = buckets.get(key)!;
    b.trainees.add(r.traineeId);
    b.reportCount++;
    b.totalActivities += r.totalActivities;
    b.totalDaysOfWork += r.daysOfWork;
    b.totalHoursOfWork += r.hoursOfWork;
    b.nonSdaHomeVisits += r.nonSdaHomeVisits;
    b.bibleStudies += r.bibleStudiesConducted;
    b.medicalVisits += r.medicalVisits;
    b.worshipSessions += r.worshipSessionsTaken;
    b.newGroups += r.newGroupsMade;
    b.baptismCandidates += r.baptismCandidatesPrepared;
    b.baptisms += r.numberOfBaptisms;
    b.peopleReached += r.peopleReached ?? 0;
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, b]) => {
      let periodLabel: string;
      let periodSort: number;

      if (mode === "monthly") {
        const [y, m] = key.split("-").map(Number);
        periodLabel = `${MONTH_NAMES[m - 1]} ${y}`;
        periodSort = y * 100 + m;
      } else if (mode === "quarterly") {
        const [y, q] = key.split("-");
        periodLabel = `${q} ${y}`;
        periodSort = parseInt(y) * 10 + parseInt(q.replace("Q", ""));
      } else {
        periodLabel = key;
        periodSort = parseInt(key);
      }

      return {
        periodLabel,
        periodSort,
        reportCount: b.reportCount,
        activeTrainees: b.trainees.size,
        totalActivities: b.totalActivities,
        totalDaysOfWork: b.totalDaysOfWork,
        totalHoursOfWork: b.totalHoursOfWork,
        nonSdaHomeVisits: b.nonSdaHomeVisits,
        bibleStudies: b.bibleStudies,
        medicalVisits: b.medicalVisits,
        worshipSessions: b.worshipSessions,
        newGroups: b.newGroups,
        baptismCandidates: b.baptismCandidates,
        baptisms: b.baptisms,
        peopleReached: b.peopleReached,
      };
    });
}

// ─── Mission breakdown (UD/SA only) ──────────────────────────────────────────

export async function getMissionStats(): Promise<MissionStat[]> {
  const reports = await prisma.fieldReport.findMany({
    include: {
      trainee: { select: { homeMission: { select: { code: true } } } },
    },
  });

  const map = new Map<string, MissionStat>();
  for (const r of reports) {
    const code = r.trainee.homeMission?.code ?? "UNK";
    if (!map.has(code))
      map.set(code, {
        missionCode: code,
        baptisms: 0,
        peopleReached: 0,
        reportCount: 0,
      });
    const m = map.get(code)!;
    m.baptisms += r.numberOfBaptisms;
    m.peopleReached += r.peopleReached ?? 0;
    m.reportCount++;
  }
  return Array.from(map.values()).sort((a, b) =>
    a.missionCode.localeCompare(b.missionCode),
  );
}

// ─── Top trainees ─────────────────────────────────────────────────────────────

export async function getTopTrainees(
  missionId?: string,
  limit = 10,
): Promise<TopTrainee[]> {
  const reports = await prisma.fieldReport.findMany({
    where: missionId ? { trainee: { homeMissionId: missionId } } : {},
    include: {
      trainee: {
        select: {
          fullName: true,
          homeMission: { select: { code: true } },
        },
      },
    },
  });

  const map = new Map<string, TopTrainee & { traineeId: string }>();
  for (const r of reports) {
    if (!map.has(r.traineeId)) {
      map.set(r.traineeId, {
        traineeId: r.traineeId,
        fullName: r.trainee.fullName,
        missionCode: r.trainee.homeMission?.code ?? "—",
        baptisms: 0,
        peopleReached: 0,
        reportCount: 0,
      });
    }
    const t = map.get(r.traineeId)!;
    t.baptisms += r.numberOfBaptisms;
    t.peopleReached += r.peopleReached ?? 0;
    t.reportCount++;
  }

  return Array.from(map.values())
    .sort(
      (a, b) => b.baptisms - a.baptisms || b.peopleReached - a.peopleReached,
    )
    .slice(0, limit)
    .map(({ traineeId: _, ...rest }) => rest);
}

// ─── Summary totals ───────────────────────────────────────────────────────────

export async function getSummaryTotals(
  missionId?: string,
): Promise<SummaryTotals> {
  const reports = await fetchReports(missionId);
  const traineeSet = new Set(reports.map((r) => r.traineeId));

  return {
    totalReports: reports.length,
    activeTrainees: traineeSet.size,
    totalBaptisms: reports.reduce((s, r) => s + r.numberOfBaptisms, 0),
    totalPeopleReached: reports.reduce((s, r) => s + (r.peopleReached ?? 0), 0),
    totalActivities: reports.reduce((s, r) => s + r.totalActivities, 0),
    totalBibleStudies: reports.reduce((s, r) => s + r.bibleStudiesConducted, 0),
    totalWorshipSessions: reports.reduce(
      (s, r) => s + r.worshipSessionsTaken,
      0,
    ),
    totalMedicalVisits: reports.reduce((s, r) => s + r.medicalVisits, 0),
    totalNewGroups: reports.reduce((s, r) => s + r.newGroupsMade, 0),
  };
}
