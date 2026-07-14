"use client";

import { useActionState, useEffect, useState } from "react";
import { setSalaryRangeAction } from "@/actions/salary";

export function SalaryRangeForm({
  missionId,
  missionCode,
  currentCycle,
  existing,
}: {
  missionId: string;
  missionCode: string;
  currentCycle: number;
  existing: { minAmount: number; maxAmount: number; cycle: number } | null;
}) {
  const [state, action, pending] = useActionState(setSalaryRangeAction, {
    ok: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Depend on the state OBJECT (new per submission) — depending on
    // state.ok makes repeat saves show no feedback, since it stays true.
    if (state.ok) {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [state]);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="missionId" value={missionId} />
      <input type="hidden" name="cycle" value={currentCycle} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Minimum (৳)
          </label>
          <input
            type="number"
            name="minAmount"
            defaultValue={existing?.minAmount ?? ""}
            min={0}
            placeholder="e.g. 5000"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          {state.fieldErrors?.minAmount && (
            <p className="mt-0.5 text-xs text-red-500">
              {state.fieldErrors.minAmount}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Maximum (৳)
          </label>
          <input
            type="number"
            name="maxAmount"
            defaultValue={existing?.maxAmount ?? ""}
            min={0}
            placeholder="e.g. 15000"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          {state.fieldErrors?.maxAmount && (
            <p className="mt-0.5 text-xs text-red-500">
              {state.fieldErrors.maxAmount}
            </p>
          )}
        </div>
      </div>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex items-center justify-between">
        {existing ? (
          <p className="text-xs text-gray-400">
            Current: ৳{existing.minAmount.toLocaleString()} – ৳
            {existing.maxAmount.toLocaleString()}
          </p>
        ) : (
          <p className="text-xs text-gray-400">No range set yet</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
        >
          {pending ? "Saving…" : saved ? "✓ Saved" : "Save Range"}
        </button>
      </div>
    </form>
  );
}
