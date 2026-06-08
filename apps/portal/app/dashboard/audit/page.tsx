import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import type { AuditSeverity } from "@1000mm/db";

// ─── Config ───────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<
  AuditSeverity,
  { bg: string; text: string; dot: string }
> = {
  INFO: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  NOTICE: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  WARNING: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  CRITICAL: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

const ROLE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN: "SA",
  MAIN_DIRECTOR: "UD",
  LOCAL_DIRECTOR: "LMD",
  TRAINER: "Trainer",
  TRAINEE: "Trainee",
};

function formatAction(action: string) {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatDate(d: Date) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const PAGE_SIZE = 50;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    action?: string;
    severity?: string;
    actor?: string;
  }>;
}) {
  await requireRole(["SYSTEM_ADMIN"]);
  const { page, q, action, severity, actor } = await searchParams;

  const pageNum = Math.max(1, parseInt(page ?? "1", 10));

  const where = {
    ...(severity ? { severity: severity as AuditSeverity } : {}),
    ...(action
      ? { action: { contains: action, mode: "insensitive" as const } }
      : {}),
    ...(actor
      ? {
          actor: {
            fullName: { contains: actor, mode: "insensitive" as const },
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { action: { contains: q, mode: "insensitive" as const } },
            { targetType: { contains: q, mode: "insensitive" as const } },
            { targetId: { contains: q, mode: "insensitive" as const } },
            {
              actor: {
                fullName: { contains: q, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        actor: { select: { fullName: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Stats for current filter set
  const criticalCount = await prisma.auditLog.count({
    where: { severity: "CRITICAL" },
  });
  const warningCount = await prisma.auditLog.count({
    where: { severity: "WARNING" },
  });
  const todayCount = await prisma.auditLog.count({
    where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
  });

  function buildUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) p.set(k, v);
    }
    return `?${p.toString()}`;
  }

  const severities = ["INFO", "NOTICE", "WARNING", "CRITICAL"];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Audit Logs</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          System activity log · {total.toLocaleString()} total records
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-400">Today</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {todayCount}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs text-amber-600">Warnings</p>
          <p className="mt-1 text-2xl font-semibold text-amber-800">
            {warningCount}
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs text-red-600">Critical</p>
          <p className="mt-1 text-2xl font-semibold text-red-800">
            {criticalCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <form method="GET" className="flex gap-2">
          {severity && <input type="hidden" name="severity" value={severity} />}
          {actor && <input type="hidden" name="actor" value={actor} />}
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search action, target, actor…"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 w-64"
          />
          <button
            type="submit"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Search
          </button>
          {(q || severity || actor) && (
            <Link
              href="?"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-50 transition-colors"
            >
              ✕ Clear
            </Link>
          )}
        </form>

        {/* Severity filter */}
        <div className="flex gap-1">
          <Link
            href={buildUrl({ q, actor })}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${!severity ? "border-teal-400 bg-teal-50 text-teal-800" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
          >
            All
          </Link>
          {severities.map((s) => {
            const cfg = SEVERITY_CONFIG[s as AuditSeverity];
            return (
              <Link
                key={s}
                href={buildUrl({ q, actor, severity: s })}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${severity === s ? `${cfg.bg} ${cfg.text} border-transparent` : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
              >
                {s}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-400">
            No audit logs match your filters.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-xs">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Severity
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Action
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Actor
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Target
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  IP
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => {
                const cfg = SEVERITY_CONFIG[log.severity];
                return (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap font-mono">
                      {formatDate(log.createdAt)}
                    </td>

                    {/* Severity */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}
                        />
                        {log.severity}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">
                        {formatAction(log.action)}
                      </span>
                    </td>

                    {/* Actor */}
                    <td className="px-4 py-3">
                      {log.actor ? (
                        <div>
                          <p className="font-medium text-gray-700">
                            {log.actor.fullName}
                          </p>
                          <p className="text-gray-400">
                            {log.actorRole
                              ? (ROLE_LABELS[log.actorRole] ?? log.actorRole)
                              : ""}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">System</span>
                      )}
                    </td>

                    {/* Target */}
                    <td className="px-4 py-3">
                      {log.targetType ? (
                        <div>
                          <p className="text-gray-600">{log.targetType}</p>
                          {log.targetId && (
                            <p className="font-mono text-gray-300 text-[10px] truncate max-w-[120px]">
                              {log.targetId}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* IP */}
                    <td className="px-4 py-3 font-mono text-gray-400">
                      {log.ipAddress ?? "—"}
                    </td>

                    {/* Details toggle */}
                    <td className="px-4 py-3">
                      {log.details && (
                        <details className="group">
                          <summary className="cursor-pointer text-teal-600 hover:text-teal-800 list-none text-[10px]">
                            Details
                          </summary>
                          <div className="absolute z-10 mt-1 max-w-xs rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                            <pre className="text-[10px] text-gray-600 whitespace-pre-wrap overflow-auto max-h-40">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </details>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(pageNum - 1) * PAGE_SIZE + 1}–
            {Math.min(pageNum * PAGE_SIZE, total)} of {total.toLocaleString()}
          </p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link
                href={buildUrl({
                  q,
                  severity,
                  actor,
                  page: String(pageNum - 1),
                })}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                ← Prev
              </Link>
            )}
            {/* Page numbers — show up to 5 around current */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(pageNum - 2, totalPages - 4)) + i;
              return (
                <Link
                  key={p}
                  href={buildUrl({ q, severity, actor, page: String(p) })}
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${p === pageNum ? "border-teal-400 bg-teal-50 text-teal-800" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
                >
                  {p}
                </Link>
              );
            })}
            {pageNum < totalPages && (
              <Link
                href={buildUrl({
                  q,
                  severity,
                  actor,
                  page: String(pageNum + 1),
                })}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
