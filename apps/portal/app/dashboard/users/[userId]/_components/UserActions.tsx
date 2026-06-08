"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deactivateUserAction,
  reactivateUserAction,
  deleteUserAction,
  removeLmdAction,
} from "@/actions/users";

export function UserActions({
  userId,
  isActive,
  isSelf,
  isLmd,
}: {
  userId: string;
  isActive: boolean;
  isSelf: boolean;
  isLmd: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<
    "deactivate" | "delete" | "remove_lmd" | null
  >(null);
  const [isPending, startTransition] = useTransition();

  if (isSelf) return null;

  async function handle(
    action: "deactivate" | "reactivate" | "delete" | "remove_lmd",
  ) {
    setLoading(action);
    setError(null);
    let result;
    if (action === "deactivate") result = await deactivateUserAction(userId);
    else if (action === "reactivate")
      result = await reactivateUserAction(userId);
    else if (action === "delete") result = await deleteUserAction(userId);
    else result = await removeLmdAction(userId);

    if (!result.ok) {
      setError(result.error ?? "Failed.");
      setLoading(null);
      setConfirm(null);
    } else {
      if (action === "delete" || action === "remove_lmd") {
        router.push("/dashboard/users");
      } else {
        startTransition(() => router.refresh());
      }
      setLoading(null);
      setConfirm(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && <p className="text-[10px] text-red-500">{error}</p>}

      <div className="flex flex-wrap gap-2 justify-end">
        {/* Deactivate / Reactivate */}
        {confirm === "deactivate" ? (
          <div className="flex gap-1">
            <button
              onClick={() => handle("deactivate")}
              disabled={!!loading}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {loading === "deactivate" ? "…" : "Confirm Deactivate"}
            </button>
            <button
              onClick={() => setConfirm(null)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : confirm === "delete" ? (
          <div className="flex gap-1">
            <button
              onClick={() => handle("delete")}
              disabled={!!loading}
              className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-60 transition-colors"
            >
              {loading === "delete" ? "…" : "Confirm Delete"}
            </button>
            <button
              onClick={() => setConfirm(null)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : confirm === "remove_lmd" ? (
          <div className="flex gap-1">
            <button
              onClick={() => handle("remove_lmd")}
              disabled={!!loading}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {loading === "remove_lmd" ? "…" : "Confirm Remove LMD"}
            </button>
            <button
              onClick={() => setConfirm(null)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            {isLmd && (
              <button
                onClick={() => setConfirm("remove_lmd")}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Remove LMD
              </button>
            )}
            {isActive ? (
              <button
                onClick={() => setConfirm("deactivate")}
                className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
              >
                Deactivate
              </button>
            ) : (
              <button
                onClick={() => handle("reactivate")}
                disabled={!!loading}
                className="rounded-lg border border-teal-300 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-60 transition-colors"
              >
                {loading === "reactivate" ? "…" : "Reactivate"}
              </button>
            )}
            <button
              onClick={() => setConfirm("delete")}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              Delete Account
            </button>
          </>
        )}
      </div>
    </div>
  );
}
