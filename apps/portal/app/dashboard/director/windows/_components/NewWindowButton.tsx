"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createWindowAction } from "@/actions/programs";

type Program = {
  id: string;
  code: string;
  title: string;
};

type Mission = {
  id: string;
  code: string;
  name: string;
};

export function NewWindowButton({
  programs,
  missions,
}: {
  programs: Program[];
  missions: Mission[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New window
      </button>

      {open && (
        <NewWindowModal
          programs={programs}
          missions={missions}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function NewWindowModal({
  programs,
  missions,
  onClose,
}: {
  programs: Program[];
  missions: Mission[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedProgramId, setSelectedProgramId] = useState(
    programs[0]?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Controlled fields
  const [fields, setFields] = useState({
    advertisingStartDate: "",
    applicationOpenDate: "",
    applicationCloseDate: "",
    trainingStartDate: "",
    targetIntake: "",
    scopedToMissionId: "",
    notes: "",
  });

  function set(key: keyof typeof fields) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => setFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProgramId) {
      setError("Please select a program.");
      return;
    }
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => {
      if (v) fd.append(k, v);
    });

    const result = await createWindowAction(
      selectedProgramId,
      { ok: false },
      fd,
    );

    if (!result.ok) {
      setFieldErrors(result.fieldErrors ?? {});
      setError(result.error ?? null);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        startTransition(() => router.refresh());
      }, 1200);
    }
  }

  // Close on Escape
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
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Create Application Window
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
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

        {/* Success state */}
        {success ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
              <svg
                className="h-6 w-6 text-teal-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Window created!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Program selector */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Program <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              >
                {programs.length === 0 ? (
                  <option value="">No programs available</option>
                ) : (
                  programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Applications Open <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={fields.applicationOpenDate}
                  onChange={set("applicationOpenDate")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
                {fieldErrors.applicationOpenDate && (
                  <p className="mt-0.5 text-xs text-red-500">
                    {fieldErrors.applicationOpenDate}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Applications Close <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={fields.applicationCloseDate}
                  onChange={set("applicationCloseDate")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
                {fieldErrors.applicationCloseDate && (
                  <p className="mt-0.5 text-xs text-red-500">
                    {fieldErrors.applicationCloseDate}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Training Start <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={fields.trainingStartDate}
                  onChange={set("trainingStartDate")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
                {fieldErrors.trainingStartDate && (
                  <p className="mt-0.5 text-xs text-red-500">
                    {fieldErrors.trainingStartDate}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Advertising Start
                </label>
                <input
                  type="date"
                  value={fields.advertisingStartDate}
                  onChange={set("advertisingStartDate")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Target Intake <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={fields.targetIntake}
                  onChange={set("targetIntake")}
                  placeholder="e.g. 100"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
                {fieldErrors.targetIntake && (
                  <p className="mt-0.5 text-xs text-red-500">
                    {fieldErrors.targetIntake}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Scope to Mission
                </label>
                <select
                  value={fields.scopedToMissionId}
                  onChange={set("scopedToMissionId")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                >
                  <option value="">All missions</option>
                  {missions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Notes
              </label>
              <input
                type="text"
                value={fields.notes}
                onChange={set("notes")}
                placeholder="Optional notes about this window"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </div>

            {/* Actions */}
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
                disabled={loading || programs.length === 0}
                className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
              >
                {loading ? "Creating…" : "Create Window"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
