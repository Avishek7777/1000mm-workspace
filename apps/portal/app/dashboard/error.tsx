"use client";

import { useEffect } from "react";
import { Database, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDbError =
    error.message?.includes("Can't reach database") ||
    error.message?.includes("PrismaClientInitializationError") ||
    error.message?.includes("localhost:5433");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${isDbError ? "bg-amber-100" : "bg-red-100"}`}>
        {isDbError ? (
          <Database className="h-7 w-7 text-amber-500" />
        ) : (
          <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v.008H12v-.008zm9.303-7.124c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.052 3.378c.866-1.5 3.032-1.5 3.898 0l7.353 12.748z" />
          </svg>
        )}
      </div>

      <h2 className="text-base font-semibold text-gray-900">
        {isDbError ? "Database unavailable" : "Something went wrong"}
      </h2>

      <p className="mt-1.5 max-w-sm text-sm text-gray-500">
        {isDbError
          ? "The database server is not reachable. Make sure PostgreSQL is running on port 5433, then try again."
          : "An unexpected error occurred while loading this page."}
      </p>

      {error.digest && (
        <p className="mt-2 font-mono text-[10px] text-gray-300">ref: {error.digest}</p>
      )}

      <button
        onClick={reset}
        className="mt-6 flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Try Again
      </button>
    </div>
  );
}
