"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  openWindowAction,
  closeWindowAction,
  archiveWindowAction,
} from "@/actions/programs";

export function WindowActions({
  windowId,
  state,
  programId,
}: {
  windowId: string;
  state: string;
  programId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handle(action: "open" | "close" | "archive") {
    setLoading(true);
    setError(null);
    let result;
    if (action === "open") result = await openWindowAction(windowId);
    else if (action === "close") result = await closeWindowAction(windowId);
    else result = await archiveWindowAction(windowId);

    if (!result.ok) {
      setError(result.error ?? "Failed.");
      setLoading(false);
    } else {
      startTransition(() => router.refresh());
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {(state === "DRAFT" || state === "ADVERTISING") && (
        <button
          onClick={() => handle("open")}
          disabled={loading}
          className="rounded-lg bg-teal-700 px-3 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
        >
          {loading ? "…" : "Open"}
        </button>
      )}
      {state === "OPEN" && (
        <button
          onClick={() => handle("close")}
          disabled={loading}
          className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-60 transition-colors"
        >
          {loading ? "…" : "Close window"}
        </button>
      )}
      {["CLOSED", "DRAFT", "ADVERTISING"].includes(state) && (
        <button
          onClick={() => handle("archive")}
          disabled={loading || state === "OPEN"}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors"
        >
          Archive
        </button>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
