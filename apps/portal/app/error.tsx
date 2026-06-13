"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-2xl font-bold text-white shadow-lg">
            M
          </div>
        </div>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-gray-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          An unexpected error occurred. The team has been notified.
        </p>

        {/* Error digest for debugging */}
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-gray-400">
            Error ID: {error.digest}
          </p>
        )}

        {/* Divider */}
        <div className="my-8 border-t border-gray-200" />

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        <p className="mt-10 text-[11px] text-gray-400">
          1000MM Bangladesh · Training Platform
        </p>
      </div>
    </div>
  );
}
