"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createMissionAction } from "@/actions/missions";

type LmdUser = { id: string; fullName: string; email: string };

const INIT = { ok: false as const, error: "" };

export function AddMissionButton({ lmdUsers }: { lmdUsers: LmdUser[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
      >
        + Add Mission
      </button>
      {open && <AddMissionModal lmdUsers={lmdUsers} onClose={() => setOpen(false)} />}
    </>
  );
}

function AddMissionModal({ lmdUsers, onClose }: { lmdUsers: LmdUser[]; onClose: () => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createMissionAction, INIT);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (state.ok) {
      onClose();
      router.refresh();
    }
  }, [state]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fe = ("fieldErrors" in state ? state.fieldErrors : undefined) ?? {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Add New Mission</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form action={action} className="px-6 py-5 space-y-4">
          {"error" in state && state.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {state.error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Mission Code <span className="text-red-500">*</span>
            </label>
            <input
              name="code"
              placeholder="e.g. CBM"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase outline-none focus:border-teal-500"
              maxLength={10}
            />
            <p className="mt-0.5 text-[11px] text-gray-400">
              Short unique identifier (letters + numbers, auto-uppercased). Cannot be changed later.
            </p>
            {fe.code && <p className="mt-0.5 text-xs text-red-500">{fe.code}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Name (English) <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              placeholder="e.g. Central Bangladesh Mission"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
            {fe.name && <p className="mt-0.5 text-xs text-red-500">{fe.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Name (Bangla)
            </label>
            <input
              name="nameBangla"
              dir="auto"
              placeholder="মিশনের নাম বাংলায়"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Contact Email</label>
            <input
              name="contactEmail"
              type="email"
              placeholder="mission@example.org"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Contact Phone</label>
            <input
              name="contactPhone"
              placeholder="+880 1X XX XXX XXXX"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Address</label>
            <input
              name="address"
              placeholder="Mission office address"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Local Director</label>
            <select
              name="directorId"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            >
              <option value="">— Assign later —</option>
              {lmdUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Brief description of the mission's region and work"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
            >
              {pending ? "Creating…" : "Create Mission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
