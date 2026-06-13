"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitComplaintAction, type ActionResult } from "@/actions/complaints";

const CATEGORIES = [
  {
    value: "GRIEVANCE",
    label: "Grievance",
    desc: "A formal complaint about treatment or policy",
  },
  {
    value: "SUGGESTION",
    label: "Suggestion",
    desc: "An idea to improve the programme",
  },
  {
    value: "GENERAL_FEEDBACK",
    label: "General Feedback",
    desc: "General comments or observations",
  },
];

const initialState: ActionResult = { ok: false };

export default function NewComplaintPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    submitComplaintAction,
    initialState,
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [revealIdentity, setRevealIdentity] = useState(false);

  const [fields, setFields] = useState({
    category: "",
    subject: "",
    description: "",
  });

  function set(key: keyof typeof fields) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => setFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  useEffect(() => {
    if (state.ok) {
      setShowSuccess(true);
      setTimeout(() => router.push("/dashboard/complaints"), 1800);
    }
  }, [state.ok]);

  const e = state.fieldErrors ?? {};

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Success popup */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="rounded-2xl border border-teal-200 bg-white p-8 shadow-xl text-center max-w-sm mx-4">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100">
              <svg
                className="h-7 w-7 text-teal-600"
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
              Complaint Submitted
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {revealIdentity
                ? "Your complaint has been received. You'll be notified when there's a response."
                : "Your anonymous complaint has been received."}
            </p>
          </div>
        </div>
      )}

      <div>
        <Link
          href="/dashboard/complaints"
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ← Back to Complaints
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">
          Submit a Complaint
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Anonymous by default. Your complaint goes to your Local Mission
          Director and the Union Director.
        </p>
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
        {/* Category */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-700">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  fields.category === cat.value
                    ? "border-teal-400 bg-teal-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.value}
                  checked={fields.category === cat.value}
                  onChange={set("category")}
                  className="mt-0.5 h-4 w-4 text-teal-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {cat.label}
                  </p>
                  <p className="text-xs text-gray-500">{cat.desc}</p>
                </div>
              </label>
            ))}
          </div>
          {e.category && (
            <p className="mt-1 text-xs text-red-500">{e.category}</p>
          )}
        </div>

        {/* Subject */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            name="subject"
            value={fields.subject}
            onChange={set("subject")}
            placeholder="Brief summary of your complaint"
            maxLength={100}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          <p className="mt-0.5 text-[10px] text-gray-400">
            {fields.subject.length}/100
          </p>
          {e.subject && (
            <p className="mt-0.5 text-xs text-red-500">{e.subject}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={fields.description}
            onChange={set("description")}
            rows={5}
            placeholder="Describe your complaint or suggestion in detail…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          {e.description && (
            <p className="mt-0.5 text-xs text-red-500">{e.description}</p>
          )}
        </div>

        {/* Identity */}
        <div
          className={`rounded-lg border p-4 transition-colors ${revealIdentity ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}`}
        >
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="revealIdentity"
              value="on"
              checked={revealIdentity}
              onChange={(e) => setRevealIdentity(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">
                Reveal my identity
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {revealIdentity
                  ? "Your name will be visible to the recipients. You can track this complaint and receive a response."
                  : "Your complaint will be submitted anonymously. No personal information will be stored or shared. You will not be able to track it."}
              </p>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Link
            href="/dashboard/complaints"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending || showSuccess}
            className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
          >
            {pending
              ? "Submitting…"
              : revealIdentity
                ? "Submit with Identity"
                : "Submit Anonymously"}
          </button>
        </div>
      </form>
    </div>
  );
}
