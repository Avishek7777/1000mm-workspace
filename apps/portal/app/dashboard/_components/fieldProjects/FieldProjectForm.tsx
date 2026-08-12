"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createFieldProjectAction,
  updateFieldProjectAction,
  type FieldProjectResult,
} from "@/actions/fieldProjects";
import { STAGES } from "@/lib/fieldProjectStages";

const INIT: FieldProjectResult = { ok: false };

export type FieldProjectDefaults = {
  id?: string;
  name?: string;
  objective?: string;
  stage?: string;
  progressPercent?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
};

/** Modal used for both creating and editing — the fields are identical. */
export function FieldProjectForm({
  defaults,
  trigger,
}: {
  defaults?: FieldProjectDefaults;
  trigger: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(defaults?.id);

  const [state, action, pending] = useActionState(
    isEdit
      ? updateFieldProjectAction.bind(null, defaults!.id!)
      : createFieldProjectAction,
    INIT,
  );
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  const fe = ("fieldErrors" in state && state.fieldErrors) || {};

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          isEdit
            ? "rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
            : "rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800"
        }
      >
        {trigger}
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="mb-5 text-sm font-semibold text-gray-900">
          {isEdit ? "Edit Field Project" : "New Field Project"}
        </h2>

        {"error" in state && state.error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              defaultValue={defaults?.name ?? ""}
              placeholder="e.g. Bandarban Church Planting"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
            {fe.name && <p className="mt-0.5 text-xs text-red-500">{fe.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Objective <span className="text-red-500">*</span>
            </label>
            <textarea
              name="objective"
              rows={3}
              defaultValue={defaults?.objective ?? ""}
              placeholder="What this project is meant to achieve…"
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
            {fe.objective && <p className="mt-0.5 text-xs text-red-500">{fe.objective}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Category / Stage
              </label>
              <select
                name="stage"
                defaultValue={defaults?.stage ?? "PLANNING"}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
              >
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Progress %
              </label>
              <input
                name="progressPercent"
                type="number"
                min={0}
                max={100}
                defaultValue={defaults?.progressPercent ?? ""}
                placeholder="Optional"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
              {fe.progressPercent && (
                <p className="mt-0.5 text-xs text-red-500">{fe.progressPercent}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Start Date
              </label>
              <input
                name="startDate"
                type="date"
                defaultValue={defaults?.startDate ?? ""}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">End Date</label>
              <input
                name="endDate"
                type="date"
                defaultValue={defaults?.endDate ?? ""}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={defaults?.notes ?? ""}
              placeholder="Optional"
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
            >
              {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
