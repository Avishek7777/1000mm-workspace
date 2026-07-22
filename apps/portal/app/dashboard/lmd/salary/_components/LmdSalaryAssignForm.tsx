"use client";

import { useActionState, useEffect, useState } from "react";
import { assignSalaryAction } from "@/actions/salary";

export function LmdSalaryAssignForm({
  missionaryId,
  cycle,
  minAmount,
  maxAmount,
  deploymentLocation,
  existing,
}: {
  missionaryId: string;
  cycle: number;
  minAmount: number;
  maxAmount: number;
  /** Read-only — sourced from the missionary's active MissionaryDeployment. */
  deploymentLocation: string;
  existing: { amount: number } | null;
}) {
  const [state, action, pending] = useActionState(assignSalaryAction, {
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
      <input type="hidden" name="missionaryId" value={missionaryId} />
      <input type="hidden" name="cycle" value={cycle} />

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Deployment Location
        </label>
        <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          {deploymentLocation}
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Monthly Stipend (৳) — {minAmount.toLocaleString()} to{" "}
          {maxAmount.toLocaleString()}
        </label>
        <input
          type="number"
          name="amount"
          defaultValue={existing?.amount ?? ""}
          min={minAmount}
          max={maxAmount}
          placeholder={`${minAmount} – ${maxAmount}`}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
        {state.fieldErrors?.amount && (
          <p className="mt-0.5 text-xs text-red-500">
            {state.fieldErrors.amount}
          </p>
        )}
      </div>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
        >
          {pending
            ? "Saving…"
            : saved
              ? "✓ Saved"
              : existing
                ? "Update"
                : "Assign"}
        </button>
      </div>
    </form>
  );
}
