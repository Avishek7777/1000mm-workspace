"use client";

import { useState, useActionState } from "react";
import { saveTrainerLetterAction } from "@/actions/trainerApplications";

type LetterType = "invitation" | "recommendation";

type Props = {
  applicationId: string;
  letterType: LetterType;
  defaultBody: string;
  requiredDoc1?: string | null;
  requiredDoc2?: string | null;
  requiredDoc3?: string | null;
  requiredDoc4?: string | null;
};

export function EditLetterForm({
  applicationId,
  letterType,
  defaultBody,
  requiredDoc1,
  requiredDoc2,
  requiredDoc3,
  requiredDoc4,
}: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(saveTrainerLetterAction, { ok: false });

  const isInvitation = letterType === "invitation";

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
      >
        Edit letter
      </button>
    );
  }

  return (
    <form action={action} className="mt-3 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="letterType" value={letterType} />

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Letter body
        </label>
        <textarea
          name="body"
          rows={8}
          defaultValue={defaultBody}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 resize-y font-mono"
        />
      </div>

      {isInvitation && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">
            Necessary Documents (shown in letter)
          </label>
          {[1, 2, 3, 4].map((n) => (
            <input
              key={n}
              type="text"
              name={`doc${n}`}
              defaultValue={
                n === 1 ? (requiredDoc1 ?? "") :
                n === 2 ? (requiredDoc2 ?? "") :
                n === 3 ? (requiredDoc3 ?? "") :
                (requiredDoc4 ?? "")
              }
              placeholder={`Document ${n} (e.g. Valid Passport)`}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          ))}
        </div>
      )}

      {state.error && (
        <p className="text-xs text-red-500">{state.error}</p>
      )}
      {state.ok && (
        <p className="text-xs text-teal-600">Saved. Download the letter to see the updated version.</p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
