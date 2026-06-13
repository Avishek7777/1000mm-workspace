"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitLmdReportAction } from "@/actions/lmdReports";

type AggregatedMetrics = {
  totalTrainees: number;
  totalActivities: number;
  totalDaysOfWork: number;
  totalHoursOfWork: number;
  totalNonSdaHomeVisits: number;
  totalBibleStudies: number;
  totalMedicalVisits: number;
  totalWorshipSessions: number;
  totalNewGroups: number;
  totalBaptismCandidates: number;
  totalBaptisms: number;
  totalPeopleReached: number;
};

type TraineeRow = {
  traineeName: string;
  activities: number;
  baptisms: number;
  peopleReached: number;
};

export default function LmdReportForm({
  windowId,
  periodLabel,
  lmdName,
  missionName,
  aggregated,
  traineeReports,
}: {
  windowId: string;
  periodLabel: string;
  lmdName: string;
  missionName: string;
  aggregated: AggregatedMetrics;
  traineeReports: TraineeRow[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitLmdReportAction, {
    ok: false,
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const [fields, setFields] = useState({
    overallSummary: "",
    challengesAndNeeds: "",
    recommendationsToDirector: "",
    prayerRequests: "",
  });

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  useEffect(() => {
    if (state.ok && state.reportId) {
      setShowSuccess(true);
      setTimeout(
        () => router.push(`/dashboard/lmd/reports/${state.reportId}`),
        1500,
      );
    }
  }, [state.ok, state.reportId]);

  const e = state.fieldErrors ?? {};

  const METRIC_ROWS = [
    { label: "Trainees Reported", value: aggregated.totalTrainees },
    { label: "Total Activities", value: aggregated.totalActivities },
    { label: "Total Days of Work", value: aggregated.totalDaysOfWork },
    { label: "Total Hours of Work", value: aggregated.totalHoursOfWork },
    { label: "Non-SDA Home Visits", value: aggregated.totalNonSdaHomeVisits },
    { label: "Bible Studies", value: aggregated.totalBibleStudies },
    { label: "Medical Visits", value: aggregated.totalMedicalVisits },
    { label: "Worship Sessions", value: aggregated.totalWorshipSessions },
    { label: "New Groups", value: aggregated.totalNewGroups },
    { label: "Baptism Candidates", value: aggregated.totalBaptismCandidates },
    { label: "Baptisms", value: aggregated.totalBaptisms },
    { label: "People Reached", value: aggregated.totalPeopleReached },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="rounded-2xl border border-teal-200 bg-white p-8 shadow-xl text-center max-w-sm mx-4">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100">
              <svg
                className="h-7 w-7 text-teal-600"
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
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Report Submitted!
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Redirecting to your report…
            </p>
          </div>
        </div>
      )}

      <div>
        <Link
          href="/dashboard/lmd/reports"
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ← Back to Reports
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">
          {periodLabel} — Monthly Report
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {missionName} · {lmdName}
        </p>
      </div>

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-6">
        <input type="hidden" name="windowId" value={windowId} />

        {/* Aggregated metrics from trainee reports */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Aggregated from Trainee Reports
            </p>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
              {aggregated.totalTrainees} trainee
              {aggregated.totalTrainees !== 1 ? "s" : ""} reported
            </span>
          </div>

          {aggregated.totalTrainees === 0 && (
            <div className="mb-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              No trainees have submitted reports for this period yet. You can
              still submit your report — metrics will show as 0.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {METRIC_ROWS.map((m) => (
              <div
                key={m.label}
                className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center"
              >
                <p className="text-[10px] text-gray-400">{m.label}</p>
                <p className="mt-0.5 text-xl font-semibold text-gray-900">
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* Trainee breakdown */}
          {traineeReports.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="mb-2 text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                Trainee Breakdown
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-1.5 text-left font-medium text-gray-500">
                        Trainee
                      </th>
                      <th className="pb-1.5 text-right font-medium text-gray-500">
                        Activities
                      </th>
                      <th className="pb-1.5 text-right font-medium text-gray-500">
                        Baptisms
                      </th>
                      <th className="pb-1.5 text-right font-medium text-gray-500">
                        Reached
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {traineeReports.map((t, i) => (
                      <tr key={i}>
                        <td className="py-1.5 text-gray-700">
                          {t.traineeName}
                        </td>
                        <td className="py-1.5 text-right text-gray-600">
                          {t.activities}
                        </td>
                        <td className="py-1.5 text-right text-gray-600">
                          {t.baptisms}
                        </td>
                        <td className="py-1.5 text-right text-gray-600">
                          {t.peopleReached}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* LMD narrative */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Your Report
          </p>

          {[
            {
              name: "overallSummary",
              label: "Overall Summary of Mission Activities",
              required: true,
              rows: 5,
              placeholder:
                "Summarize the overall activities, progress, and highlights from your mission this month…",
            },
            {
              name: "challengesAndNeeds",
              label: "Challenges and Needs",
              required: false,
              rows: 3,
              placeholder:
                "Describe any challenges faced and resources or support needed…",
            },
            {
              name: "recommendationsToDirector",
              label: "Recommendations to Union Director",
              required: false,
              rows: 3,
              placeholder:
                "Any recommendations or items needing director attention…",
            },
            {
              name: "prayerRequests",
              label: "Prayer Requests",
              required: false,
              rows: 2,
              placeholder: "Specific prayer requests for your mission…",
            },
          ].map((f) => (
            <div key={f.name}>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                {f.label}{" "}
                {f.required && <span className="text-red-500">*</span>}
              </label>
              <textarea
                name={f.name}
                value={fields[f.name as keyof typeof fields]}
                onChange={set(f.name as keyof typeof fields)}
                rows={f.rows}
                placeholder={f.placeholder}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              {e[f.name] && (
                <p className="mt-0.5 text-xs text-red-500">{e[f.name]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/dashboard/lmd/reports"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending || showSuccess}
            className="rounded-lg bg-teal-700 px-6 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
          >
            {pending ? "Submitting…" : "Submit Report"}
          </button>
        </div>
      </form>
    </div>
  );
}
