"use client";

import { useActionState, useEffect, useState } from "react";
import { saveCertificateConfigAction } from "@/actions/settings";
import type { ActionResult } from "@/actions/settings";

type Defaults = {
  directorName: string;
  directorTitle: string;
  presidentName: string;
  presidentTitle: string;
};

// Signature upload slot — uploads to /api/upload and reports the storage key.
function SignatureUploader({
  label,
  fileKey,
  initial,
  onChange,
}: {
  label: string;
  fileKey: string;
  initial: string;
  onChange: (storageKey: string) => void;
}) {
  const [storageKey, setStorageKey] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "certificate-signatures");
      fd.append("fileName", fileKey);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.storageKey) {
        setStorageKey(data.storageKey);
        onChange(data.storageKey);
      } else {
        setError(data.error ?? "Upload failed.");
      }
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  // ?v= busts the cache when a signature is replaced (same file name).
  const previewSrc = storageKey ? `/api/uploads/${storageKey}?v=${Date.now()}` : "";

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-700">
        {label} Signature{" "}
        <span className="font-normal text-gray-400">(PNG, transparent)</span>
      </label>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-32 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt={`${label} signature`}
              className="max-h-14 max-w-28 object-contain"
              onError={(ev) => (ev.currentTarget.style.display = "none")}
            />
          ) : (
            <span className="text-[10px] text-gray-400">No signature</span>
          )}
        </div>
        <div>
          <label className="inline-flex cursor-pointer items-center rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-600 hover:border-teal-400 hover:text-teal-600">
            {uploading ? "Uploading…" : storageKey ? "Replace" : "Upload"}
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFile}
              className="hidden"
              disabled={uploading}
            />
          </label>
          {storageKey && (
            <button
              type="button"
              onClick={() => {
                setStorageKey("");
                onChange("");
              }}
              className="ml-2 text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          )}
          {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export function CertificateConfigForm({
  directorName,
  directorSignature,
  presidentName,
  presidentSignature,
  batchLabel,
  defaults,
}: {
  directorName: string;
  directorSignature: string;
  presidentName: string;
  presidentSignature: string;
  batchLabel: string;
  defaults: Defaults;
}) {
  const [dirSig, setDirSig] = useState(directorSignature);
  const [presSig, setPresSig] = useState(presidentSignature);
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    saveCertificateConfigAction,
    { ok: false },
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(t);
    }
  }, [state]);

  return (
    <form action={action} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
      <input type="hidden" name="directorSignature" value={dirSig} />
      <input type="hidden" name="presidentSignature" value={presSig} />

      {/* Batch */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900">Batch Number</p>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Printed as &ldquo;… BATCH&rdquo; on the certificate
          </label>
          <input
            name="batchLabel"
            defaultValue={batchLabel}
            placeholder="e.g. 28 or 28th"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          <p className="mt-1 text-[11px] text-gray-400">
            Set this before issuing certificates for a deployment. Leave blank
            to use each program&apos;s own batch number.
          </p>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Director */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900">
          Director{" "}
          <span className="text-xs font-normal text-gray-400">
            ({defaults.directorTitle})
          </span>
        </p>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Name</label>
          <input
            name="directorName"
            defaultValue={directorName}
            placeholder={defaults.directorName}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <SignatureUploader
          label="Director"
          fileKey="director"
          initial={directorSignature}
          onChange={setDirSig}
        />
      </div>

      <div className="border-t border-gray-100" />

      {/* President */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900">
          President{" "}
          <span className="text-xs font-normal text-gray-400">
            ({defaults.presidentTitle})
          </span>
        </p>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Name</label>
          <input
            name="presidentName"
            defaultValue={presidentName}
            placeholder={defaults.presidentName}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <SignatureUploader
          label="President"
          fileKey="president"
          initial={presidentSignature}
          onChange={setPresSig}
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        {saved && <span className="text-xs text-teal-700">Saved.</span>}
        {state.error && <span className="text-xs text-red-600">{state.error}</span>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
        >
          {pending ? "Saving…" : "Save Config"}
        </button>
      </div>
    </form>
  );
}
