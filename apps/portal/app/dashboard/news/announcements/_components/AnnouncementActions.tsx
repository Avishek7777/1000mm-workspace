"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  publishAnnouncementAction,
  unpublishAnnouncementAction,
  deleteAnnouncementAction,
} from "@/actions/announcements";

export function AnnouncementActions({
  id,
  isPublished,
}: {
  id: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handle(action: "publish" | "unpublish" | "delete") {
    setLoading(action);
    setError(null);
    let result;
    if (action === "publish") result = await publishAnnouncementAction(id);
    else if (action === "unpublish")
      result = await unpublishAnnouncementAction(id);
    else result = await deleteAnnouncementAction(id);

    if (!result.ok) {
      setError(result.error ?? "Failed.");
      setLoading(null);
    } else {
      startTransition(() => router.refresh());
      setLoading(null);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="flex flex-shrink-0 flex-col items-end gap-2">
      <div className="flex gap-2">
        {!isPublished ? (
          <button
            onClick={() => handle("publish")}
            disabled={!!loading}
            className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
          >
            {loading === "publish" ? "…" : "Publish"}
          </button>
        ) : (
          <button
            onClick={() => handle("unpublish")}
            disabled={!!loading}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-60 transition-colors"
          >
            {loading === "unpublish" ? "…" : "Unpublish"}
          </button>
        )}

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
          >
            Delete
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={() => handle("delete")}
              disabled={!!loading}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {loading === "delete" ? "…" : "Confirm"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  );
}
