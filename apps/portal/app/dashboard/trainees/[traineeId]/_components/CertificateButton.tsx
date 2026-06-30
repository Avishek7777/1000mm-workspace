"use client";

export function CertificateButton({
  enrollmentId,
  issued,
}: {
  enrollmentId: string;
  issued: boolean;
}) {
  const url = `/api/certificates?enrollmentId=${enrollmentId}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-teal-300 bg-white px-4 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 transition-colors"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
      </svg>
      {issued ? "Download Certificate" : "Issue & Download Certificate"}
    </a>
  );
}
