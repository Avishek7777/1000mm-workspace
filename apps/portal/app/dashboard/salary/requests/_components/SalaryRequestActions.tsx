"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewSalaryRequestAction } from "@/actions/salary";

export function SalaryRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handle(status: "APPROVED" | "REJECTED") {
    setError(null);
    const formData = new FormData();
    formData.set("notes", notes);
    const bound = reviewSalaryRequestAction.bind(null, requestId, status);
    const result = await bound({ ok: false }, formData);
    if (!result.ok) {
      setError(result.error ?? "Failed.");
    } else {
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && <p className="text-[10px] text-red-500">{error}</p>}
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional note…"
        className="w-40 rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-teal-400"
      />
      <div className="flex gap-2">
        <button
          onClick={() => handle("REJECTED")}
          disabled={isPending}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
        >
          Reject
        </button>
        <button
          onClick={() => handle("APPROVED")}
          disabled={isPending}
          className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
        >
          Approve
        </button>
      </div>
    </div>
  );
}
