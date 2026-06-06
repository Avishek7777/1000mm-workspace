"use client";

import { useState, useCallback } from "react";

type Props = {
  applicationId: string;
  referenceNumber: string;
  missionName: string;
  programTitle: string;
};

export function PdfDownloadButton({
  applicationId,
  referenceNumber,
  missionName,
  programTitle,
}: Props) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    setError(null);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { BioDataPDF } =
        await import("../../my-application/new/_components/BioDataPDF");

      const res = await fetch(`/api/application/${applicationId}/pdf-data`);
      if (!res.ok) throw new Error(`Failed to fetch PDF data: ${res.status}`);
      const data = await res.json();

      const blob = await pdf(
        <BioDataPDF
          {...data}
          referenceNumber={referenceNumber}
          submittedAt={new Date().toISOString()}
          logoUrl="/logos/1000mm-logo.png"
          sdaLogoUrl="/logos/sda-logo.png"
          missionName={missionName}
          programTitle={programTitle}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BioData-${referenceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, [applicationId, referenceNumber, missionName, programTitle]);

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2.5 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {downloading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Generating PDF…
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Bio Data PDF
          </>
        )}
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
