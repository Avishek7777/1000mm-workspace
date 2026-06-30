// apps/portal/app/dashboard/system-admin/urgent-reports/new/page.tsx
"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Upload, X, Loader2, FileText } from "lucide-react";
import { issueUrgentReportAction } from "@/actions/urgentReports";

const MAX_ATTACHMENTS = 5;

export default function NewUrgentReportPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<(File | null)[]>(
    Array(MAX_ATTACHMENTS).fill(null),
  );
  const [error, setError] = useState("");
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const ref4 = useRef<HTMLInputElement>(null);
  const inputRefs = [ref0, ref1, ref2, ref3, ref4];

  function handleFile(index: number, file: File | null) {
    setFiles((prev) => {
      const n = [...prev];
      n[index] = file;
      return n;
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    files.forEach((file, i) => {
      if (file) fd.set(`attachment${i + 1}`, file);
    });
    startTransition(async () => {
      try {
        const result = await issueUrgentReportAction(fd);
        if (result.ok) {
          router.push("/dashboard/system-admin/urgent-reports");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Issue Urgent Report
          </h1>
          <p className="text-sm text-gray-500">
            All active missionaries will be notified and must acknowledge.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            type="text"
            required
            placeholder="e.g. Security Protocol Update — Immediate Action Required"
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>

        {/* Body */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Body <span className="text-red-500">*</span>
          </label>
          <textarea
            name="body"
            required
            rows={8}
            placeholder="Write the full report content here. Be clear and specific about what action missionaries need to take."
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200 resize-y"
          />
        </div>

        {/* Attachments */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Attachments{" "}
            <span className="text-gray-400 font-normal">
              (up to 5, max 10 MB each)
            </span>
          </label>
          <div className="space-y-2">
            {Array.from({ length: MAX_ATTACHMENTS }).map((_, i) => (
              <div key={i}>
                <input
                  ref={inputRefs[i]}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={(e) => handleFile(i, e.target.files?.[0] ?? null)}
                />
                {files[i] ? (
                  <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5">
                    <FileText className="h-4 w-4 flex-shrink-0 text-green-600" />
                    <span className="flex-1 truncate text-sm text-green-700">
                      {files[i]!.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleFile(i, null);
                        if (inputRefs[i].current)
                          inputRefs[i].current!.value = "";
                      }}
                      className="flex-shrink-0 text-green-500 hover:text-green-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => inputRefs[i].current?.click()}
                    className="flex w-full items-center gap-3 rounded-lg border border-dashed border-gray-200 px-4 py-2.5 text-sm text-gray-400 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Attachment {i + 1} — click to upload
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Warning banner */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Note:</strong> Once issued, this report will immediately
          notify all active missionaries and appear in their dashboard until
          they acknowledge it.
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Issuing…
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Issue Report
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
