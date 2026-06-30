"use client";

import { useTransition } from "react";
import { deleteUrgentReportAction } from "@/actions/urgentReports";

export function DeleteReportButton({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Delete this report?")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("reportId", reportId);
      await deleteUrgentReportAction(fd);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
