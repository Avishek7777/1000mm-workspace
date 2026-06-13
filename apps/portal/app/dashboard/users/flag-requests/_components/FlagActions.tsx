"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveFlagAction, rejectFlagAction } from "@/actions/users";

export function FlagActions({ flagId }: { flagId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "rejecting">("idle");
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const boundReject = rejectFlagAction.bind(null, flagId);
  const [rejectState, rejectAction, rejectPending] = useActionState(
    boundReject,
    { ok: false },
  );

  useEffect(() => {
    if (rejectState.ok) {
      startTransition(() => router.refresh());
    }
  }, [rejectState.ok]);

  async function handleApprove() {
    setApproving(true);
    setApproveError(null);
    const result = await approveFlagAction(flagId);
    if (!result.ok) {
      setApproveError(result.error ?? "Failed.");
      setApproving(false);
    } else {
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="space-y-3">
      {approveError && <p className="text-xs text-red-500">{approveError}</p>}

      {mode === "idle" ? (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={approving}
            className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {approving ? "…" : "Approve — Deactivate User"}
          </button>
          <button
            onClick={() => setMode("rejecting")}
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Reject Request
          </button>
        </div>
      ) : (
        <form action={rejectAction} className="space-y-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Note (optional)
            </label>
            <input
              name="resolverNote"
              placeholder="Reason for rejection…"
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-teal-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={rejectPending}
              className="rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              {rejectPending ? "…" : "Confirm Reject"}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
