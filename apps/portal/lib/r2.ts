import { randomBytes } from "node:crypto";
import path from "node:path";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

// const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
// const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
// const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const BUCKET_NAME = process.env.SUPABASE_S3_BUCKET!;
const PUBLIC_URL_BASE = process.env.SUPABASE_S3_PUBLIC_URL!;

const s3 = new S3Client({
  region: process.env.SUPABASE_S3_REGION!,
  endpoint: process.env.SUPABASE_S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // required for Supabase's S3-compatible endpoint
});

export type UploadResult = {
  storageKey: string;
  publicUrl: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
};

/**
 * Upload a file buffer to R2.
 * Pass `deterministicName` to overwrite/replace a known slot (e.g. a user's
 * profile photo, keyed by userId) instead of generating a random key.
 */
export async function uploadToR2(
  buffer: Buffer,
  originalFileName: string,
  mimeType: string,
  prefix: string,
  options?: { deterministicName?: string },
): Promise<UploadResult> {
  const ext =
    path.extname(originalFileName).toLowerCase().replace(".", "") || "bin";

  const storageKey = options?.deterministicName
    ? `${prefix}/${options.deterministicName}.${ext}`
    : `${prefix}/${new Date().getFullYear()}/${randomBytes(16).toString("hex")}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storageKey,
      Body: buffer,
      ContentType: mimeType,
    }),
  );

  return {
    storageKey,
    publicUrl: `${PUBLIC_URL_BASE}/${storageKey}`,
    fileName: originalFileName,
    mimeType,
    fileSizeBytes: buffer.byteLength,
  };
}

export async function deleteFromR2(storageKey: string): Promise<void> {
  await s3
    .send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: storageKey }))
    .catch(() => {});
}

/**
 * Delete all objects whose key starts with `keyPrefix` — used to clear out
 * a previous upload before writing a new one (e.g. old profile photo with
 * a different extension). Include a trailing separator (e.g. "." or "/")
 * in keyPrefix to avoid accidentally matching unrelated keys with a shared
 * string prefix.
 */
export async function deleteByKeyPrefix(keyPrefix: string): Promise<void> {
  const listed = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET_NAME, Prefix: keyPrefix }),
  );
  const keys = (listed.Contents ?? [])
    .map((o) => o.Key)
    .filter((k): k is string => !!k);
  if (keys.length === 0) return;

  await s3
    .send(
      new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      }),
    )
    .catch(() => {});
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
