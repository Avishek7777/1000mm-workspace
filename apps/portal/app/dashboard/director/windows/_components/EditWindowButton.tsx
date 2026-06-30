"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editWindowAction } from "@/actions/programs";

type WindowData = {
  id: string;
  state: string;
  advertisingStartDate: Date | string;
  applicationOpenDate: Date | string;
  applicationCloseDate: Date | string;
  trainingStartDate: Date | string;
  targetIntake: number;
  notes: string | null;
};

function toInput(d: Date | string) {
  const date = new Date(d);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10); // yyyy-mm-dd, local
}

export function EditWindowButton({ window: w }: { window: WindowData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [form, setForm] = useState({
    advertisingStartDate: toInput(w.advertisingStartDate),
    applicationOpenDate: toInput(w.applicationOpenDate),
    applicationCloseDate: toInput(w.applicationCloseDate),
    trainingStartDate: toInput(w.trainingStartDate),
    targetIntake: String(w.targetIntake),
    notes: w.notes ?? "",
  });

  if (w.state === "ARCHIVED") return null;

  const live = w.state === "OPEN" || w.state === "CLOSED";
  const label = live ? "Extend" : "Edit";
  const todayStr = toInput(new Date());
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setLoading(true);
    setError(null);
    const result = await editWindowAction({
      windowId: w.id,
      advertisingStartDate: form.advertisingStartDate,
      applicationOpenDate: form.applicationOpenDate,
      applicationCloseDate: form.applicationCloseDate,
      trainingStartDate: form.trainingStartDate,
      targetIntake: Number(form.targetIntake),
      notes: form.notes,
    });
    if (!result.ok) {
      setError(result.error ?? "Failed.");
      setLoading(false);
    } else {
      setLoading(false);
      setOpen(false);
      startTransition(() => router.refresh());
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-teal-300 bg-white px-3 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50 transition-colors"
      >
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-gray-900">
              {label} window
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {live
                ? "Push the close date forward and raise the target intake. Earlier dates are locked."
                : "Edit any field for this window."}
            </p>
            {w.state === "CLOSED" && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Saving will reopen this closed window (set it back to Open).
              </p>
            )}

            <div className="mt-4 space-y-3">
              <DateField
                label="Advertising start"
                value={form.advertisingStartDate}
                onChange={(v) => set("advertisingStartDate", v)}
                disabled={live}
              />
              <DateField
                label="Applications open"
                value={form.applicationOpenDate}
                onChange={(v) => set("applicationOpenDate", v)}
                disabled={live}
              />
              <DateField
                label="Applications close"
                value={form.applicationCloseDate}
                onChange={(v) => set("applicationCloseDate", v)}
                min={live ? todayStr : undefined}
              />
              <DateField
                label="Training start"
                value={form.trainingStartDate}
                onChange={(v) => set("trainingStartDate", v)}
              />

              <div>
                <label className="text-xs font-medium text-gray-600">
                  Target intake
                </label>
                <input
                  type="number"
                  min={live ? w.targetIntake : 1}
                  value={form.targetIntake}
                  onChange={(e) => set("targetIntake", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">
                  Notes <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
                disabled={loading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {loading ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DateField({
  label,
  value,
  onChange,
  disabled,
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  min?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <input
        type="date"
        value={value}
        min={min}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  );
}
