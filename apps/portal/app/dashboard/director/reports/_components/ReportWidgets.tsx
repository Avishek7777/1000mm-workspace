"use client";

import { useState, useCallback } from "react";

// ── AI Insights Panel ─────────────────────────────────────────────────────────

type AiInsightsPanelProps = {
  reportType: string;
  reportData: unknown;
  onInsightsReady: (text: string) => void;
};

export function AiInsightsPanel({
  reportType,
  reportData,
  onInsightsReady,
}: AiInsightsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [includeInPdf, setIncludeInPdf] = useState(true);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType, data: reportData }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to generate insights.");
      }
      const { insights: text } = await res.json();
      setInsights(text);
      onInsightsReady(text);
    } catch (err: any) {
      setError(err.message ?? "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInsights(e.target.value);
    onInsightsReady(e.target.value);
  }

  function handleToggle(e: React.ChangeEvent<HTMLInputElement>) {
    setIncludeInPdf(e.target.checked);
    onInsightsReady(e.target.checked ? insights : "");
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-blue-900">
            AI Executive Insights
          </h3>
          <span className="rounded-full bg-blue-200 px-2 py-0.5 text-[10px] font-medium text-blue-700">
            Powered by Gemini
          </span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
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
          ) : insights ? (
            "Regenerate"
          ) : (
            "Generate AI Insights"
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      {insights && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-blue-800">
              Review and edit insights before including in PDF:
            </label>
            <textarea
              value={insights}
              onChange={handleChange}
              rows={6}
              className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={includeInPdf}
              onChange={handleToggle}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-xs font-medium text-blue-800">
              Include AI insights as final page in PDF
            </span>
          </label>
        </div>
      )}

      {!insights && !loading && (
        <p className="text-xs text-blue-600">
          Click "Generate AI Insights" to get an executive summary of this
          report powered by Google Gemini.
        </p>
      )}
    </div>
  );
}

// ── PDF Export Button ─────────────────────────────────────────────────────────

type PdfExportButtonProps = {
  reportType: "pipeline" | "demographics" | "decisions" | "growth";
  reportData: unknown;
  aiInsights: string;
  filters?: string;
  disabled?: boolean;
};

export function PdfExportButton({
  reportType,
  reportData,
  aiInsights,
  filters,
  disabled,
}: PdfExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { pdf } = await import("@react-pdf/renderer");

      let PdfComponent: React.ComponentType<any>;
      let props: Record<string, unknown>;

      switch (reportType) {
        case "pipeline": {
          const { Report1PipelinePdf } =
            await import("@/lib/reports/pdf/Report1PipelinePdf");
          PdfComponent = Report1PipelinePdf;
          props = {
            data: reportData,
            filters,
            aiInsights: aiInsights || undefined,
          };
          break;
        }
        case "demographics": {
          const { Report2DemographicsPdf } =
            await import("@/lib/reports/pdf/ReportPdfs");
          PdfComponent = Report2DemographicsPdf;
          props = {
            data: reportData,
            filters,
            aiInsights: aiInsights || undefined,
          };
          break;
        }
        case "decisions": {
          const { Report3DecisionsPdf } =
            await import("@/lib/reports/pdf/ReportPdfs");
          PdfComponent = Report3DecisionsPdf;
          props = {
            data: reportData,
            filters,
            aiInsights: aiInsights || undefined,
          };
          break;
        }
        case "growth": {
          const { Report6GrowthPdf } =
            await import("@/lib/reports/pdf/ReportPdfs");
          PdfComponent = Report6GrowthPdf;
          props = { data: reportData, aiInsights: aiInsights || undefined };
          break;
        }
        default:
          throw new Error("Unknown report type.");
      }

      const blob = await pdf(<PdfComponent {...props} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err: any) {
      console.error("PDF export failed:", err);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [reportType, reportData, aiInsights, filters]);

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={disabled || loading}
        className="flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
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
            Generating PDF…
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
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
            View / Download PDF
          </>
        )}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
