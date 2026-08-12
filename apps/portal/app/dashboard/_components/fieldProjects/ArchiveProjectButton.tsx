"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveFieldProjectAction } from "@/actions/fieldProjects";

export function ArchiveProjectButton({
  projectId,
  name,
}: {
  projectId: string;
  name: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function archive() {
    setError(null);
    startTransition(async () => {
      const res = await archiveFieldProjectAction(projectId);
      if (res.ok) {
        setConfirming(false);
        router.refresh();
      } else {
        setError(res.error ?? "Could not archive.");
      }
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        Archive
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setConfirming(false);
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-sm font-semibold text-gray-900">Archive project?</h2>
        <p className="mb-4 text-xs leading-relaxed text-gray-500">
          <span className="font-medium text-gray-700">{name}</span> will be hidden from
          assignment. Anyone currently on it is unassigned and their history closed —
          past reports keep the project name they were written against.
        </p>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={archive}
            disabled={isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {isPending ? "Archiving…" : "Archive"}
          </button>
        </div>
      </div>
    </div>
  );
}
