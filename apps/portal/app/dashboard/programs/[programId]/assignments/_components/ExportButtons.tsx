"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";

type RosterProps = {
  kind: "roster";
  programId: string;
  topicId: string;
};

type SubmissionsProps = {
  kind: "submissions";
  assignmentId: string;
};

type Props = RosterProps | SubmissionsProps;

export function TrainerExportButtons(props: Props) {
  const [loading, setLoading] = useState<"pdf" | "xlsx" | null>(null);

  function href(format: "pdf" | "xlsx") {
    if (props.kind === "roster") {
      return `/api/export/trainer/roster?programId=${props.programId}&topicId=${props.topicId}&format=${format}`;
    }
    return `/api/export/trainer/submissions?assignmentId=${props.assignmentId}&format=${format}`;
  }

  async function download(format: "pdf" | "xlsx") {
    setLoading(format);
    try {
      const res = await fetch(href(format));
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "pdf"
        ? `${props.kind}-${Date.now()}.pdf`
        : `${props.kind}-${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(null);
    }
  }

  const label = props.kind === "roster" ? "Roster" : "Submissions";

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <button
        onClick={() => download("pdf")}
        disabled={!!loading}
        className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 transition-colors"
      >
        <FileDown className="h-3.5 w-3.5" />
        {loading === "pdf" ? "…" : "PDF"}
      </button>
      <button
        onClick={() => download("xlsx")}
        disabled={!!loading}
        className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700 disabled:opacity-50 transition-colors"
      >
        <FileDown className="h-3.5 w-3.5" />
        {loading === "xlsx" ? "…" : "Excel"}
      </button>
    </div>
  );
}
