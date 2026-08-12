"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  decideScholarshipByUdAction,
  type ScholarshipResult,
} from "@/actions/scholarships";

const INIT: ScholarshipResult = { ok: false };

/**
 * The Union Director's stage: the final decision, and — when approving — the
 * amount to be funded. The amount field only appears on approval, since a
 * rejected application has nothing to fund.
 */
export function UdDecisionPanel({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const [state, action, pending] = useActionState(
    decideScholarshipByUdAction.bind(null, requestId),
    INIT,
  );
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (state.ok) router.refresh();
  }, [state, router]);

  const fe = ("fieldErrors" in state && state.fieldErrors) || {};

  return (
    <form action={action} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
      <p className="text-xs font-medium text-gray-600">Final decision</p>

      {"error" in state && state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>
      )}

      <div className="flex gap-4">
        {(["approve", "reject"] as const).map((d) => (
          <label key={d} className="flex cursor-pointer items-center gap-1.5">
            <input
              type="radio"
              name="decision"
              value={d}
              checked={decision === d}
              onChange={() => setDecision(d)}
              className="h-3.5 w-3.5"
            />
            <span
              className={`text-xs font-medium ${
                decision === d
                  ? d === "approve"
                    ? "text-green-700"
                    : "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {d === "approve" ? "Approve" : "Reject"}
            </span>
          </label>
        ))}
      </div>

      {decision === "approve" && (
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-600">
            Amount funded <span className="text-red-500">*</span>
          </label>
          <input
            name="approvedAmount"
            type="number"
            min={1}
            placeholder="e.g. 60000"
            className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          {fe.approvedAmount && (
            <p className="mt-0.5 text-xs text-red-500">{fe.approvedAmount}</p>
          )}
        </div>
      )}

      <textarea
        name="note"
        rows={3}
        placeholder="Optional note on the decision…"
        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60 ${
            decision === "approve"
              ? "bg-green-700 hover:bg-green-800"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {pending ? "Saving…" : decision === "approve" ? "Approve & Fund" : "Reject"}
        </button>
      </div>
    </form>
  );
}
