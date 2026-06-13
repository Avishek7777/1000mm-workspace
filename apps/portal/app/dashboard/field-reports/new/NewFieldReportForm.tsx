"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitFieldReportAction } from "@/actions/fieldReports";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

type TraineeInfo = {
  fullName: string;
  email: string;
  missionName: string;
  lmdName: string | null;
  workplace: string | null;
  programTitle: string;
};

export default function NewFieldReportPage({
  traineeInfo,
}: {
  traineeInfo: TraineeInfo;
}) {
  const router = useRouter();
  const now = new Date();
  const [state, action, pending] = useActionState(submitFieldReportAction, {
    ok: false,
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const [fields, setFields] = useState({
    reportMonth: String(now.getMonth() + 1),
    reportYear: String(now.getFullYear()),
    totalActivities: "",
    daysOfWork: "",
    hoursOfWork: "",
    nonSdaHomeVisits: "",
    bibleStudiesConducted: "",
    medicalVisits: "",
    worshipSessionsTaken: "",
    newGroupsMade: "",
    baptismCandidatesPrepared: "",
    numberOfBaptisms: "",
    peopleReached: "",
    activitiesSummary: "",
    trainingReceived: "",
    storyOrWitness: "",
    commentsOrSuggestions: "",
    challengesFaced: "",
    prayerRequests: "",
  });

  function set(key: keyof typeof fields) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => setFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  useEffect(() => {
    if (state.ok && state.reportId) {
      setShowSuccess(true);
      setTimeout(
        () => router.push(`/dashboard/field-reports/${state.reportId}`),
        1500,
      );
    }
  }, [state.ok, state.reportId]);

  const e = state.fieldErrors ?? {};

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
          href="/dashboard/field-reports"
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ← Back to Reports
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">
          Submit Field Report
        </h1>
      </div>

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-6">
        {/* Auto-filled info card */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Worker Information
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400">Name</p>
              <p className="font-medium text-gray-900">
                {traineeInfo.fullName}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="font-medium text-gray-900">{traineeInfo.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Mission</p>
              <p className="font-medium text-gray-900">
                {traineeInfo.missionName}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Local Director</p>
              <p className="font-medium text-gray-900">
                {traineeInfo.lmdName ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Program</p>
              <p className="font-medium text-gray-900">
                {traineeInfo.programTitle}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Current Workplace</p>
              <p className="font-medium text-gray-900">
                {traineeInfo.workplace ?? "Not assigned"}
              </p>
            </div>
          </div>
        </div>

        {/* Report period */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Report Period
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Month <span className="text-red-500">*</span>
              </label>
              <select
                name="reportMonth"
                value={fields.reportMonth}
                onChange={set("reportMonth")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Year <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="reportYear"
                value={fields.reportYear}
                onChange={set("reportYear")}
                min={2020}
                max={2100}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Activity metrics */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Activity Metrics
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { name: "totalActivities", label: "Total Activities" },
              { name: "daysOfWork", label: "Days of Work" },
              { name: "hoursOfWork", label: "Hours of Work" },
              { name: "nonSdaHomeVisits", label: "Non-SDA Home Visits" },
              {
                name: "bibleStudiesConducted",
                label: "Bible Studies Conducted",
              },
              { name: "medicalVisits", label: "Medical Visits" },
              { name: "worshipSessionsTaken", label: "Worship Sessions Taken" },
              { name: "newGroupsMade", label: "New Groups Made" },
              {
                name: "baptismCandidatesPrepared",
                label: "Baptism Candidates Prepared",
              },
              { name: "numberOfBaptisms", label: "Number of Baptisms" },
              { name: "peopleReached", label: "Total People Reached" },
            ].map((f) => (
              <div key={f.name}>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  {f.label}
                </label>
                <input
                  type="number"
                  name={f.name}
                  value={fields[f.name as keyof typeof fields]}
                  onChange={set(f.name as keyof typeof fields)}
                  min={0}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                />
                {e[f.name] && (
                  <p className="mt-0.5 text-xs text-red-500">{e[f.name]}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Narrative fields */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Narrative
          </p>
          {[
            {
              name: "activitiesSummary",
              label: "Brief Description of Worker's Activities",
              required: true,
              rows: 4,
            },
            {
              name: "trainingReceived",
              label: "Training Received",
              required: false,
              rows: 3,
            },
            {
              name: "storyOrWitness",
              label: "Story or Witness (Brief Description)",
              required: false,
              rows: 3,
            },
            {
              name: "challengesFaced",
              label: "Challenges Faced",
              required: false,
              rows: 3,
            },
            {
              name: "prayerRequests",
              label: "Prayer Requests",
              required: false,
              rows: 2,
            },
            {
              name: "commentsOrSuggestions",
              label: "Comments or Suggestions",
              required: false,
              rows: 2,
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
            href="/dashboard/field-reports"
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
