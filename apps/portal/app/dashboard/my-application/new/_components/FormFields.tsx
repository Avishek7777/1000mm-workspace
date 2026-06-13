"use client";

import { ReactNode, useState } from "react";

// ── Field wrapper ──────────────────────────────────────────────────────────────

export function Field({
  label,
  error,
  required,
  children,
  hint,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Text input ─────────────────────────────────────────────────────────────────

export function Input({
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      {...props}
      className={`rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500/30 ${
        error
          ? "border-red-400 bg-red-50 focus:border-red-400"
          : "border-gray-300 bg-white focus:border-blue-500"
      } disabled:bg-gray-50 disabled:text-gray-400 ${props.className ?? ""}`}
    />
  );
}

// ── Select ─────────────────────────────────────────────────────────────────────

export function Select({
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  children: ReactNode;
}) {
  return (
    <select
      {...props}
      className={`rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500/30 ${
        error
          ? "border-red-400 bg-red-50 focus:border-red-400"
          : "border-gray-300 bg-white focus:border-blue-500"
      } disabled:bg-gray-50 disabled:text-gray-400 ${props.className ?? ""}`}
    >
      {children}
    </select>
  );
}

// ── Textarea ───────────────────────────────────────────────────────────────────

export function Textarea({
  error,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <textarea
      {...props}
      className={`rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500/30 ${
        error
          ? "border-red-400 bg-red-50 focus:border-red-400"
          : "border-gray-300 bg-white focus:border-blue-500"
      } ${props.className ?? ""}`}
    />
  );
}

// ── File input ─────────────────────────────────────────────────────────────────
// existingFile: { fileName } — shown when a file was previously uploaded for this field.
// When the user picks a new file it replaces the indicator.

export function FileInput({
  error,
  accept,
  hint,
  existingFile,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  hint?: string;
  existingFile?: { fileName: string } | null;
}) {
  const [newFileName, setNewFileName] = useState<string | null>(null);

  // What to show in the upload zone
  const uploaded = newFileName ?? null;
  const existing = !newFileName && existingFile ? existingFile.fileName : null;

  return (
    <div>
      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors hover:bg-gray-50 ${
          error
            ? "border-red-400 bg-red-50"
            : existing
              ? "border-green-400 bg-green-50"
              : "border-gray-300"
        }`}
      >
        {existing ? (
          // Previously uploaded — show green indicator
          <>
            <svg
              className="mb-2 h-7 w-7 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="max-w-[200px] truncate text-sm font-medium text-green-700">
              {existing}
            </span>
            <span className="mt-0.5 text-xs text-green-600">
              Already uploaded — click to replace
            </span>
          </>
        ) : uploaded ? (
          // Newly picked file this session
          <>
            <svg
              className="mb-2 h-7 w-7 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="max-w-[200px] truncate text-sm font-medium text-blue-700">
              {uploaded}
            </span>
            <span className="mt-0.5 text-xs text-blue-500">
              Click to change
            </span>
          </>
        ) : (
          // Nothing uploaded yet
          <>
            <svg
              className="mb-2 h-7 w-7 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span className="text-sm font-medium text-gray-600">
              Click to upload
            </span>
            {hint && (
              <span className="mt-0.5 text-xs text-gray-400">{hint}</span>
            )}
          </>
        )}

        <input
          {...props}
          type="file"
          accept={accept}
          className="file-input-hidden"
          onChange={(e) => {
            setNewFileName(e.target.files?.[0]?.name ?? null);
            props.onChange?.(e);
          }}
        />
      </label>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Section heading ────────────────────────────────────────────────────────────

export function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 border-b border-gray-100 pb-3">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {description && (
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}

// ── Form card ──────────────────────────────────────────────────────────────────

export function FormCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {children}
    </div>
  );
}

// ── Navigation buttons ─────────────────────────────────────────────────────────

export function FormNav({
  onBack,
  nextLabel = "Save & Continue",
  loading,
  isFirst,
  isLast,
}: {
  onBack?: () => void;
  nextLabel?: string;
  loading?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <div
      className={`mt-8 flex gap-3 ${isFirst ? "justify-end" : "justify-between"}`}
    >
      {!isFirst && (
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          ← Back
        </button>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Saving…" : nextLabel}
      </button>
    </div>
  );
}
