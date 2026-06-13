"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  publishProgramAction,
  unpublishProgramAction,
} from "@/actions/programs";

// ── Publish / Unpublish toggle ────────────────────────────────────────────────

export function PublishToggle({
  programId,
  isPublished,
  canPublish,
  hasOpenWindow,
}: {
  programId: string;
  isPublished: boolean;
  canPublish: boolean;
  hasOpenWindow: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handle() {
    setLoading(true);
    setError(null);
    const result = isPublished
      ? await unpublishProgramAction(programId)
      : await publishProgramAction(programId);

    if (!result.ok) {
      setError(result.error ?? "Failed.");
      setLoading(false);
    } else {
      startTransition(() => router.refresh());
      setLoading(false);
    }
  }

  const disabled = loading || (!isPublished && !canPublish);
  const title =
    !isPublished && !canPublish
      ? "Maximum active programs reached"
      : isPublished && hasOpenWindow
        ? "Close the window first"
        : undefined;

  return (
    <div>
      <button
        onClick={handle}
        disabled={disabled || (isPublished && hasOpenWindow)}
        title={title}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          isPublished
            ? "border border-amber-300 bg-white text-amber-700 hover:bg-amber-50"
            : "border border-teal-300 bg-white text-teal-700 hover:bg-teal-50"
        }`}
      >
        {loading ? "…" : isPublished ? "Unpublish" : "Publish"}
      </button>
      {error && <p className="mt-1 text-[10px] text-red-500">{error}</p>}
    </div>
  );
}
