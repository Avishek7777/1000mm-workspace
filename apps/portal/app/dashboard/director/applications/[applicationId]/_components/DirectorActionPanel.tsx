"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  acceptApplicationAction,
  rejectApplicationAction,
  returnToLmdAction,
} from "@/actions/director";
import type { ApplicationStatus } from "@1000mm/db";

type Props = {
  applicationId: string;
  status: ApplicationStatus;
  existingDirectorComment?: string | null;
  existingRejectionReason?: string | null;
  referenceNumber?: string | null;
  missionName?: string;
  programTitle?: string;
};

// ── Bio Data PDF view button ───────────────────────────────────────────────────

function BioDataPdfButton({
  applicationId,
  referenceNumber,
  missionName,
  programTitle,
}: {
  applicationId: string;
  referenceNumber?: string | null;
  missionName?: string;
  programTitle?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleView = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { BioDataPDF } =
        await import("@/app/dashboard/my-application/new/_components/BioDataPDF");
      const res = await fetch(`/api/application/${applicationId}/pdf-data`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const blob = await pdf(
        <BioDataPDF
          {...data}
          referenceNumber={referenceNumber ?? applicationId}
          submittedAt={data.submittedAt ?? new Date().toISOString()}
          logoUrl="/logos/1000mm-logo.png"
          sdaLogoUrl="/logos/sda-logo.png"
          missionName={missionName}
          programTitle={programTitle}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      setError("Failed to generate PDF.");
    } finally {
      setLoading(false);
    }
  }, [applicationId, referenceNumber, missionName, programTitle]);

  return (
    <div>
      <button
        onClick={handleView}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-60"
      >
        {loading ? (
          <>
            <svg
              className="h-3.5 w-3.5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Generating…
          </>
        ) : (
          <>
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View Applicant Bio Data PDF
          </>
        )}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Main DirectorActionPanel ───────────────────────────────────────────────────

export function DirectorActionPanel({
  applicationId,
  status,
  existingDirectorComment,
  existingRejectionReason,
  referenceNumber,
  missionName,
  programTitle,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active action: "accept" | "reject" | "return" | null
  const [activeForm, setActiveForm] = useState<
    "accept" | "reject" | "return" | null
  >(null);

  const [comment, setComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isActionable = ["UNDER_MAIN_DIRECTOR_REVIEW", "RECOMMENDED"].includes(
    status,
  );
  const isAccepted = status === "ACCEPTED";
  const isRejected = status === "REJECTED";
  const isReturnedToLmd = status === "RETURNED_TO_LMD";

  function reset() {
    setActiveForm(null);
    setComment("");
    setRejectReason("");
    setError(null);
  }

  async function handleAccept() {
    setLoading(true);
    setError(null);
    const fd = new FormData();
    if (comment) fd.append("comment", comment);
    const result = await acceptApplicationAction(applicationId, fd);
    if (!result.ok) {
      setError(result.error ?? "Failed.");
      setLoading(false);
    } else {
      startTransition(() => router.refresh());
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      setError("Rejection reason is required.");
      return;
    }
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("reason", rejectReason);
    if (comment) fd.append("comment", comment);
    const result = await rejectApplicationAction(applicationId, fd);
    if (!result.ok) {
      setError(result.error ?? "Failed.");
      setLoading(false);
    } else {
      startTransition(() => router.refresh());
    }
  }

  async function handleReturn() {
    if (!comment.trim()) {
      setError("A comment is required when returning to LMD.");
      return;
    }
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("comment", comment);
    const result = await returnToLmdAction(applicationId, fd);
    if (!result.ok) {
      setError(result.error ?? "Failed.");
      setLoading(false);
    } else {
      startTransition(() => router.refresh());
    }
  }

  // ── ACCEPTED ────────────────────────────────────────────────────────────
  if (isAccepted) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <svg
            className="h-5 w-5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-green-800">Accepted</h3>
        </div>
        <p className="text-sm text-green-700">
          This application has been accepted. The applicant has been notified.
        </p>
        {existingDirectorComment && (
          <div className="mt-3 rounded-lg border border-green-200 bg-white p-3">
            <p className="text-xs font-medium text-green-700 mb-1">
              Your comment:
            </p>
            <p className="text-sm text-gray-700">{existingDirectorComment}</p>
          </div>
        )}
      </div>
    );
  }

  // ── REJECTED ────────────────────────────────────────────────────────────
  if (isRejected) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <svg
            className="h-5 w-5 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-red-800">Rejected</h3>
        </div>
        <p className="text-sm text-red-700">
          This application was not approved.
        </p>
        {existingRejectionReason && (
          <div className="mt-3 rounded-lg border border-red-200 bg-white p-3">
            <p className="text-xs font-medium text-red-700 mb-1">
              Rejection reason (visible to applicant):
            </p>
            <p className="text-sm text-gray-700">{existingRejectionReason}</p>
          </div>
        )}
        {existingDirectorComment && (
          <div className="mt-3 rounded-lg border border-red-200 bg-white p-3">
            <p className="text-xs font-medium text-red-700 mb-1">
              Internal comment:
            </p>
            <p className="text-sm text-gray-700">{existingDirectorComment}</p>
          </div>
        )}
      </div>
    );
  }

  // ── RETURNED TO LMD ─────────────────────────────────────────────────────
  if (isReturnedToLmd) {
    return (
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
        <h3 className="mb-1 text-sm font-semibold text-orange-800">
          Returned to LMD
        </h3>
        <p className="text-sm text-orange-700">
          This application has been returned to the Local Mission Director for
          further review.
        </p>
        {existingDirectorComment && (
          <div className="mt-3 rounded-lg border border-orange-200 bg-white p-3">
            <p className="text-xs font-medium text-orange-700 mb-1">
              Your comment to the LMD:
            </p>
            <p className="text-sm text-gray-700">{existingDirectorComment}</p>
          </div>
        )}
      </div>
    );
  }

  // ── ACTIVE DECISION PANEL ────────────────────────────────────────────────
  if (!isActionable) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Director Decision
        </h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Review the application and LMD recommendation above, then make your
          final decision.
        </p>
      </div>

      {/* Bio data PDF */}
      <div className="border-t border-gray-100 pt-4">
        <BioDataPdfButton
          applicationId={applicationId}
          referenceNumber={referenceNumber}
          missionName={missionName}
          programTitle={programTitle}
        />
      </div>

      {/* Action buttons — shown when no form is open */}
      {!activeForm && (
        <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => setActiveForm("accept")}
            className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            ✓ Accept
          </button>
          <button
            type="button"
            onClick={() => setActiveForm("reject")}
            className="rounded-lg border border-red-300 bg-white px-5 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            ✗ Reject
          </button>
          <button
            type="button"
            onClick={() => setActiveForm("return")}
            className="rounded-lg border border-orange-300 bg-white px-5 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 transition-colors"
          >
            ↩ Return to LMD
          </button>
        </div>
      )}

      {/* ── Accept form ── */}
      {activeForm === "accept" && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2">
            <p className="text-xs text-green-800">
              The applicant will be notified that their application has been
              accepted.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Comment <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Any notes about this acceptance..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="sticky bottom-4 flex gap-2 bg-white pt-2">
            <button
              type="button"
              onClick={handleAccept}
              disabled={loading}
              className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Accepting…" : "Confirm Accept"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Reject form ── */}
      {activeForm === "reject" && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
            <p className="text-xs text-red-800">
              The rejection reason{" "}
              <strong>will be shown to the applicant</strong>.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Rejection reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Explain why this application is being rejected (shown to applicant)..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Internal comment{" "}
              <span className="text-gray-400">
                (optional, not shown to applicant)
              </span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Any internal notes..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="sticky bottom-4 flex gap-2 bg-white pt-2">
            <button
              type="button"
              onClick={handleReject}
              disabled={loading}
              className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Rejecting…" : "Confirm Rejection"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Return to LMD form ── */}
      {activeForm === "return" && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2">
            <p className="text-xs text-orange-800">
              The LMD will see your comment and can re-review before
              recommending again.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Comment for LMD <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Explain what needs to be addressed before recommending again..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="sticky bottom-4 flex gap-2 bg-white pt-2">
            <button
              type="button"
              onClick={handleReturn}
              disabled={loading}
              className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Returning…" : "Confirm Return to LMD"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
