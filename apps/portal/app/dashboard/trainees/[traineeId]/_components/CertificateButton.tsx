"use client";

const CertIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

export function CertificateButton({
  enrollmentId,
  issued,
}: {
  enrollmentId: string;
  issued: boolean;
}) {
  const base = `/api/certificates?enrollmentId=${enrollmentId}`;

  return (
    <div className="inline-flex items-center gap-2">
      <a
        href={base}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-teal-300 bg-white px-4 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 transition-colors"
      >
        <CertIcon />
        {issued ? "Download Certificate" : "Issue & Download Certificate"}
      </a>
      {issued && (
        <a
          href={`${base}&reissue=1`}
          target="_blank"
          rel="noopener noreferrer"
          title="Regenerate with today's issue date and the latest signatories"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Reissue
        </a>
      )}
    </div>
  );
}
