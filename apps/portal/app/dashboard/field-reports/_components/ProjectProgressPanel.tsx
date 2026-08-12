"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFieldProjectProgressAction } from "@/actions/fieldProjects";
import type { FieldProjectStage } from "@1000mm/db";
import { STAGES } from "@/lib/fieldProjectStages";



/**
 * Lets a reviewer move a project on while reading the report that prompted it,
 * rather than having to remember the change and go to the projects page. Only
 * stage and percentage — the project's name, objective and dates are edited on
 * the project itself.
 */
export function ProjectProgressPanel({
  project,
  canEdit,
}: {
  project: {
    id: string;
    name: string;
    objective: string;
    stage: FieldProjectStage;
    progressPercent: number | null;
  };
  canEdit: boolean;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<FieldProjectStage>(project.stage);
  const [percent, setPercent] = useState(
    project.progressPercent != null ? String(project.progressPercent) : "",
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty =
    stage !== project.stage ||
    percent !== (project.progressPercent != null ? String(project.progressPercent) : "");

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateFieldProjectProgressAction(
        project.id,
        stage,
        percent === "" ? null : Number(percent),
      );
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(res.error ?? "Could not update the project.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-gray-900">Field Project</h2>
          <p className="mt-0.5 text-sm font-semibold text-gray-800">{project.name}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{project.objective}</p>
        </div>
      </div>

      {/* Progress bar — reads at a glance, which the number alone does not */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
          <span>{STAGES.find((s) => s.value === project.stage)?.label ?? project.stage}</span>
          <span>{project.progressPercent != null ? `${project.progressPercent}%` : "—"}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-teal-600 transition-all"
            style={{ width: `${project.progressPercent ?? 0}%` }}
          />
        </div>
      </div>

      {!canEdit ? null : (
        <div className="border-t border-gray-100 pt-4">
          <p className="mb-2 text-xs font-medium text-gray-600">Update progress</p>
          {error && (
            <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[9rem] flex-1">
              <label className="mb-1 block text-[11px] text-gray-500">Stage</label>
              <select
                value={stage}
                onChange={(e) => {
                  setStage(e.target.value as FieldProjectStage);
                  setSaved(false);
                }}
                className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-teal-500"
              >
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="mb-1 block text-[11px] text-gray-500">Percent</label>
              <input
                type="number"
                min={0}
                max={100}
                value={percent}
                onChange={(e) => {
                  setPercent(e.target.value);
                  setSaved(false);
                }}
                placeholder="—"
                className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-teal-500"
              />
            </div>
            <button
              type="button"
              onClick={save}
              disabled={isPending || !dirty}
              className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Update"}
            </button>
            {saved && !dirty && (
              <span className="text-xs font-medium text-green-600">Updated</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
