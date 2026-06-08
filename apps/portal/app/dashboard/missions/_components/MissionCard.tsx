"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateMissionAction } from "@/actions/missions";

type Mission = {
  id: string;
  code: string;
  name: string;
  nameBangla: string;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  director: { id: string; fullName: string; email: string } | null;
  _count: { users: number; applications: number };
};

const MISSION_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  EBM: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  NBM: {
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-200",
  },
  SBM: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  WBM: { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200" },
};

export function MissionCard({ mission }: { mission: Mission }) {
  const [editing, setEditing] = useState(false);
  const colors = MISSION_COLORS[mission.code] ?? MISSION_COLORS.EBM;

  return (
    <>
      <div className={`rounded-xl border ${colors.border} bg-white p-5`}>
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.bg} ${colors.text}`}
              >
                {mission.code}
              </span>
            </div>
            <h2 className="text-sm font-semibold text-gray-900">
              {mission.name}
            </h2>
            <p className="text-xs text-gray-500">{mission.nameBangla}</p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-[10px] text-gray-400">Members</p>
            <p className="text-lg font-semibold text-gray-900">
              {mission._count.users}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-[10px] text-gray-400">Applications</p>
            <p className="text-lg font-semibold text-gray-900">
              {mission._count.applications}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <span className="w-20 flex-shrink-0 text-gray-400">Director</span>
            <span className="font-medium text-gray-800">
              {mission.director
                ? `${mission.director.fullName}`
                : "Not assigned"}
            </span>
          </div>
          {mission.contactEmail && (
            <div className="flex items-start gap-2">
              <span className="w-20 flex-shrink-0 text-gray-400">Email</span>
              <span className="text-gray-700">{mission.contactEmail}</span>
            </div>
          )}
          {mission.contactPhone && (
            <div className="flex items-start gap-2">
              <span className="w-20 flex-shrink-0 text-gray-400">Phone</span>
              <span className="text-gray-700">{mission.contactPhone}</span>
            </div>
          )}
          {mission.address && (
            <div className="flex items-start gap-2">
              <span className="w-20 flex-shrink-0 text-gray-400">Address</span>
              <span className="text-gray-700">{mission.address}</span>
            </div>
          )}
          {mission.description && (
            <div className="flex items-start gap-2">
              <span className="w-20 flex-shrink-0 text-gray-400">About</span>
              <span className="text-gray-600">{mission.description}</span>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <EditMissionModal mission={mission} onClose={() => setEditing(false)} />
      )}
    </>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────

function EditMissionModal({
  mission,
  onClose,
}: {
  mission: Mission;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const boundAction = updateMissionAction.bind(null, mission.id);
  const [state, action, pending] = useActionState(boundAction, { ok: false });

  const [fields, setFields] = useState({
    name: mission.name,
    nameBangla: mission.nameBangla,
    description: mission.description ?? "",
    contactEmail: mission.contactEmail ?? "",
    contactPhone: mission.contactPhone ?? "",
    address: mission.address ?? "",
  });

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  useEffect(() => {
    if (state.ok) {
      onClose();
      startTransition(() => router.refresh());
    }
  }, [state.ok]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Edit — {mission.code}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form action={action} className="px-6 py-5 space-y-4">
          {state.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {state.error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Name (English) <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={fields.name}
              onChange={set("name")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Name (Bangla)
            </label>
            <input
              name="nameBangla"
              value={fields.nameBangla}
              onChange={set("nameBangla")}
              dir="auto"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Contact Email
            </label>
            <input
              name="contactEmail"
              type="email"
              value={fields.contactEmail}
              onChange={set("contactEmail")}
              placeholder="mission@example.org"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Contact Phone
            </label>
            <input
              name="contactPhone"
              value={fields.contactPhone}
              onChange={set("contactPhone")}
              placeholder="+880 1X XX XXX XXXX"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Address
            </label>
            <input
              name="address"
              value={fields.address}
              onChange={set("address")}
              placeholder="Mission office address"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={fields.description}
              onChange={set("description")}
              rows={3}
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
              {pending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
