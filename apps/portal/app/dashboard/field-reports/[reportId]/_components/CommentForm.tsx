"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addFieldReportCommentAction } from "@/actions/fieldReports";

export function CommentForm({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const boundAction = addFieldReportCommentAction.bind(null, reportId);
  const [state, action, pending] = useActionState(boundAction, { ok: false });

  useEffect(() => {
    if (state.ok) {
      setComment("");
      router.refresh();
    }
  }, [state.ok]);

  return (
    <form action={action} className="space-y-3">
      <textarea
        name="comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Write a comment…"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
      />
      {state.fieldErrors?.comment && (
        <p className="text-xs text-red-500">{state.fieldErrors.comment}</p>
      )}
      {state.error && <p className="text-xs text-red-500">{state.error}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || !comment.trim()}
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
        >
          {pending ? "Posting…" : "Post Comment"}
        </button>
      </div>
    </form>
  );
}
