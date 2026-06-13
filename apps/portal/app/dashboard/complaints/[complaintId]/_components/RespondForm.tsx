"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { respondToComplaintAction } from "@/actions/complaints";

export function RespondForm({ complaintId }: { complaintId: string }) {
  const router = useRouter();
  const [response, setResponse] = useState("");
  const [success, setSuccess] = useState(false);

  const boundAction = respondToComplaintAction.bind(null, complaintId);
  const [state, action, pending] = useActionState(boundAction, { ok: false });

  useEffect(() => {
    if (state.ok) {
      setSuccess(true);
      setTimeout(() => router.refresh(), 800);
    }
  }, [state.ok]);

  if (success) {
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm text-teal-700 text-center">
        ✓ Response submitted — complaint marked as resolved.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">
        Write a Response
      </h2>
      <p className="mb-4 text-xs text-gray-500">
        Your response will be sent to the submitter (if they revealed their
        identity) and the complaint will be marked as resolved.
      </p>

      {state.error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <textarea
            name="response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={5}
            placeholder="Write your response here…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          {state.fieldErrors?.response && (
            <p className="mt-0.5 text-xs text-red-500">
              {state.fieldErrors.response}
            </p>
          )}
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending || !response.trim()}
            className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
          >
            {pending ? "Submitting…" : "Submit Response"}
          </button>
        </div>
      </form>
    </div>
  );
}
