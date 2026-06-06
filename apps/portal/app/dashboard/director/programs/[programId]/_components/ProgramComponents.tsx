"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  openWindowAction,
  closeWindowAction,
  archiveWindowAction,
  editProgramAction,
} from "@/actions/programs";

// ── Window action panel ───────────────────────────────────────────────────────

export function WindowPanel({
  windowId,
  state,
  programId,
}: {
  windowId: string;
  state: string;
  programId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handle(action: "open" | "close" | "archive") {
    setLoading(true);
    setError(null);
    let result;
    if (action === "open") result = await openWindowAction(windowId);
    else if (action === "close") result = await closeWindowAction(windowId);
    else result = await archiveWindowAction(windowId);

    if (!result.ok) {
      setError(result.error ?? "Failed.");
      setLoading(false);
    } else {
      startTransition(() => router.refresh());
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-shrink-0 flex-col items-end gap-1">
      <div className="flex gap-2">
        {state === "DRAFT" && (
          <button
            onClick={() => handle("open")}
            disabled={loading}
            className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {loading ? "…" : "Open"}
          </button>
        )}
        {state === "ADVERTISING" && (
          <button
            onClick={() => handle("open")}
            disabled={loading}
            className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {loading ? "…" : "Open Now"}
          </button>
        )}
        {state === "OPEN" && (
          <button
            onClick={() => handle("close")}
            disabled={loading}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-60 transition-colors"
          >
            {loading ? "…" : "Close"}
          </button>
        )}
        {["CLOSED", "DRAFT", "ADVERTISING"].includes(state) && (
          <button
            onClick={() => handle("archive")}
            disabled={loading || state === "OPEN"}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            Archive
          </button>
        )}
      </div>
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
}

// ── Program edit form ─────────────────────────────────────────────────────────

type Program = {
  id: string;
  title: string;
  titleBangla: string | null;
  category: string;
  summary: string | null;
  summaryBangla: string | null;
  startDate: Date;
  endDate: Date;
  location: string | null;
  locationBangla: string | null;
  targetIntake: number;
  maxIntake: number | null;
};

const CATEGORIES = [
  { value: "SPIRITUAL", label: "Spiritual" },
  { value: "PHYSICAL", label: "Physical" },
  { value: "MENTAL", label: "Mental" },
  { value: "SOCIAL", label: "Social" },
];

export function ProgramEditForm({ program }: { program: Program }) {
  const router = useRouter();

  const boundAction = editProgramAction.bind(null, program.id);
  const [state, action, pending] = useActionState(boundAction, { ok: false });

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok]);

  const e = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.error}
        </div>
      )}
      {state.ok && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          Program updated successfully.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            defaultValue={program.category}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Target Intake <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="targetIntake"
            defaultValue={program.targetIntake}
            min={1}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          {e.targetIntake && (
            <p className="mt-0.5 text-xs text-red-500">{e.targetIntake}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Title (English) <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          defaultValue={program.title}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
        {e.title && <p className="mt-0.5 text-xs text-red-500">{e.title}</p>}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Title (Bangla)
        </label>
        <input
          name="titleBangla"
          defaultValue={program.titleBangla ?? ""}
          dir="auto"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="startDate"
            defaultValue={
              new Date(program.startDate).toISOString().split("T")[0]
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          {e.startDate && (
            <p className="mt-0.5 text-xs text-red-500">{e.startDate}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="endDate"
            defaultValue={new Date(program.endDate).toISOString().split("T")[0]}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          {e.endDate && (
            <p className="mt-0.5 text-xs text-red-500">{e.endDate}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Location
          </label>
          <input
            name="location"
            defaultValue={program.location ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Location (Bangla)
          </label>
          <input
            name="locationBangla"
            defaultValue={program.locationBangla ?? ""}
            dir="auto"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Summary
        </label>
        <textarea
          name="summary"
          rows={3}
          defaultValue={program.summary ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Summary (Bangla)
        </label>
        <textarea
          name="summaryBangla"
          rows={3}
          defaultValue={program.summaryBangla ?? ""}
          dir="auto"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
      </div>

      <div className="flex justify-end border-t border-gray-100 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
