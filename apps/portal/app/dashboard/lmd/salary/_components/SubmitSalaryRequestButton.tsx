"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitSalaryRequestAction } from "@/actions/salary";

export function SubmitSalaryRequestButton({
  missionaryId,
  isWindowOpen,
  windowStart,
  windowEnd,
}: {
  missionaryId: string;
  isWindowOpen: boolean;
  windowStart: number;
  windowEnd: number;
}) {
  const router = useRouter();
  const boundAction = submitSalaryRequestAction.bind(null, missionaryId);
  const [state, action, pending] = useActionState(boundAction, { ok: false });

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok]);

  return (
    <form action={action}>
      {state.error && (
        <p className="mb-1.5 text-xs text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={!isWindowOpen || pending}
        title={
          isWindowOpen
            ? undefined
            : `Salary requests can only be submitted between day ${windowStart} and ${windowEnd} of the month.`
        }
        className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-50 transition-colors"
      >
        {pending ? "Submitting…" : "Submit This Month's Request"}
      </button>
    </form>
  );
}
