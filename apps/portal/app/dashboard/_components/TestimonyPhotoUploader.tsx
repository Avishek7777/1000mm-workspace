"use client";

import { useState } from "react";

/**
 * Photo picker for the testimony admin forms. Shared because the testimony
 * editor exists twice — under /dashboard/settings and /dashboard/system-admin.
 *
 * Uploads to /api/upload without an explicit fileName, so each photo gets a
 * random storage key: testimonies have no slug to build a stable path from,
 * and a fresh key also sidesteps browser caching when a photo is replaced.
 * Emits a hidden `imageUrl` field; empty string means "no photo", which the
 * server action normalises to null so the website shows initials instead.
 */
export function TestimonyPhotoUploader({
  defaultValue,
  error,
}: {
  defaultValue?: string | null;
  error?: string;
}) {
  const [preview, setPreview] = useState<string>(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "testimonies");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.storageKey) setPreview(`/api/uploads/${data.storageKey}`);
      else setUploadError(data.error ?? "Upload failed");
    } catch {
      setUploadError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-700">Photo</label>
      <input type="hidden" name="imageUrl" value={preview} />
      <div className="flex items-start gap-3">
        {preview ? (
          <div className="relative flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Testimony photo"
              className="h-16 w-16 rounded-2xl border border-gray-200 bg-gray-50 object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <button
              type="button"
              onClick={() => setPreview("")}
              title="Remove photo"
              className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 transition-colors hover:border-teal-400 hover:text-teal-600">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {uploading ? "Uploading…" : preview ? "Replace photo" : "Upload photo"}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
          </label>
          <input
            type="text"
            placeholder="Optional — or paste an image URL"
            value={preview}
            onChange={(e) => setPreview(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1 font-mono text-xs outline-none focus:border-teal-500"
          />
          <p className="mt-1 text-[11px] text-gray-400">
            Leave empty to show the person&rsquo;s initials on a coloured tile instead.
          </p>
          {(uploadError || error) && (
            <p className="mt-0.5 text-xs text-red-500">{uploadError ?? error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
