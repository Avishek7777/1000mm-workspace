"use client";

import { useState } from "react";

type Metrics = {
  totalTrainees: number;
  totalMissions: number;
  pendingApplications: number;
  acceptedThisYear: number;
  rejectedThisYear: number;
  baptismsThisYear: number;
  activitiesThisYear: number;
  fieldReportsThisYear: number;
  attendanceScansThisMonth: number;
  openComplaints: number;
  certificatesIssued: number;
};

type InsightState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; summary: string; generatedAt: string; metrics: Metrics }
  | { status: "error"; message: string };

export function AiInsightsCard() {
  const [state, setState] = useState<InsightState>({ status: "idle" });

  async function generate() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/ai/insights");
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Unknown error." });
        return;
      }
      setState({ status: "done", summary: data.summary, generatedAt: data.generatedAt, metrics: data.metrics });
    } catch {
      setState({ status: "error", message: "Network error. Please try again." });
    }
  }

  return (
    <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2Z" />
              <path d="M12 8v4l3 3" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-900">AI Executive Insights</h2>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-600">Claude AI</span>
        </div>

        {state.status !== "loading" && (
          <button
            onClick={generate}
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 transition-colors"
          >
            {state.status === "done" ? "Refresh" : "Generate"}
          </button>
        )}
      </div>

      {state.status === "idle" && (
        <div className="rounded-lg border border-dashed border-purple-200 bg-purple-50/50 py-8 text-center">
          <p className="text-xs text-gray-400">
            Click <strong>Generate</strong> to get an AI-powered executive summary based on live portal data.
          </p>
        </div>
      )}

      {state.status === "loading" && (
        <div className="flex items-center justify-center gap-3 py-8">
          <svg className="animate-spin h-4 w-4 text-purple-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-xs text-gray-400">Analyzing portal data…</span>
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-xs text-red-700">{state.message}</p>
          <button onClick={generate} className="mt-2 text-xs font-medium text-red-600 underline hover:no-underline">
            Try again
          </button>
        </div>
      )}

      {state.status === "done" && (
        <div className="space-y-4">
          {/* Summary text */}
          <div className="rounded-lg border border-purple-100 bg-white px-4 py-4">
            <p className="text-sm leading-relaxed text-gray-700">{state.summary}</p>
            <p className="mt-3 text-[10px] text-gray-300">
              Generated {new Date(state.generatedAt).toLocaleString("en-GB")} · Powered by Claude
            </p>
          </div>

          {/* Quick metrics strip */}
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            {[
              { label: "Trainees", value: state.metrics.totalTrainees },
              { label: "Baptisms", value: state.metrics.baptismsThisYear },
              { label: "Activities", value: state.metrics.activitiesThisYear },
              { label: "Pending Apps", value: state.metrics.pendingApplications },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-purple-100 bg-white px-3 py-2.5">
                <p className="text-[11px] text-gray-400">{m.label}</p>
                <p className="mt-0.5 text-lg font-bold text-purple-700">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
