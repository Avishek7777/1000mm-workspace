"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createProgramAction } from "@/actions/programs";

const CATEGORIES = [
  { value: "SPIRITUAL", label: "Spiritual" },
  { value: "PHYSICAL", label: "Physical" },
  { value: "MENTAL", label: "Mental" },
  { value: "SOCIAL", label: "Social" },
];

const initialState = { ok: false };

export default function NewProgramPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    createProgramAction,
    initialState,
  );
  const [showSuccess, setShowSuccess] = useState(false);

  // Controlled field state — preserved on error
  const [fields, setFields] = useState({
    code: "",
    category: "",
    title: "",
    titleBangla: "",
    startDate: "",
    endDate: "",
    location: "",
    locationBangla: "",
    targetIntake: "",
    maxIntake: "",
    summary: "",
    summaryBangla: "",
  });

  function set(key: keyof typeof fields) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => setFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  useEffect(() => {
    if (state.ok && state.programId) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        router.push("/dashboard/director/programs");
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [state.ok, state.programId]);

  const e = state.fieldErrors ?? {};

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Success popup */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="rounded-2xl border border-green-200 bg-white p-8 shadow-xl text-center max-w-sm mx-4">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-7 w-7 text-green-600"
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
            <h2 className="text-lg font-semibold text-gray-900">
              Program Created!
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Redirecting to programs…
            </p>
          </div>
        </div>
      )}

      <div>
        <Link
          href="/dashboard/director/programs"
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ← Back to Programs
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">
          New Training Program
        </h1>
      </div>

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form
        action={action}
        className="rounded-xl border border-gray-200 bg-white p-6 space-y-5"
      >
        {/* Code + Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Program Code <span className="text-red-500">*</span>
            </label>
            <input
              name="code"
              value={fields.code}
              onChange={(e) =>
                setFields((prev) => ({
                  ...prev,
                  code: e.target.value.toUpperCase(),
                }))
              }
              placeholder="e.g. 1000MM-2026"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
            <p className="mt-0.5 text-[10px] text-gray-400">
              Uppercase letters, numbers, hyphens only.
            </p>
            {e.code && <p className="mt-0.5 text-xs text-red-500">{e.code}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={fields.category}
              onChange={set("category")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            >
              <option value="">Select</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {e.category && (
              <p className="mt-0.5 text-xs text-red-500">{e.category}</p>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Title (English) <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            value={fields.title}
            onChange={set("title")}
            placeholder="Full program title"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          {e.title && <p className="mt-0.5 text-xs text-red-500">{e.title}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Title (Bangla)
          </label>
          <input
            name="titleBangla"
            value={fields.titleBangla}
            onChange={set("titleBangla")}
            placeholder="বাংলায় শিরোনাম"
            dir="auto"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={fields.startDate}
              onChange={set("startDate")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
            {e.startDate && (
              <p className="mt-0.5 text-xs text-red-500">{e.startDate}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="endDate"
              value={fields.endDate}
              onChange={set("endDate")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
            {e.endDate && (
              <p className="mt-0.5 text-xs text-red-500">{e.endDate}</p>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Location
            </label>
            <input
              name="location"
              value={fields.location}
              onChange={set("location")}
              placeholder="e.g. Dhaka, Bangladesh"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Location (Bangla)
            </label>
            <input
              name="locationBangla"
              value={fields.locationBangla}
              onChange={set("locationBangla")}
              placeholder="ঢাকা, বাংলাদেশ"
              dir="auto"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Intake */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Target Intake <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="targetIntake"
              value={fields.targetIntake}
              onChange={set("targetIntake")}
              placeholder="e.g. 100"
              min={1}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
            {e.targetIntake && (
              <p className="mt-0.5 text-xs text-red-500">{e.targetIntake}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Max Intake <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="number"
              name="maxIntake"
              value={fields.maxIntake}
              onChange={set("maxIntake")}
              placeholder="Hard cap"
              min={1}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Summary */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Summary
          </label>
          <textarea
            name="summary"
            value={fields.summary}
            onChange={set("summary")}
            rows={3}
            placeholder="Brief description of the program..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Summary (Bangla)
          </label>
          <textarea
            name="summaryBangla"
            value={fields.summaryBangla}
            onChange={set("summaryBangla")}
            rows={3}
            dir="auto"
            placeholder="বাংলায় সারসংক্ষেপ..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Link
            href="/dashboard/director/programs"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending || showSuccess}
            className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
          >
            {pending ? "Creating…" : "Create Program"}
          </button>
        </div>
      </form>
    </div>
  );
}
