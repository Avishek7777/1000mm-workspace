"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  returnToApplicantAction,
  uploadLmdDocumentAction,
  recommendAction,
  rejectApplicationAction,
} from "@/actions/lmd";
import type { ApplicationStatus } from "@1000mm/db";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

type LmdDoc = {
  kind: string;
  fileName: string;
  storageKey: string;
};

type Props = {
  applicationId: string;
  status: ApplicationStatus;
  lmdDocs: LmdDoc[];
  existingComment?: string | null;
  existingWrittenComment?: string | null;
  existingLmdRejectionReason?: string | null;
  // For the applicant bio data PDF
  referenceNumber?: string | null;
  missionName?: string;
  programTitle?: string;
};

type DocSlot = {
  kind: "RECOMMENDATION_LETTER" | "SWORN_STATEMENT" | "EXCOM_VOTE_COPY";
  label: string;
  hint: string;
  required: boolean;
};

const DOC_SLOTS: DocSlot[] = [
  {
    kind: "RECOMMENDATION_LETTER",
    label: "Recommendation Letter",
    hint: "Official recommendation letter. PDF, max 5 MB. Required.",
    required: true,
  },
  {
    kind: "SWORN_STATEMENT",
    label: "Sworn Statement",
    hint: "Legal sworn statement from LMD. PDF, max 5 MB.",
    required: false,
  },
  {
    kind: "EXCOM_VOTE_COPY",
    label: "Ex-Com Vote Copy",
    hint: "Executive Committee vote copy from the church. PDF, max 5 MB.",
    required: false,
  },
];

// ── Applicant Bio Data PDF button ─────────────────────────────────────────────
// Same PDF the applicant gets — for LMD to present at Ex-Com meeting.

