// apps/portal/app/dashboard/system-admin/trainer-applications/_components/ExportButtons.tsx
// Drop this component anywhere you want export buttons.
// Pass trainerId for single-trainer exports, omit for all-trainers.

"use client";

import { useState } from "react";
import { FileText, Sheet, Loader2 } from "lucide-react";

type Format = "pdf" | "excel";

export function ExportButtons({ trainerId }: { trainerId?: string }) {
  const [loading, setLoading] = useState<Format | null>(null);

  async function download(format: Format) {
    setLoading(format);
    try {
      const base =
        format === "pdf"
          ? "/api/export/trainers/pdf"
          : "/api/export/trainers/excel";
      const url = trainerId ? `${base}?id=${trainerId}` : base;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename =
        match?.[1] ?? `trainers.${format === "pdf" ? "pdf" : "xlsx"}`;

      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(href);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* PDF */}
      <button
        onClick={() => download("pdf")}
        disabled={loading !== null}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
      >
        {loading === "pdf" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileText className="h-3.5 w-3.5 text-red-500" />
        )}
        {trainerId ? "PDF" : "Export PDF"}
      </button>

      {/* Excel */}
      <button
        onClick={() => download("excel")}
        disabled={loading !== null}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-green-300 hover:bg-green-50 hover:text-green-700 disabled:opacity-50"
      >
        {loading === "excel" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sheet className="h-3.5 w-3.5 text-green-600" />
        )}
        {trainerId ? "Excel" : "Export Excel"}
      </button>
    </div>
  );
}
