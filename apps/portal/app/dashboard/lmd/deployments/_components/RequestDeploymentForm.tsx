"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestDeploymentAction } from "@/actions/deployments";

type Missionary = { id: string; fullName: string; programIds: string[] };
type Program = { id: string; code: string; title: string };
type FieldProject = { id: string; name: string };

const INIT = { ok: false as const, error: "" };

export function RequestDeploymentForm({
  missionaries,
  programs,
  fieldProjects,
  missionName,
}: {
  missionaries: Missionary[];
  programs: Program[];
  fieldProjects: FieldProject[];
  missionName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Narrows the missionary list to those who attended a given programme.
  // Purely a client-side view of data already sent — no refetch, and it does
  // not touch the page's own programme filter, which scopes the deployments
  // list rather than who can be requested.
  const [programFilter, setProgramFilter] = useState("");

  const visibleMissionaries = programFilter
    ? missionaries.filter((m) => m.programIds.includes(programFilter))
    : missionaries;
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
      <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="mb-0.5 text-sm font-semibold text-gray-900">Request Missionary Deployment</h2>
        <p className="mb-5 text-xs text-gray-500">{missionName} · Pending SA/UD approval</p>

        {"error" in state && state.error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</div>
        )}

        <form action={action} className="space-y-4">
          {programs.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Filter by programme
              </label>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              >
                <option value="">All programmes</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.code} — {p.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Missionary <span className="text-red-500">*</span>
            </label>
            <select
              // Remounts when the filter changes, clearing any selection that
              // is no longer in the list — otherwise a name filtered out of
              // view would still be submitted.
              key={programFilter}
              name="missionaryId"
              required
              disabled={visibleMissionaries.length === 0}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Select a missionary…</option>
              {visibleMissionaries.map((m) => (
                <option key={m.id} value={m.id}>{m.fullName}</option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-gray-400">
              {visibleMissionaries.length === 0
                ? "No missionaries attended this programme."
                : `${visibleMissionaries.length} of ${missionaries.length} shown`}
            </p>
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

          {/* ── Assignment: what the missionary will actually be doing ── */}
          <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
              Assignment
            </p>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Field Project
              </label>
              <select
                name="fieldProjectId"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              >
                <option value="">Not assigned yet</option>
                {fieldProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-400">
                {fieldProjects.length === 0
                  ? "No field projects yet — create one from Field Projects, or assign later."
                  : "Can be changed later without ending the deployment."}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Role</label>
              <input
                name="role"
                placeholder="e.g. Team Leader, Health Worker, Bible Instructor"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Responsibilities
              </label>
              <textarea
                name="responsibilities"
                rows={3}
                placeholder="What this missionary is responsible for on the project…"
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Job Description
              </label>
              <textarea
                name="jobDescription"
                rows={3}
                placeholder="Day-to-day duties and expectations…"
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
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
