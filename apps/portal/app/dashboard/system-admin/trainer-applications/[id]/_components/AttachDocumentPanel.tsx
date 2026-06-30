"use client";

import { useState, useRef, useActionState } from "react";
import { attachTrainerDocumentAction, deleteTrainerAttachmentAction } from "@/actions/trainerApplications";

type Attachment = {
  id: string;
  fileName: string;
  label: string | null;
  storageKey: string;
  uploadedAt: Date;
  uploadedBy: { fullName: string };
};

export function AttachDocumentPanel({
  applicationId,
  attachments,
}: {
  applicationId: string;
  attachments: Attachment[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLInputElement>(null);

  const [attachState, attachAction, attachPending] = useActionState(attachTrainerDocumentAction, { ok: false });
  const [, deleteAction] = useActionState(deleteTrainerAttachmentAction, { ok: false });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "trainer_attachments");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      const actionFd = new FormData();
      actionFd.append("applicationId", applicationId);
      actionFd.append("storageKey", data.storageKey);
      actionFd.append("fileName", data.fileName);
      actionFd.append("label", labelRef.current?.value ?? "");
      await attachAction(actionFd);
      setShowForm(false);
      if (fileRef.current)  fileRef.current.value  = "";
      if (labelRef.current) labelRef.current.value = "";
    } catch (err: any) {
      setUploadError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Admin Attachments</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Attach Document
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Label (optional)</label>
            <input
              ref={labelRef}
              type="text"
              placeholder="e.g. Supporting Certificate, ID Copy…"
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">File <span className="text-red-500">*</span></label>
            <input
              ref={fileRef}
              type="file"
              required
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-teal-50 file:px-2 file:py-0.5 file:text-xs file:font-medium file:text-teal-700"
            />
            <p className="mt-1 text-[10px] text-gray-400">PDF, Word, Excel, image — max 20 MB</p>
          </div>

          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
          {attachState.ok === false && attachState.error && <p className="text-xs text-red-500">{attachState.error}</p>}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={uploading || attachPending}
              className="rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
            >
              {uploading ? "Uploading…" : attachPending ? "Saving…" : "Attach"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setUploadError(null); }}
              className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Attachment list */}
      {attachments.length === 0 ? (
        <p className="text-xs text-gray-400">No documents attached yet.</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
              <div className="flex items-start gap-2.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0 text-gray-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
                <div>
                  {a.label && <p className="text-xs font-medium text-gray-700">{a.label}</p>}
                  <p className="text-xs text-gray-500">{a.fileName}</p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(a.uploadedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}{a.uploadedBy.fullName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/uploads/${a.storageKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  View
                </a>
                <form action={deleteAction}>
                  <input type="hidden" name="attachmentId"  value={a.id} />
                  <input type="hidden" name="applicationId" value={applicationId} />
                  <button
                    type="submit"
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    onClick={(e) => { if (!confirm("Remove this attachment?")) e.preventDefault(); }}
                  >
                    Remove
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
