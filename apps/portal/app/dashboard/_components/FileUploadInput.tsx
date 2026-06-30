"use client";

import { useRef, useState } from "react";
import { Paperclip, X, Loader2 } from "lucide-react";

type Props = {
  name: string;
  folder: string;
  onUploaded: (key: string, fileName: string, size: number, mime: string) => void;
  onCleared: () => void;
  accept?: string;
  label?: string;
};

export function FileUploadInput({ name, folder, onUploaded, onCleared, accept, label = "Attach file" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Upload failed");
        return;
      }
      const data = await res.json();
      setUploadedName(file.name);
      onUploaded(data.storageKey, data.fileName, data.fileSizeBytes, data.mimeType);
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setUploadedName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onCleared();
  }

  return (
    <div className="space-y-1">
      {uploadedName ? (
        <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-800">
          <Paperclip className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="flex-1 truncate">{uploadedName}</span>
          <button type="button" onClick={clear} className="flex-shrink-0 text-teal-600 hover:text-red-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors">
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Paperclip className="h-3.5 w-3.5" />
          )}
          <span>{uploading ? "Uploading…" : label}</span>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept={accept ?? ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"}
            onChange={handleChange}
            disabled={uploading}
          />
        </label>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
