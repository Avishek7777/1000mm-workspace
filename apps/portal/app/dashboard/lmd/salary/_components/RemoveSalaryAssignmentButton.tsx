"use client";

import { useActionState } from "react";
import { removeSalaryAssignmentAction } from "@/actions/salary";

const initial = { ok: false, error: "" };

export function RemoveSalaryAssignmentButton({
  missionaryId,
  cycle,
}: {
  missionaryId: string;
  cycle: number;
}) {
  const [state, action, pending] = useActionState(removeSalaryAssignmentAction, initial);

  return (
    <form action={action} className="inline">
      <input type="hidden" name="missionaryId" value={missionaryId} />
      <input type="hidden" name="cycle" value={cycle} />
      {state.error && (
        <p className="mb-1 text-[10px] text-red-500">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="text-[10px] font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        onClick={(e) => {
          if (!confirm("Remove this salary assignment?")) e.preventDefault();
        }}
      >
        {pending ? "Removing…" : "Remove"}
      </button>
    </form>
  );
}
