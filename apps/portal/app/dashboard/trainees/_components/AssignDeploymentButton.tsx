"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignDeploymentAction } from "@/actions/trainees";

export function AssignDeploymentButton({
  enrollmentId,
  traineeName,
  currentLocation,
}: {
  enrollmentId: string;
  traineeName: string;
  currentLocation?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState(currentLocation ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(currentLocation);

  async function handle() {
    if (!location.trim()) {
      setError("Location is required.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await assignDeploymentAction(enrollmentId, location.trim());
    if (!result.ok) {
      setError(result.error ?? "Failed.");
      setLoading(false);
    } else {
      setOpen(false);
      setLocation("");
      startTransition(() => router.refresh());
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => {
          setLocation(currentLocation ?? "");
          setOpen(true);
        }}
        className="rounded border border-teal-300 bg-white px-2 py-0.5 text-[10px] font-medium text-teal-700 hover:bg-teal-50 transition-colors"
      >
        {isEdit ? "Edit" : "Assign"}
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">
          {isEdit ? "Edit Deployment Location" : "Assign Deployment Location"}
        </h2>
        <p className="mb-4 text-xs text-gray-500">{traineeName}</p>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Sylhet District, Osmani Nagar"
          autoFocus
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          onKeyDown={(e) => {
            if (e.key === "Enter") handle();
          }}
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handle}
            disabled={loading}
            className="rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
          >
            {loading ? "Saving…" : isEdit ? "Update" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}
