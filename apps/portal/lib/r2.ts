/**
 * Local filesystem storage — development/self-hosted replacement for R2.
 *
 * Files are written to:  <project_root>/public/uploads/{prefix}/{year}/{randomHex}.{ext}
 * Files are served at:   http://localhost:3001/uploads/{prefix}/{year}/{randomHex}.{ext}
 *
 * The `public/uploads/` folder is gitignored (add it if not already).
 *
 * To switch to R2 later: replace this file with the R2 version.
 * Everything else in the codebase stays the same.
 *
 * Set in your .env.local:
 *   NEXT_PUBLIC_APP_URL=http://localhost:3001   ← used to build public URLs
 */

import { randomBytes } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

// Resolve the uploads directory relative to the Next.js project root.
// process.cwd() in Next.js always points to the app root (where package.json is).
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export type UploadResult = {
  storageKey: string; // relative path used as DB reference, e.g. "profile-photos/2026/abc123.jpg"
  publicUrl: string; // full URL to serve the file
  fileName: string; // original file name
  mimeType: string;
  fileSizeBytes: number;
};

/**
 * Save a file buffer to the local filesystem.
 *
 * storageKey format: {prefix}/{year}/{randomHex}.{ext}
 * e.g. "profile-photos/2026/a3f9c12b.jpg"
 */
export async function uploadToR2(
  buffer: Buffer,
  originalFileName: string,
  mimeType: string,
  prefix: string,
): Promise<UploadResult> {
  const ext = path.extname(originalFileName).toLowerCase() || ".bin";
  const year = new Date().getFullYear();
  const randomHex = randomBytes(16).toString("hex");
  const storageKey = `${prefix}/${year}/${randomHex}${ext}`;

  const destDir = path.join(UPLOADS_DIR, prefix, String(year));
  const destFile = path.join(UPLOADS_DIR, ...storageKey.split("/"));

  // Ensure the directory exists
  await fs.mkdir(destDir, { recursive: true });

  // Write the file
  await fs.writeFile(destFile, buffer);

  return {
    storageKey,
    publicUrl: `${appUrl}/uploads/${storageKey}`,
    fileName: originalFileName,
    mimeType,
    fileSizeBytes: buffer.byteLength,
  };
}

/** Map DocumentKind to a storage prefix folder */
export const r2Prefix: Record<string, string> = {
  PROFILE_PHOTO: "profile-photos",
  FATHER_NID: "family-nids",
  MOTHER_NID: "family-nids",
  EDUCATION_CERTIFICATE: "education-certs",
  DISTRICT_PASTOR_RECOMMENDATION: "app-docs",
  NID: "app-docs",
  BIRTH_CERTIFICATE: "app-docs",
  PARENT_PASSPORT_PHOTO: "app-docs",
  BAPTISM_CERTIFICATE: "app-docs",
  PARENTS_CONSENT: "app-docs",
  LETTER_OF_INTENT: "app-docs",
  RECOMMENDATION_LETTER: "lmd-docs",
  SWORN_STATEMENT: "lmd-docs",
  EXCOM_VOTE_COPY: "lmd-docs",
};
