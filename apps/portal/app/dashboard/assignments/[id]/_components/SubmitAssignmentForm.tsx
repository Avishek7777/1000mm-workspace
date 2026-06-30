"use client";

import { useActionState, useRef, useState } from "react";
import { submitAssignment } from "@/actions/assignments";
import { FileUploadInput } from "@/app/dashboard/_components/FileUploadInput";

type Existing = { notes: string | null; fileStorageKey: string | null; fileName: string | null };
type Props = { assignmentId: string; existing: Existing | null };

export function SubmitAssignmentForm({ assignmentId, existing }: Props) {
  const [state, dispatch, pending] = useActionState(submitAssignment, null);
  const isFirstRender = useRef(true);
  const [fileKey, setFileKey] = useState(existing?.fileStorageKey ?? "");
  const [fileName, setFileName] = useState(existing?.fileName ?? "");

  if (state !== null) isFirstRender.current = false;
  const success = state?.ok && !isFirstRender.current;

  return (
    <form action={dispatch} className="space-y-4">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="fileStorageKey" value={fileKey} />
      <input type="hidden" name="fileName" value={fileName} />

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Written Response</label>
        <textarea
          name="notes"
          rows={5}
          defaultValue={existing?.notes ?? ""}
          placeholder="Write your response here…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none"
        />
        <p className="mt-0.5 text-[10px] text-gray-400">You can submit text, a file attachment, or both.</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {existing?.fileStorageKey ? "Replace attachment" : "Attach file (optional)"}
        </label>
        <FileUploadInput
          name="file"
          folder="submissions"
          label="Attach your work"
          onUploaded={(key, name) => { setFileKey(key); setFileName(name); }}
          onCleared={() => { setFileKey(""); setFileName(""); }}
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {success && <p className="text-sm text-teal-600 font-medium">Submitted successfully.</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
      >
        {pending ? "Submitting…" : existing ? "Update Submission" : "Submit Assignment"}
      </button>
    </form>
  );
}
