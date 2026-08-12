import { LmdReviewPanel } from "./LmdReviewPanel";
import { UdDecisionPanel } from "./UdDecisionPanel";

export const SCHOLARSHIP_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_LMD_REVIEW: "Under LMD review",
  LMD_SUGGESTED: "Suggested to Union Director",
  LMD_REJECTED: "Rejected by LMD",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STATUS_BADGE: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_LMD_REVIEW: "bg-amber-100 text-amber-700",
  LMD_SUGGESTED: "bg-teal-100 text-teal-700",
  LMD_REJECTED: "bg-red-100 text-red-600",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
};

function fmt(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export type ScholarshipCardRequest = {
  id: string;
  referenceNumber: string;
  status: string;
  submittedAt: Date;
  planningToStudy: string | null;
  subject: string | null;
  collegeName: string | null;
  yearlyFees: string | null;
  approvedAmount: number | null;
  lmdDecisionNote: string | null;
  lmdDecisionAt: Date | null;
  lmdMinutesKey: string | null;
  lmdMinutesName: string | null;
  udDecisionNote: string | null;
  udDecisionAt: Date | null;
  lmdReviewer: { fullName: string } | null;
  udReviewer: { fullName: string } | null;
  mission: { code: string; name: string };
  missionary: { fullName: string };
};

/**
 * One application, rendered for whoever is looking at it. The applicant sees
 * progress and outcome; the LMD and UD additionally get their decision panel
 * when the application is at their stage.
 */
export function ScholarshipStatusCard({
  request: r,
  viewer,
}: {
  request: ScholarshipCardRequest;
  viewer: "APPLICANT" | "LMD" | "UD";
}) {
  const awaitingLmd = ["SUBMITTED", "UNDER_LMD_REVIEW"].includes(r.status);
  const awaitingUd = r.status === "LMD_SUGGESTED";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-medium text-gray-800">
              {r.referenceNumber}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                STATUS_BADGE[r.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {SCHOLARSHIP_STATUS_LABEL[r.status] ?? r.status}
            </span>
          </div>
          {viewer !== "APPLICANT" && (
            <p className="text-sm font-medium text-gray-900">{r.missionary.fullName}</p>
          )}
          <p className="text-xs text-gray-500">
            {[r.planningToStudy, r.subject, r.collegeName].filter(Boolean).join(" · ") ||
              "Study details not provided"}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400">
            {r.mission.code} · Submitted {fmt(r.submittedAt)}
            {r.yearlyFees ? ` · Yearly fees ${r.yearlyFees}` : ""}
          </p>
        </div>

        <a
          href={`/api/export/scholarships/${r.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          PDF
        </a>
      </div>

      {/* Decisions so far */}
      {(r.lmdDecisionAt || r.udDecisionAt) && (
        <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
          {r.lmdDecisionAt && (
            <div className="text-xs">
              <p className="font-medium text-gray-700">
                Local Mission Director — {r.lmdReviewer?.fullName ?? "—"}, {fmt(r.lmdDecisionAt)}
              </p>
              {r.lmdDecisionNote && (
                <p className="mt-0.5 leading-relaxed text-gray-600">{r.lmdDecisionNote}</p>
              )}
              {r.lmdMinutesKey && (
                <a
                  href={`/api/uploads/${r.lmdMinutesKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-block font-medium text-teal-700 hover:underline"
                >
                  {r.lmdMinutesName ?? "Decision copy"}
                </a>
              )}
            </div>
          )}
          {r.udDecisionAt && (
            <div className="text-xs">
              <p className="font-medium text-gray-700">
                Union Director — {r.udReviewer?.fullName ?? "—"}, {fmt(r.udDecisionAt)}
              </p>
              {r.udDecisionNote && (
                <p className="mt-0.5 leading-relaxed text-gray-600">{r.udDecisionNote}</p>
              )}
              {r.approvedAmount != null && (
                <p className="mt-1 font-semibold text-green-700">
                  Funded: {r.approvedAmount.toLocaleString("en-GB")}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {viewer === "LMD" && awaitingLmd && <LmdReviewPanel requestId={r.id} />}
      {viewer === "UD" && awaitingUd && <UdDecisionPanel requestId={r.id} />}
    </div>
  );
}
