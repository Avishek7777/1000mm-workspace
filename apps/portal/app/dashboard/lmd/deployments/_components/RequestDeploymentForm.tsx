"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestDeploymentAction } from "@/actions/deployments";

type Missionary = { id: string; fullName: string };

const INIT = { ok: false as const, error: "" };

export function RequestDeploymentForm({
  missionaries,
  missionName,
}: {
  missionaries: Missionary[];
  missionName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(requestDeploymentAction, INIT);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
      >
        + Request Deployment
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="mb-0.5 text-sm font-semibold text-gray-900">Request Missionary Deployment</h2>
        <p className="mb-5 text-xs text-gray-500">{missionName} · Pending SA/UD approval</p>

        {"error" in state && state.error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</div>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Missionary <span className="text-red-500">*</span>
            </label>
            <select
              name="missionaryId"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            >
              <option value="">Select a missionary…</option>
              {missionaries.map((m) => (
                <option key={m.id} value={m.id}>{m.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Field Location
            </label>
            <input
              name="location"
              placeholder="e.g. Sylhet Sadar, Osmani Nagar"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                name="startDate"
                type="date"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">End Date</label>
              <input
                name="endDate"
                type="date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
            >
              {pending ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
