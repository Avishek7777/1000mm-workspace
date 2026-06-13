"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  openLmdReportWindowAction,
  closeLmdReportWindowAction,
} from "@/actions/lmdReports";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export function WindowControls({
  openWindow,
}: {
  openWindow: { id: string; reportMonth: number; reportYear: number } | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();
  const now = new Date();

  const [state, action, pending] = useActionState(openLmdReportWindowAction, {
    ok: false,
  });
  const [closing, setClosing] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state.ok) {
      setShowForm(false);
      startTransition(() => router.refresh());
    }
  }, [state.ok]);

  async function handleClose() {
    if (!openWindow) return;
    setClosing(true);
    await closeLmdReportWindowAction(openWindow.id);
    startTransition(() => router.refresh());
    setClosing(false);
  }

  return (
    <div className="flex items-center gap-2">
      {openWindow ? (
        <button
          onClick={handleClose}
          disabled={closing}
          className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-60 transition-colors"
        >
          {closing ? "Closing…" : "Close Window"}
        </button>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          + Open Report Window
        </button>
      )}

      {/* Open window modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Open Reporting Window
              </h2>
              <button
                onClick={() => setShowForm(false)}
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
              <p className="text-xs text-gray-500">
                Opening a window allows all LMDs to submit their monthly report.
                Only one window can be open at a time.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Month <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="reportMonth"
                    defaultValue={now.getMonth() + 1}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  {state.fieldErrors?.reportMonth && (
                    <p className="mt-0.5 text-xs text-red-500">
                      {state.fieldErrors.reportMonth}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="reportYear"
                    defaultValue={now.getFullYear()}
                    min={2020}
                    max={2100}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                  />
                  {state.fieldErrors?.reportYear && (
                    <p className="mt-0.5 text-xs text-red-500">
                      {state.fieldErrors.reportYear}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Note to LMDs (optional)
                </label>
                <input
                  type="text"
                  name="notes"
                  placeholder="Any instructions for this reporting period…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
                >
                  {pending ? "Opening…" : "Open Window"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
