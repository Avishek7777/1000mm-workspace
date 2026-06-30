"use client";

import { useActionState, useRef, useState } from "react";
import { createResource } from "@/actions/resources";
import { FileUploadInput } from "@/app/dashboard/_components/FileUploadInput";
import { Plus, X } from "lucide-react";

type Props = { programId: string };

export function UploadResourceForm({ programId }: Props) {
  const [open, setOpen] = useState(false);
  const [state, dispatch, pending] = useActionState(createResource, null);
  const isFirstRender = useRef(true);
  const [fileKey, setFileKey] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileMime, setFileMime] = useState("");
  const [fileSize, setFileSize] = useState(0);

  if (state?.ok && !isFirstRender.current) {
    setOpen(false);
    setFileKey(""); setFileName(""); setFileMime(""); setFileSize(0);
    isFirstRender.current = true;
  }
  if (state !== null) isFirstRender.current = false;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Upload Resource
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-violet-800">Upload Resource</p>
        <button type="button" onClick={() => setOpen(false)}><X className="h-4 w-4 text-gray-400" /></button>
      </div>
      <form action={dispatch} className="space-y-3">
        <input type="hidden" name="programId" value={programId} />
        <input type="hidden" name="fileStorageKey" value={fileKey} />
        <input type="hidden" name="fileName" value={fileName} />
        <input type="hidden" name="mimeType" value={fileMime} />
        <input type="hidden" name="fileSizeBytes" value={fileSize} />

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
          <input
            name="title"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
            placeholder="Resource title"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <input
            name="description"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400"
            placeholder="Optional short description"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">File <span className="text-red-500">*</span></label>
          <FileUploadInput
            name="file"
            folder="resources"
            label="Choose file to upload"
            onUploaded={(key, name, size, mime) => { setFileKey(key); setFileName(name); setFileSize(size); setFileMime(mime); }}
            onCleared={() => { setFileKey(""); setFileName(""); setFileSize(0); setFileMime(""); }}
          />
        </div>

        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            type="submit"
            disabled={pending || !fileKey}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-60 transition-colors"
          >
            {pending ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>
    </div>
  );
}
