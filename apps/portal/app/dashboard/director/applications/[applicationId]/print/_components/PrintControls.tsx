"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export function PrintControls({ backHref }: { backHref: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    let cancelled = false;

    // Wait for every image on the page (profile photo, logos) to finish
    // loading before opening the print dialog, capped at 4s so a broken
    // image can't block printing forever.
    const pending = Array.from(document.images)
      .filter((img) => !img.complete)
      .map(
        (img) =>
          new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
      );
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 4000));

    Promise.race([Promise.all(pending), timeout]).then(() => {
      if (!cancelled) window.print();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="no-print mb-6 flex items-center justify-between">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
      >
        ← Back to Applications
      </Link>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        Print
      </button>
    </div>
  );
}
