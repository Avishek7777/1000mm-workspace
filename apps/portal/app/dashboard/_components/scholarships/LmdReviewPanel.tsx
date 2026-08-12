"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  reviewScholarshipByLmdAction,
  type ScholarshipResult,
} from "@/actions/scholarships";

const INIT: ScholarshipResult = { ok: false };

/**
 * The LMD's stage: record the committee's reasoning, attach the decision copy,
 * and either suggest the candidate to the Union Director or reject.
 */
export function LmdReviewPanel({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [decision, setDecision] = useState<"suggest" | "reject">("suggest");
  const [state, action, pending] = useActionState(
    reviewScholarshipByLmdAction.bind(null, requestId),
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
      <p className="text-xs font-medium text-gray-600">Committee decision</p>

      {"error" in state && state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</p>
      )}

      <div className="flex gap-4">
        {(["suggest", "reject"] as const).map((d) => (
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
                  ? d === "suggest"
                    ? "text-teal-700"
                    : "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {d === "suggest" ? "Suggest to Union Director" : "Reject"}
            </span>
          </label>
        ))}
      </div>

      <div>
        <textarea
          name="note"
          rows={3}
          placeholder="What the committee decided, and why…"
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
        {fe.note && <p className="mt-0.5 text-xs text-red-500">{fe.note}</p>}
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-medium text-gray-600">
          Copy of the decision
          {decision === "suggest" && <span className="text-red-500"> *</span>}
        </label>
        <input
          name="minutes"
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-2 file:py-1 file:text-xs focus:border-teal-500"
        />
        <p className="mt-0.5 text-[11px] text-gray-400">
          {decision === "suggest"
            ? "Required — the Union Director reviews the meeting record alongside the application."
            : "Optional for a rejection."}
        </p>
        {fe.minutes && <p className="mt-0.5 text-xs text-red-500">{fe.minutes}</p>}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60 ${
            decision === "suggest"
              ? "bg-teal-700 hover:bg-teal-800"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {pending ? "Saving…" : decision === "suggest" ? "Suggest Candidate" : "Reject"}
        </button>
      </div>
    </form>
  );
}