function ApplicantBioDataPdfButton({
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
      if (!res.ok) throw new Error(`Failed to fetch data: ${res.status}`);
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
      console.error("Bio data PDF failed:", err);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [applicationId, referenceNumber, missionName, programTitle]);

  return (
    <div>
      <button
        onClick={handleView}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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

// ── Recommendation PDF button ─────────────────────────────────────────────────

function RecommendationPdfButton({ applicationId }: { applicationId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleView = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { LmdRecommendationPDF } =
        await import("@/app/dashboard/lmd/applications/[applicationId]/_components/LmdRecommendationPDF");

      const res = await fetch(
        `/api/application/${applicationId}/recommendation-pdf-data`,
      );
      if (!res.ok) throw new Error(`Failed to fetch data: ${res.status}`);
      const data = await res.json();

      const blob = await pdf(<LmdRecommendationPDF {...data} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  return (
    <div>
      <button
        onClick={handleView}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-teal-300 bg-white px-4 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
            View Recommendation Summary PDF
          </>
        )}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Document upload slot ──────────────────────────────────────────────────────

function DocUploadSlot({
  slot,
  existing,
  applicationId,
  onUploaded,
}: {
  slot: DocSlot;
  existing: LmdDoc | null;
  applicationId: string;
  onUploaded: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [newFileName, setNewFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadLmdDocumentAction(applicationId, slot.kind, fd);
    if (!result.ok) {
      setError(result.error ?? "Upload failed.");
    } else {
      setNewFileName(file.name);
      onUploaded();
    }
    setUploading(false);
  }

  const uploadedName = newFileName ?? (existing ? existing.fileName : null);
  const isUploaded = !!uploadedName;

  return (
    <div>
      <label
        className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed px-4 py-3 transition-colors hover:bg-gray-50 ${isUploaded ? "border-green-400 bg-green-50" : "border-gray-300"}`}
      >
        {uploading ? (
          <svg
            className="h-5 w-5 animate-spin text-gray-400"
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
        ) : isUploaded ? (
          <svg
            className="h-5 w-5 flex-shrink-0 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5 flex-shrink-0 text-gray-400"
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
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-gray-800">{slot.label}</p>
            {slot.required && <span className="text-red-500 text-xs">*</span>}
          </div>
          <p
            className={`truncate text-xs ${isUploaded ? "text-green-700 font-medium" : "text-gray-400"}`}
          >
            {uploading ? "Uploading…" : isUploaded ? uploadedName : slot.hint}
          </p>
        </div>
        {isUploaded && existing && (
          <a
            href={`/api/uploads/${existing.storageKey}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 text-xs text-blue-600 hover:underline"
          >
            View
          </a>
        )}
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="file-input-hidden"
          onChange={handleChange}
          disabled={uploading}
        />
      </label>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Main ActionPanel ──────────────────────────────────────────────────────────

export function ActionPanel({
  applicationId,
  status,
  lmdDocs,
  existingComment,
  existingWrittenComment,
  existingLmdRejectionReason,
  referenceNumber,
  missionName,
  programTitle,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Return form
  const [returnComment, setReturnComment] = useState("");
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);

  // Reject form
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);

  // Recommendation
  const [writtenComment, setWrittenComment] = useState(
    existingWrittenComment ?? "",
  );
  const [recommendError, setRecommendError] = useState<string | null>(null);
  const [recommending, setRecommending] = useState(false);

  const [uploadedKinds, setUploadedKinds] = useState<Set<string>>(
    new Set(lmdDocs.map((d) => d.kind)),
  );

  function handleDocUploaded(kind: string) {
    setUploadedKinds((prev) => new Set([...prev, kind]));
  }

  const hasRecommendationLetter = uploadedKinds.has("RECOMMENDATION_LETTER");
  const isReviewPhase = ["UNDER_LMD_REVIEW", "SUBMITTED"].includes(status);
  const isRecommended = status === "RECOMMENDED";
  const isReturned = status === "RETURNED_TO_APPLICANT";
  const isRejected = status === "REJECTED";

  async function handleReturn() {
    if (!returnComment.trim()) {
      setReturnError("Please provide a reason.");
      return;
    }
    setReturning(true);
    setReturnError(null);
    const fd = new FormData();
    fd.append("comment", returnComment);
    const result = await returnToApplicantAction(applicationId, fd);
    if (!result.ok) {
      setReturnError(result.error ?? "Failed.");
      setReturning(false);
    } else {
      startTransition(() => router.refresh());
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      setRejectError("Please provide a reason.");
      return;
    }
    setRejecting(true);
    setRejectError(null);
    const fd = new FormData();
    fd.append("reason", rejectReason);
    const result = await rejectApplicationAction(applicationId, fd);
    if (!result.ok) {
      setRejectError(result.error ?? "Failed.");
      setRejecting(false);
    } else {
      startTransition(() => router.refresh());
    }
  }

  async function handleRecommend() {
    if (!hasRecommendationLetter) {
      setRecommendError("Please upload the Recommendation Letter first.");
      return;
    }
    setRecommending(true);
    setRecommendError(null);
    const fd = new FormData();
    fd.append("writtenComment", writtenComment);
    const result = await recommendAction(applicationId, fd);
    if (!result.ok) {
      setRecommendError(result.error ?? "Failed.");
      setRecommending(false);
    } else {
      startTransition(() => router.refresh());
    }
  }

  // ── RECOMMENDED ─────────────────────────────────────────────────────────
  if (isRecommended) {
    return (
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <svg
            className="h-5 w-5 text-teal-600"
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
          <h3 className="text-sm font-semibold text-teal-800">Recommended</h3>
        </div>
        <p className="text-sm text-teal-700">
          Forwarded to the Union Director for final review.
        </p>
        {existingWrittenComment && (
          <div className="mt-3 rounded-lg border border-teal-200 bg-white p-3">
            <p className="text-xs font-medium text-teal-700 mb-1">
              Your recommendation comment:
            </p>
            <p className="text-sm text-gray-700">{existingWrittenComment}</p>
          </div>
        )}
        <div className="mt-3 space-y-1">
          {DOC_SLOTS.map((slot) => {
            const doc = lmdDocs.find((d) => d.kind === slot.kind);
            return (
              <div key={slot.kind} className="flex items-center gap-2">
                <svg
                  className={`h-3.5 w-3.5 ${doc ? "text-teal-500" : "text-gray-300"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span
                  className={`text-xs ${doc ? "text-teal-700" : "text-gray-400"}`}
                >
                  {slot.label} {doc ? `— ${doc.fileName}` : "(not uploaded)"}
                </span>
              </div>
            );
          })}
        </div>

        {/* PDF buttons */}
        <div className="mt-4 flex flex-wrap gap-3 border-t border-teal-200 pt-4">
          <ApplicantBioDataPdfButton
            applicationId={applicationId}
            referenceNumber={referenceNumber}
            missionName={missionName}
            programTitle={programTitle}
          />
          <RecommendationPdfButton applicationId={applicationId} />
        </div>
      </div>
    );
  }

  // ── RETURNED TO APPLICANT ────────────────────────────────────────────────
  if (isReturned) {
    return (
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
        <h3 className="mb-1 text-sm font-semibold text-orange-800">
          Returned to Applicant
        </h3>
        <p className="text-sm text-orange-700">
          You returned this application to the applicant for revision.
        </p>
        {existingComment && (
          <div className="mt-3 rounded-lg border border-orange-200 bg-white p-3">
            <p className="text-xs font-medium text-orange-700 mb-1">
              Your comment:
            </p>
            <p className="text-sm text-gray-700">{existingComment}</p>
          </div>
        )}
      </div>
    );
  }

  // ── REJECTED BY LMD ──────────────────────────────────────────────────────
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
          <h3 className="text-sm font-semibold text-red-800">
            Application Rejected
          </h3>
        </div>
        <p className="text-sm text-red-700">You rejected this application.</p>
        {existingLmdRejectionReason && (
          <div className="mt-3 rounded-lg border border-red-200 bg-white p-3">
            <p className="text-xs font-medium text-red-700 mb-1">
              Rejection reason{" "}
              <span className="font-normal text-red-400">
                (not visible to applicant)
              </span>
              :
            </p>
            <p className="text-sm text-gray-700">
              {existingLmdRejectionReason}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── ACTIVE REVIEW PANEL ──────────────────────────────────────────────────
  if (!isReviewPhase) return null;

  return (
    <div className="space-y-4">
      {/* Bio data PDF — available during review for Ex-Com presentation */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="mb-3 text-xs font-medium text-blue-800">
          Use this PDF to present the application at your Ex-Com meeting before
          uploading documents.
        </p>
        <ApplicantBioDataPdfButton
          applicationId={applicationId}
          referenceNumber={referenceNumber}
          missionName={missionName}
          programTitle={programTitle}
        />
      </div>

      {/* Stage 1 — Review actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-1 text-sm font-semibold text-gray-900">
          Stage 1 — Review
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Review the application. Return it to the applicant for corrections,
          reject it, or proceed to Stage 2.
        </p>

        {/* Buttons row — show when neither form is open */}
        {!showReturnForm && !showRejectForm && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowReturnForm(true)}
              className="rounded-lg border border-orange-300 bg-white px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 transition-colors"
            >
              Return to Applicant
            </button>
            <button
              type="button"
              onClick={() => setShowRejectForm(true)}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
            >
              Reject Application
            </button>
          </div>
        )}

        {/* Return form */}
        {showReturnForm && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Reason for return <span className="text-red-500">*</span>
              </label>
              <textarea
                value={returnComment}
                onChange={(e) => setReturnComment(e.target.value)}
                rows={3}
                placeholder="Explain what needs to be corrected or updated..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
              />
            </div>
            {returnError && (
              <p className="text-xs text-red-500">{returnError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReturn}
                disabled={returning}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60 transition-colors"
              >
                {returning ? "Returning…" : "Confirm Return"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReturnForm(false);
                  setReturnComment("");
                  setReturnError(null);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reject form */}
        {showRejectForm && (
          <div className="space-y-3">
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
              <p className="text-xs text-red-700">
                <strong>Note:</strong> The rejection reason will{" "}
                <strong>not</strong> be shown to the applicant. It is only
                visible to Directors and System Admins.
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
                placeholder="Provide an internal reason for rejection..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
              />
            </div>
            {rejectError && (
              <p className="text-xs text-red-500">{rejectError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReject}
                disabled={rejecting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {rejecting ? "Rejecting…" : "Confirm Rejection"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason("");
                  setRejectError(null);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stage 2 — Documents + Recommend */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-1 text-sm font-semibold text-gray-900">
          Stage 2 — Submit Recommendation
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Upload your recommendation documents after Ex-Com approval.
          Recommendation Letter is required.
        </p>
        <div className="mb-4 space-y-2">
          {DOC_SLOTS.map((slot) => (
            <DocUploadSlot
              key={slot.kind}
              slot={slot}
              existing={lmdDocs.find((d) => d.kind === slot.kind) ?? null}
              applicationId={applicationId}
              onUploaded={() => handleDocUploaded(slot.kind)}
            />
          ))}
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Recommendation Comment{" "}
            <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={writtenComment}
            onChange={(e) => setWrittenComment(e.target.value)}
            rows={3}
            placeholder="Any additional notes for the Union Director..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        {recommendError && (
          <p className="mb-3 text-xs text-red-500">{recommendError}</p>
        )}
        <button
          type="button"
          onClick={handleRecommend}
          disabled={recommending || !hasRecommendationLetter}
          className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          title={
            !hasRecommendationLetter
              ? "Upload Recommendation Letter first"
              : undefined
          }
        >
          {recommending ? "Submitting…" : "Submit Recommendation →"}
        </button>
        {!hasRecommendationLetter && (
          <p className="mt-2 text-xs text-gray-400">
            Upload the Recommendation Letter to enable this button.
          </p>
        )}
      </div>
    </div>
  );
}
