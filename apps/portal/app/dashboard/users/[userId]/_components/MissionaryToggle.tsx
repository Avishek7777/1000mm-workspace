"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleMissionaryStatusAction } from "@/actions/salary";

export function MissionaryToggle({
  userId,
  isMissionary,
}: {
  userId: string;
  isMissionary: boolean;
}) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState(isMissionary);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handle() {
    setError(null);
    const result = await toggleMissionaryStatusAction(userId);
    if (!result.ok) {
      setError(result.error ?? "Failed.");
    } else {
      setOptimistic(!optimistic);
      setConfirm(false);
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <p className="text-[10px] text-red-500">{error}</p>}
      {confirm ? (
        <div className="flex gap-1">
          <button
            onClick={handle}
            disabled={isPending}
            className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
          >
            {isPending ? "…" : "Confirm"}
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirm(true)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            optimistic
              ? "border-amber-300 text-amber-700 hover:bg-amber-50"
              : "border-teal-300 text-teal-700 hover:bg-teal-50"
          }`}
        >
          {optimistic ? "Revoke Missionary Status" : "Grant Missionary Status"}
        </button>
      )}
    </div>
  );
}
