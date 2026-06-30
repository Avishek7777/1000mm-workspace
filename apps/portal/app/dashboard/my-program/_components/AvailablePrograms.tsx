"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyToProgramAction } from "@/actions/trainees";

type Program = {
  id: string;
  code: string;
  title: string;
  category: string;
  location: string | null;
  startDate: string | Date;
  endDate: string | Date;
  spotsLeft: number | null;
};

function fmt(d: string | Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AvailablePrograms({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function apply(id: string) {
    setLoadingId(id);
    setError(null);
    const res = await applyToProgramAction(id);
    if (!res.ok) {
      setError(res.error ?? "Failed.");
      setLoadingId(null);
    } else {
      setLoadingId(null);
      startTransition(() => router.refresh());
    }
  }

  if (programs.length === 0)
    return (
      <p className="text-sm text-gray-400">
        No active programs are open for applications right now.
      </p>
    );

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}
      {programs.map((p) => (
        <div
          key={p.id}
          className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4"
        >
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-mono text-xs text-gray-400">{p.code}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                {p.category}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{p.title}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {fmt(p.startDate)} – {fmt(p.endDate)}
              {p.location ? ` · ${p.location}` : ""}
              {p.spotsLeft != null ? ` · ${p.spotsLeft} spots left` : ""}
            </p>
          </div>
          <button
            onClick={() => apply(p.id)}
            disabled={loadingId !== null}
            className="shrink-0 rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
          >
            {loadingId === p.id ? "Applying…" : "Apply"}
          </button>
        </div>
      ))}
    </div>
  );
}
