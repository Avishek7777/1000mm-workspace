/**
 * Cloudflare R2 client + upload helper.
 *
 * Credentials are read from env vars. Leave them blank during development —
 * uploadToR2 will throw a clear error if called without creds, but the rest
 * of the app (form UI, DB writes) will still work fine.
 *
 * Add to your .env.local:
 *   R2_ACCOUNT_ID=
 *   R2_ACCESS_KEY_ID=
 *   R2_SECRET_ACCESS_KEY=
 *   R2_BUCKET_NAME=
 *   R2_PUBLIC_URL=          ← the public bucket URL or a custom domain
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "node:crypto";
import path from "node:path";

const accountId = process.env.R2_ACCOUNT_ID ?? "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";
const bucketName = process.env.R2_BUCKET_NAME ?? "";
const publicUrl = process.env.R2_PUBLIC_URL ?? "";

// Lazily instantiated so missing creds don't crash on import
let _client: S3Client | null = null;
function getClient(): S3Client {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 credentials are not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in your .env.local.",
    );
  }
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _client;
}

export type UploadResult = {
  storageKey: string;
  publicUrl: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
};

/**
 * Upload a file buffer to R2.
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
  if (!bucketName) {
    throw new Error("R2_BUCKET_NAME is not configured.");
  }

  const ext = path.extname(originalFileName).toLowerCase() || ".bin";
  const year = new Date().getFullYear();
  const randomHex = randomBytes(16).toString("hex");
  const storageKey = `${prefix}/${year}/${randomHex}${ext}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
      Body: buffer,
      ContentType: mimeType,
      ContentDisposition: `inline; filename="${originalFileName}"`,
    }),
  );

  return {
    storageKey,
    publicUrl: `${publicUrl}/${storageKey}`,
    fileName: originalFileName,
    mimeType,
    fileSizeBytes: buffer.byteLength,
  };
}

/** Map DocumentKind to an R2 storage prefix */
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
