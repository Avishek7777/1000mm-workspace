"use client";

import { useState } from "react";

/** List exports for the scholarship queues — same pattern as the other exports. */
export function ScholarshipExportButtons() {
  const [loading, setLoading] = useState<"pdf" | "xlsx" | null>(null);

  async function download(format: "pdf" | "xlsx") {
    setLoading(format);
    try {
      const res = await fetch(`/api/export/scholarships/${format}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scholarships.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Deliberately quiet: the button returning to its normal state is the
      // signal, and an alert() here would be worse than the retry.
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => download("pdf")}
        disabled={loading !== null}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
      >
        {loading === "pdf" ? "Exporting…" : "Export PDF"}
      </button>
      <button
        type="button"
        onClick={() => download("xlsx")}
        disabled={loading !== null}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60"
      >
        {loading === "xlsx" ? "Exporting…" : "Export Excel"}
      </button>
    </div>
  );
}
