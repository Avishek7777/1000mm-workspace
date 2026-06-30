"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateProfileAction } from "@/actions/profile";

const INIT = { ok: false as const, error: "" };

export function EditProfileForm({
  currentName,
  currentNameBangla,
  currentPhone,
}: {
  currentName: string;
  currentNameBangla?: string | null;
  currentPhone?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateProfileAction, INIT);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    if (state.ok) setOpen(false);
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        Edit Details
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Edit Details</h3>
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.error}
        </p>
      )}
      <form action={action} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            name="fullName"
            defaultValue={currentName}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">নাম (Bangla)</label>
          <input
            name="fullNameBangla"
            defaultValue={currentNameBangla ?? ""}
            dir="auto"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Phone</label>
          <input
            name="phone"
            defaultValue={currentPhone ?? ""}
            type="tel"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
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
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
