import { FieldProjectForm } from "./FieldProjectForm";
import { ArchiveProjectButton } from "./ArchiveProjectButton";
import { stageLabel, stageBadge } from "@/lib/fieldProjectStages";

function fmtDate(d: Date | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toDateInput(d: Date | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export type BoardProject = {
  id: string;
  name: string;
  objective: string;
  stage: string;
  progressPercent: number | null;
  startDate: Date | null;
  endDate: Date | null;
  notes: string | null;
  mission: { code: string; name: string };
  assignments: Array<{
    id: string;
    role: string | null;
    startedAt: Date;
    endedAt: Date | null;
    endReason: string | null;
    missionary: { fullName: string };
  }>;
};

/**
 * Shared between the LMD's own projects page and the oversight views, which
 * differ only in whether they span one mission or all of them.
 */
export function FieldProjectBoard({
  projects,
  canEdit,
  showMission = false,
}: {
  projects: BoardProject[];
  canEdit: boolean;
  showMission?: boolean;
}) {
  if (projects.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400">
        No field projects yet.
        {canEdit ? " Create one to start assigning missionaries to it." : ""}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((p) => {
        // An assignment is current while it has no end date. Past ones are the
        // history the client asked for — who has worked on this, and when.
        const current = p.assignments.filter((a) => a.endedAt == null);
        const past = p.assignments.filter((a) => a.endedAt != null);

        return (
          <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{p.name}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      stageBadge[p.stage] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {stageLabel[p.stage] ?? p.stage}
                  </span>
                  {showMission && (
                    <span className="font-mono text-[10px] text-gray-400">
                      {p.mission.code}
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-gray-600">{p.objective}</p>
                {(p.startDate || p.endDate) && (
                  <p className="mt-1 text-[11px] text-gray-400">
                    {fmtDate(p.startDate) ?? "—"} → {fmtDate(p.endDate) ?? "Open-ended"}
                  </p>
                )}
              </div>

              {canEdit && (
                <div className="flex shrink-0 items-center gap-2">
                  <FieldProjectForm
                    trigger="Edit"
                    defaults={{
                      id: p.id,
                      name: p.name,
                      objective: p.objective,
                      stage: p.stage,
                      progressPercent: p.progressPercent,
                      startDate: toDateInput(p.startDate),
                      endDate: toDateInput(p.endDate),
                      notes: p.notes,
                    }}
                  />
                  <ArchiveProjectButton projectId={p.id} name={p.name} />
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
                <span>Progress</span>
                <span>{p.progressPercent != null ? `${p.progressPercent}%` : "—"}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-teal-600"
                  style={{ width: `${p.progressPercent ?? 0}%` }}
                />
              </div>
            </div>

            {/* Team */}
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="mb-1.5 text-[11px] font-medium tracking-wide text-gray-500 uppercase">
                Currently assigned
              </p>
              {current.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Nobody assigned</p>
              ) : (
                <ul className="space-y-1">
                  {current.map((a) => (
                    <li key={a.id} className="text-xs text-gray-700">
                      <span className="font-medium">{a.missionary.fullName}</span>
                      {a.role ? <span className="text-gray-500">{" · "}{a.role}</span> : null}
                      <span className="text-gray-400">
                        {" · since "}
                        {fmtDate(a.startedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {past.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-[11px] font-medium text-gray-500 hover:text-gray-700">
                    Assignment history ({past.length})
                  </summary>
                  <ul className="mt-1.5 space-y-1">
                    {past.map((a) => (
                      <li key={a.id} className="text-xs text-gray-500">
                        <span className="font-medium text-gray-600">
                          {a.missionary.fullName}
                        </span>
                        {a.role ? <span>{" · "}{a.role}</span> : null}
                        <span className="text-gray-400">
                          {" · "}
                          {fmtDate(a.startedAt)} → {fmtDate(a.endedAt)}
                          {a.endReason ? ` (${a.endReason})` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>

            {p.notes && (
              <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
                {p.notes}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
