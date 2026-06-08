import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-2xl font-bold text-white shadow-lg">
            M
          </div>
        </div>

        {/* 404 */}
        <p className="mb-2 font-mono text-7xl font-bold text-teal-700 leading-none">
          404
        </p>

        <h1 className="mt-4 text-xl font-semibold text-gray-900">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Divider */}
        <div className="my-8 border-t border-gray-200" />

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {/* Footer note */}
        <p className="mt-10 text-[11px] text-gray-400">
          1000MM Bangladesh · Training Platform
        </p>
      </div>
    </div>
  );
}
