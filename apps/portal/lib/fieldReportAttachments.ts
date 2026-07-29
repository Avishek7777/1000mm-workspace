// Shared between the submit form (client) and the submit action (server) —
// a "use server" module may only export async functions, so these limits live
// here instead of in actions/fieldReports.ts.

/** Optional report attachments: at most 5 files, 2 MB each, PDF or image only. */
export const MAX_REPORT_ATTACHMENTS = 5;
export const MAX_REPORT_ATTACHMENT_BYTES = 2 * 1024 * 1024;

export const ALLOWED_REPORT_ATTACHMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/** `accept` attribute for the file inputs — mirrors the MIME list above. */
export const REPORT_ATTACHMENT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.gif";

export type FieldReportAttachment = {
  storageKey: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
