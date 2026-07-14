"use client";

import { useState } from "react";

export function MissionaryExportButtons({
  status,
  mission,
  year,
  search,
  program,
}: {
  status?: string;
  mission?: string;
  year?: string;
  search?: string;
  program?: string;
}) {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingXlsx, setLoadingXlsx] = useState(false);

  function buildUrl(format: "pdf" | "xlsx") {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (mission) p.set("mission", mission);
    if (year) p.set("year", year);
    if (search) p.set("search", search);
    if (program) p.set("program", program);
    return `/api/export/missionaries/${format}?${p.toString()}`;
  }

  async function handleDownload(format: "pdf" | "xlsx") {
    if (format === "pdf") setLoadingPdf(true);
    else setLoadingXlsx(true);
    try {
      const res = await fetch(buildUrl(format));
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `missionaries-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setLoadingPdf(false);
      setLoadingXlsx(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400">Export:</span>
      <button
        onClick={() => handleDownload("xlsx")}
        disabled={loadingXlsx}
        className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-60 transition-colors"
      >
        {loadingXlsx ? (
          <span className="h-3 w-3 animate-spin rounded-full border border-green-600 border-t-transparent" />
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        )}
        Excel
      </button>
      <button
        onClick={() => handleDownload("pdf")}
        disabled={loadingPdf}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 transition-colors"
      >
        {loadingPdf ? (
          <span className="h-3 w-3 animate-spin rounded-full border border-red-600 border-t-transparent" />
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        )}
        PDF
      </button>
    </div>
  );
}
