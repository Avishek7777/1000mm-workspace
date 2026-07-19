"use client";

import { useState, useTransition } from "react";
import {
  revokeCertificateAction,
  restoreCertificateAction,
} from "@/actions/certificates";

const CertIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

export function CertificateButton({
  enrollmentId,
  issued,
  revoked,
  canRevoke,
}: {
  enrollmentId: string;
  issued: boolean;
  revoked: boolean;
  canRevoke: boolean;
}) {
  const base = `/api/certificates?enrollmentId=${enrollmentId}`;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRevoke() {
    const reason = window.prompt(
      "Revoke this certificate?\n\nIt will stop verifying publicly and can no longer be downloaded until restored.\n\nReason (optional):",
    );
    if (reason === null) return; // cancelled
    setError(null);
    startTransition(async () => {
      const res = await revokeCertificateAction(enrollmentId, reason);
      if (!res.ok) setError(res.error ?? "Failed to revoke.");
    });
  }

  function handleRestore() {
    if (!window.confirm("Restore this certificate? It will verify and download again.")) return;
    setError(null);
    startTransition(async () => {
      const res = await restoreCertificateAction(enrollmentId);
      if (!res.ok) setError(res.error ?? "Failed to restore.");
    });
  }

  if (revoked) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          Certificate Revoked
        </span>
        {canRevoke && (
          <button
            type="button"
            onClick={handleRestore}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {pending ? "Restoring…" : "Restore"}
          </button>
        )}
        {error && <span className="text-[11px] text-red-500">{error}</span>}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <a
        href={base}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-teal-300 bg-white px-4 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 transition-colors"
      >
        <CertIcon />
        {issued ? "Download Certificate" : "Issue & Download Certificate"}
      </a>
      {issued && (
        <a
          href={`${base}&reissue=1`}
          target="_blank"
          rel="noopener noreferrer"
          title="Regenerate with today's issue date and the latest signatories"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Reissue
        </a>
      )}
      {issued && canRevoke && (
        <button
          type="button"
          onClick={handleRevoke}
          disabled={pending}
          title="Invalidate this certificate — it stops verifying and downloading until restored"
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          {pending ? "Revoking…" : "Revoke"}
        </button>
      )}
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </div>
  );
}
