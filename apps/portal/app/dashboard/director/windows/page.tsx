import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { WindowActions } from "./_components/WindowActions";
import { NewWindowButton } from "./_components/NewWindowButton";
import { redirect } from "next/navigation";
import { isSettingEnabled, SETTINGS } from "@/lib/settings";

const STATE_CONFIG = {
  OPEN: {
    label: "Open",
    border: "border-l-[3px] border-l-teal-500",
    badge: "bg-teal-50 text-teal-800 border-teal-200",
    fill: "bg-teal-500",
    dot: "bg-teal-500 animate-pulse",
    countColor: "text-teal-700",
  },
  DRAFT: {
    label: "Draft",
    border: "border-l-[3px] border-l-gray-400",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    fill: "bg-gray-400",
    dot: "bg-gray-400",
    countColor: "text-gray-500",
  },
  ADVERTISING: {
    label: "Advertising",
    border: "border-l-[3px] border-l-blue-400",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    fill: "bg-blue-400",
    dot: "bg-blue-400",
    countColor: "text-blue-700",
  },
  CLOSED: {
    label: "Closed",
    border: "border-l-[3px] border-l-amber-500",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    fill: "bg-amber-500",
    dot: "bg-amber-500",
    countColor: "text-amber-700",
  },
  ARCHIVED: {
    label: "Archived",
    border: "border-l-[3px] border-l-gray-300",
    badge: "bg-gray-50 text-gray-400 border-gray-200",
    fill: "bg-gray-300",
    dot: "bg-gray-300",
    countColor: "text-gray-400",
  },
} as const;

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatShort(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function daysUntil(d: Date) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function timelinePercent(open: Date, close: Date): number {
  const now = Date.now();
  const start = new Date(open).getTime();
  const end = new Date(close).getTime();
  if (now < start) return 0;
  if (now > end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function todayPercent(open: Date, close: Date): number {
  const now = Date.now();
  const start = new Date(open).getTime();
  const end = new Date(close).getTime();
  return Math.max(
    0,
    Math.min(100, Math.round(((now - start) / (end - start)) * 100)),
  );
}

export default async function WindowsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; year?: string }>;
}) {
  const user = await requireRole(["MAIN_DIRECTOR", "SYSTEM_ADMIN"]);
  if (user.role === "MAIN_DIRECTOR") {
    const allowed = await isSettingEnabled(SETTINGS.UD_CAN_MANAGE_WINDOWS);
    if (!allowed) redirect("/dashboard/director");
  }
  const { state: stateFilter, year: yearFilter } = await searchParams;

  const allWindows = await prisma.applicationWindow.findMany({
    where: { deletedAt: null },
    orderBy: { applicationOpenDate: "desc" },
    include: {
      program: {
        select: {
          id: true,
          code: true,
          title: true,
          isPublished: true,
        },
      },
      scopedToMission: { select: { code: true, name: true } },
      _count: {
        select: {
          applications: { where: { deletedAt: null } },
        },
      },
    },
  });

  // Fetch programs (non-archived) and missions for the new window modal
  const [programs, missions] = await Promise.all([
    prisma.trainingProgram.findMany({
      where: { deletedAt: null },
      orderBy: { startDate: "desc" },
      select: { id: true, code: true, title: true },
    }),
    prisma.localMission.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  // Also get accepted counts per window
  const acceptedCounts = await prisma.application.groupBy({
    by: ["windowId"],
    where: { status: "ACCEPTED", deletedAt: null },
    _count: true,
  });
  const acceptedMap = new Map(
    acceptedCounts.map((r) => [r.windowId, r._count]),
  );

  // Filter
  const filtered = allWindows.filter((w) => {
    if (stateFilter && w.state !== stateFilter) return false;
    if (yearFilter) {
      const y = new Date(w.applicationOpenDate).getFullYear().toString();
      if (y !== yearFilter) return false;
    }
    return true;
  });

  // Stats
  const openCount = allWindows.filter((w) => w.state === "OPEN").length;
  const thisYear = new Date().getFullYear();
  const thisYearCount = allWindows.filter(
    (w) => new Date(w.applicationOpenDate).getFullYear() === thisYear,
  ).length;
  const totalApplications = allWindows.reduce(
    (sum, w) => sum + w._count.applications,
    0,
  );

  // Group: active (OPEN/ADVERTISING/DRAFT) vs past (CLOSED/ARCHIVED)
  const active = filtered.filter((w) =>
    ["OPEN", "ADVERTISING", "DRAFT"].includes(w.state),
  );
  const past = filtered.filter((w) => ["CLOSED", "ARCHIVED"].includes(w.state));

  // Available years for filter
  const years = [
    ...new Set(
      allWindows.map((w) => new Date(w.applicationOpenDate).getFullYear()),
    ),
  ].sort((a, b) => b - a);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Application Windows
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            All program windows across all cycles
          </p>
        </div>
        <NewWindowButton programs={programs} missions={missions} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Open window",
            value: openCount,
            color: openCount > 0 ? "text-teal-700" : "text-gray-900",
          },
          {
            label: `Windows in ${thisYear}`,
            value: thisYearCount,
            color: "text-gray-900",
          },
          {
            label: "Total applications",
            value: totalApplications,
            color: "text-gray-900",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${s.color}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["", "OPEN", "ADVERTISING", "DRAFT", "CLOSED", "ARCHIVED"].map((s) => (
          <Link
            key={s}
            href={`?${new URLSearchParams({ ...(s ? { state: s } : {}), ...(yearFilter ? { year: yearFilter } : {}) })}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              stateFilter === s || (!stateFilter && !s)
                ? "border-teal-400 bg-teal-50 text-teal-800"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            {s || "All"}
          </Link>
        ))}
        <div className="ml-auto flex gap-2">
          {years.map((y) => (
            <Link
              key={y}
              href={`?${new URLSearchParams({ ...(stateFilter ? { state: stateFilter } : {}), year: String(y) })}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                yearFilter === String(y)
                  ? "border-purple-400 bg-purple-50 text-purple-800"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {y}
            </Link>
          ))}
          {yearFilter && (
            <Link
              href={`?${new URLSearchParams(stateFilter ? { state: stateFilter } : {})}`}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-500 hover:border-gray-300"
            >
              ✕ clear year
            </Link>
          )}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">
            No windows match these filters.
          </p>
        </div>
      )}

      {/* Active windows */}
      {active.length > 0 && (
        <div>
          <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-gray-400">
            Active
          </p>
          <div className="space-y-3">
            {active.map((w) => {
              const cfg =
                STATE_CONFIG[w.state as keyof typeof STATE_CONFIG] ??
                STATE_CONFIG.DRAFT;
              const pct = timelinePercent(
                w.applicationOpenDate,
                w.applicationCloseDate,
              );
              const todayPct = todayPercent(
                w.applicationOpenDate,
                w.applicationCloseDate,
              );
              const daysLeft = daysUntil(w.applicationCloseDate);
              const accepted = acceptedMap.get(w.id) ?? 0;

              return (
                <div
                  key={w.id}
                  className={`rounded-xl border border-gray-200 bg-white p-5 ${cfg.border}`}
                >
                  {/* Top row */}
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-400">
                          {w.program.code}
                        </span>
                        {w.program.isPublished && (
                          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                            Active program
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {w.program.title}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}
                          />
                          {cfg.label}
                        </span>
                        <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
                          {w.scopedToMission
                            ? `${w.scopedToMission.code} only`
                            : "All missions"}
                        </span>
                      </div>
                    </div>
                    {w.state === "OPEN" && (
                      <div className="flex-shrink-0 text-right">
                        <p className="text-[10px] text-gray-400">Closes in</p>
                        <p
                          className={`text-lg font-semibold ${daysLeft < 30 ? "text-red-600" : "text-teal-700"}`}
                        >
                          {daysLeft > 0 ? `${daysLeft}d` : "Today"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Timeline bar */}
                  <div className="mb-3">
                    <div className="mb-1 flex justify-between text-[10px] text-gray-400">
                      <span>{formatShort(w.applicationOpenDate)}</span>
                      {w.state === "OPEN" && todayPct > 5 && todayPct < 95 && (
                        <span
                          className="font-medium text-teal-600"
                          style={{ marginLeft: `${todayPct - 8}%` }}
                        >
                          ▾ Today
                        </span>
                      )}
                      <span>{formatShort(w.applicationCloseDate)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all ${cfg.fill}`}
                        style={{
                          width: `${Math.max(pct, w.state === "DRAFT" ? 0 : 4)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mb-3 grid grid-cols-4 gap-3 rounded-lg bg-gray-50 p-3">
                    {[
                      { label: "Applications", value: w._count.applications },
                      { label: "Target intake", value: w.targetIntake },
                      {
                        label: "Training start",
                        value: formatShort(w.trainingStartDate),
                      },
                      {
                        label: "Accepted",
                        value: accepted,
                        color: accepted > 0 ? "text-teal-700" : undefined,
                      },
                    ].map((s, i) => (
                      <div key={i}>
                        <p className="text-[10px] text-gray-400">{s.label}</p>
                        <p
                          className={`mt-0.5 text-sm font-semibold ${s.color ?? "text-gray-900"}`}
                        >
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                    <WindowActions
                      windowId={w.id}
                      state={w.state}
                      programId={w.program.id}
                    />
                    <Link
                      href={`/dashboard/director/applications?programId=${w.program.id}`}
                      className="ml-auto text-xs text-teal-600 hover:underline"
                    >
                      View applications →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past windows */}
      {past.length > 0 && (
        <div>
          <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-gray-400">
            Past
          </p>
          <div className="space-y-3">
            {past.map((w) => {
              const cfg =
                STATE_CONFIG[w.state as keyof typeof STATE_CONFIG] ??
                STATE_CONFIG.CLOSED;
              const accepted = acceptedMap.get(w.id) ?? 0;

              return (
                <div
                  key={w.id}
                  className={`rounded-xl border border-gray-200 bg-white p-5 ${cfg.border}`}
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-400">
                          {w.program.code}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {w.program.title}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}
                          />
                          {cfg.label}
                        </span>
                        <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
                          {w.scopedToMission
                            ? `${w.scopedToMission.code} only`
                            : "All missions"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Full timeline bar — 100% filled */}
                  <div className="mb-3">
                    <div className="mb-1 flex justify-between text-[10px] text-gray-400">
                      <span>Open: {formatDate(w.applicationOpenDate)}</span>
                      <span>Closed: {formatDate(w.applicationCloseDate)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full w-full rounded-full ${cfg.fill}`}
                      />
                    </div>
                  </div>

                  <div className="mb-3 grid grid-cols-4 gap-3 rounded-lg bg-gray-50 p-3">
                    {[
                      { label: "Applications", value: w._count.applications },
                      { label: "Target intake", value: w.targetIntake },
                      {
                        label: "Training start",
                        value: formatShort(w.trainingStartDate),
                      },
                      {
                        label: "Accepted",
                        value: accepted,
                        color: accepted > 0 ? "text-teal-700" : undefined,
                      },
                    ].map((s, i) => (
                      <div key={i}>
                        <p className="text-[10px] text-gray-400">{s.label}</p>
                        <p
                          className={`mt-0.5 text-sm font-semibold ${s.color ?? "text-gray-900"}`}
                        >
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                    <WindowActions
                      windowId={w.id}
                      state={w.state}
                      programId={w.program.id}
                    />
                    <Link
                      href={`/dashboard/director/applications?programId=${w.program.id}`}
                      className="ml-auto text-xs text-teal-600 hover:underline"
                    >
                      View applications →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
