"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewDeploymentAction, endDeploymentAction } from "@/actions/deployments";

export function ReviewDeploymentButtons({ deploymentId }: { deploymentId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    setError("");
    const result = await reviewDeploymentAction(deploymentId, true);
    if (!result.ok) { setError(result.error); setLoading(false); return; }
    startTransition(() => router.refresh());
  }

  async function handleReject() {
    if (!rejecting) { setRejecting(true); return; }
    if (!note.trim()) { setError("Reason required."); return; }
    setLoading(true);
    setError("");
    const result = await reviewDeploymentAction(deploymentId, false, note);
    if (!result.ok) { setError(result.error); setLoading(false); return; }
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {!rejecting ? (
        <div className="flex gap-1.5">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="rounded border border-teal-300 bg-white px-2.5 py-1 text-[11px] font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-50 transition-colors"
          >
            {loading ? "…" : "Approve"}
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="rounded border border-red-200 bg-white px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Reject
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-end gap-1">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for rejection…"
            rows={2}
            className="w-52 rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-red-400"
          />
          <div className="flex gap-1.5">
            <button
              onClick={() => { setRejecting(false); setNote(""); setError(""); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="rounded border border-red-300 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              {loading ? "…" : "Confirm Reject"}
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
}

export function EndActiveDeploymentButton({
  deploymentId,
  name,
}: {
  deploymentId: string;
  name: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  async function handle() {
    if (!confirm(`End active deployment for ${name}?`)) return;
    setLoading(true);
    await endDeploymentAction(deploymentId);
    startTransition(() => router.refresh());
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="rounded border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      {loading ? "…" : "End"}
    </button>
  );
}
