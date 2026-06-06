"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAnnouncementAction } from "@/actions/announcements";

const initialState = { ok: false };

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    createAnnouncementAction,
    initialState,
  );
  const [showSuccess, setShowSuccess] = useState(false);

  // Controlled fields
  const [fields, setFields] = useState({
    title: "",
    body: "",
    attachmentUrl: "",
    expiresAt: "",
  });
  const [publishNow, setPublishNow] = useState(false);

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  useEffect(() => {
    if (state.ok) {
      setShowSuccess(true);
      setTimeout(() => router.push("/dashboard/announcements"), 1500);
    }
  }, [state.ok]);

  const e = state.fieldErrors ?? {};

  return (
    <div className="mx-auto max-w-2xl space-y-6">
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
              {publishNow ? "Announcement Published!" : "Draft Saved!"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">Redirecting…</p>
          </div>
        </div>
      )}

      <div>
        <Link
          href="/dashboard/announcements"
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ← Back to Announcements
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">
          New Announcement
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
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            value={fields.title}
            onChange={set("title")}
            placeholder="Announcement title"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          {e.title && <p className="mt-0.5 text-xs text-red-500">{e.title}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Body <span className="text-red-500">*</span>
          </label>
          <textarea
            name="body"
            value={fields.body}
            onChange={set("body")}
            rows={6}
            placeholder="Write the announcement content here…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          <p className="mt-0.5 text-[10px] text-gray-400">
            {fields.body.length} / 5000
          </p>
          {e.body && <p className="mt-0.5 text-xs text-red-500">{e.body}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Attachment URL <span className="text-gray-400">(optional)</span>
          </label>
          <input
            name="attachmentUrl"
            type="url"
            value={fields.attachmentUrl}
            onChange={set("attachmentUrl")}
            placeholder="https://example.com/document.pdf"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          {e.attachmentUrl && (
            <p className="mt-0.5 text-xs text-red-500">{e.attachmentUrl}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Expiry Date{" "}
            <span className="text-gray-400">
              (optional — announcement hidden after this date)
            </span>
          </label>
          <input
            name="expiresAt"
            type="date"
            value={fields.expiresAt}
            onChange={set("expiresAt")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="publishNow"
              value="on"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-teal-600"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">
                Publish immediately
              </p>
              <p className="text-xs text-gray-500">
                All users will be notified. Leave unchecked to save as draft.
              </p>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Link
            href="/dashboard/announcements"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending || showSuccess}
            className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
          >
            {pending ? "Saving…" : publishNow ? "Publish Now" : "Save as Draft"}
          </button>
        </div>
      </form>
    </div>
  );
}
