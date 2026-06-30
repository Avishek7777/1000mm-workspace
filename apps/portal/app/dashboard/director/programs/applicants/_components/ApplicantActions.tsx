"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  enrollTraineeAction,
  declineProgramApplicationAction,
} from "@/actions/trainees";

export function ApplicantActions({
  enrollmentId,
  traineeName,
}: {
  enrollmentId: string;
  traineeName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"enroll" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [, startTransition] = useTransition();

  async function enroll() {
    setLoading("enroll");
    setError(null);
    const res = await enrollTraineeAction(enrollmentId);
    if (!res.ok) {
      setError(res.error ?? "Failed.");
      setLoading(null);
    } else {
      setLoading(null);
      startTransition(() => router.refresh());
    }
  }

  async function decline() {
    setLoading("decline");
    setError(null);
    const res = await declineProgramApplicationAction(enrollmentId);
    if (!res.ok) {
      setError(res.error ?? "Failed.");
      setLoading(null);
    } else {
      setLoading(null);
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {confirmDecline ? (
          <>
            <span className="text-[11px] text-gray-500">
              Decline {traineeName}?
            </span>
            <button
              onClick={decline}
              disabled={loading !== null}
              className="rounded-lg border border-red-300 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {loading === "decline" ? "…" : "Yes"}
            </button>
            <button
              onClick={() => setConfirmDecline(false)}
              disabled={loading !== null}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            >
              No
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setConfirmDecline(true)}
              disabled={loading !== null}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={enroll}
              disabled={loading !== null}
              className="rounded-lg bg-teal-700 px-3 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
            >
              {loading === "enroll" ? "Enrolling…" : "Enroll"}
            </button>
          </>
        )}
      </div>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
