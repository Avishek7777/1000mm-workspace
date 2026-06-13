"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { flagUserAction } from "@/actions/users";

export function FlagUserForm({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState(false);

  const boundAction = flagUserAction.bind(null, userId);
  const [state, action, pending] = useActionState(boundAction, { ok: false });

  useEffect(() => {
    if (state.ok) {
      setSuccess(true);
      setReason("");
      router.refresh();
    }
  }, [state.ok]);

  if (success) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
        ✓ Flag request submitted. The System Admin will review it.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-white p-5">
      <p className="mb-1 text-sm font-semibold text-gray-900">
        Flag for Deactivation Review
      </p>
      <p className="mb-4 text-xs text-gray-500">
        Submit a request to the System Admin to deactivate{" "}
        <strong>{userName}</strong>. The account will remain active until the SA
        approves.
      </p>
      {state.error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.error}
        </div>
      )}
      <form action={action} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Explain why this user should be deactivated…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
          />
          {state.fieldErrors?.reason && (
            <p className="mt-0.5 text-xs text-red-500">
              {state.fieldErrors.reason}
            </p>
          )}
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending || !reason.trim()}
            className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60 transition-colors"
          >
            {pending ? "Submitting…" : "Submit Flag Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
