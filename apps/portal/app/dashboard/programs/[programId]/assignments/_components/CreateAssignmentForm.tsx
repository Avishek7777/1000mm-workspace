"use client";

import { useActionState, useRef, useState } from "react";
import { createAssignment } from "@/actions/assignments";
import { FileUploadInput } from "@/app/dashboard/_components/FileUploadInput";
import { Plus, X } from "lucide-react";

type Topic = { id: string; title: string };
type Props = { programId: string; topics: Topic[] };

export function CreateAssignmentForm({ programId, topics }: Props) {
  const [open, setOpen] = useState(false);
  const [state, dispatch, pending] = useActionState(createAssignment, null);
  const isFirstRender = useRef(true);
  const [fileKey, setFileKey] = useState("");
  const [fileName, setFileName] = useState("");

  if (state?.ok && !isFirstRender.current) {
    setOpen(false);
    setFileKey("");
    setFileName("");
    isFirstRender.current = true;
  }
  if (state !== null) isFirstRender.current = false;

  const singleTopic = topics.length === 1 ? topics[0] : null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={topics.length === 0}
        title={topics.length === 0 ? "You have no topic assigned for this program" : undefined}
        className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="h-4 w-4" />
        New Assignment
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-teal-800">New Assignment</p>
        <button type="button" onClick={() => setOpen(false)}><X className="h-4 w-4 text-gray-400" /></button>
      </div>
      <form action={dispatch} className="space-y-3">
        <input type="hidden" name="programId" value={programId} />
        <input type="hidden" name="fileStorageKey" value={fileKey} />
        <input type="hidden" name="fileName" value={fileName} />

        {/* Topic — hidden if only one, dropdown if multiple */}
        {singleTopic ? (
          <>
            <input type="hidden" name="topicId" value={singleTopic.id} />
            <div className="flex items-center gap-1.5 rounded-lg bg-violet-100 px-3 py-1.5">
              <span className="text-[10px] font-medium text-violet-500 uppercase tracking-wide">Topic</span>
              <span className="text-xs font-semibold text-violet-800">{singleTopic.title}</span>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Topic <span className="text-red-500">*</span>
            </label>
            <select
              name="topicId"
              required
              defaultValue=""
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
            >
              <option value="" disabled>Select your topic…</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
          <input
            name="title"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
            placeholder="Assignment title"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none"
            placeholder="Instructions for trainees…"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
          <input
            name="dueDate"
            type="date"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Attachment (optional)</label>
          <FileUploadInput
            name="file"
            folder="assignments"
            label="Attach assignment file"
            onUploaded={(key, name) => { setFileKey(key); setFileName(name); }}
            onCleared={() => { setFileKey(""); setFileName(""); }}
          />
        </div>

        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-60 transition-colors"
          >
            {pending ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
