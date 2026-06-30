"use client";

import { useActionState, useRef } from "react";
import { submitFeedback } from "@/actions/assignments";

type Props = { submissionId: string; programId: string; assignmentId: string; existing?: string | null };

export function FeedbackForm({ submissionId, programId, assignmentId, existing }: Props) {
  const [state, dispatch, pending] = useActionState(submitFeedback, null);
  const isFirstRender = useRef(true);

  if (state !== null) isFirstRender.current = false;

  return (
    <form action={dispatch} className="mt-2 space-y-2">
      <input type="hidden" name="submissionId" value={submissionId} />
      <input type="hidden" name="programId" value={programId} />
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <textarea
        name="feedback"
        rows={3}
        defaultValue={existing ?? ""}
        placeholder="Write feedback…"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none"
      />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.ok && !isFirstRender.current && <p className="text-xs text-teal-600">Feedback saved.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
      >
        {pending ? "Saving…" : existing ? "Update Feedback" : "Save Feedback"}
      </button>
    </form>
  );
}
