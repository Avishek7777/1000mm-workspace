import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const ALLOWED_UPLOAD_MIME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "text/plain": "txt",
};

const EXPECTED_EXTS: Record<string, string[]> = {
  pdf: ["pdf"], doc: ["doc"], docx: ["docx"],
  xls: ["xls"], xlsx: ["xlsx"], ppt: ["ppt"], pptx: ["pptx"],
  jpg: ["jpg", "jpeg"], png: ["png"], gif: ["gif"], webp: ["webp"], txt: ["txt"],
};

export type SaveFileResult =
  | { ok: true; storageKey: string; fileName: string; fileSizeBytes: number; mimeType: string }
  | { ok: false; error: string; status: number };

/**
 * Shared implementation behind both /api/upload (session-authed, used by the
 * portal UI) and /api/internal/upload (shared-secret-authed, used by the
 * website's server-to-server calls). Validates MIME/extension, writes to
 * public/uploads relative to the portal app's own cwd, and returns the
 * relative storageKey served by /api/uploads/[...path].
 */
export async function saveUploadedFile(
  file: File,
  folder: string,
  fileName: string | null,
  maxBytes: number,
): Promise<SaveFileResult> {
  if (file.size > maxBytes) {
    return { ok: false, error: `File too large (max ${Math.round(maxBytes / 1024 / 1024)} MB)`, status: 413 };
  }

  const ext = ALLOWED_UPLOAD_MIME_TYPES[file.type];
  if (!ext) return { ok: false, error: "File type not allowed", status: 415 };

  const declaredExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!EXPECTED_EXTS[ext]?.includes(declaredExt)) {
    return { ok: false, error: "File extension does not match file type", status: 415 };
  }

  const safeFolder = folder
    .split("/")
    .map((segment) => segment.replace(/[^a-z0-9_-]/gi, "_"))
    .filter(Boolean)
    .join("/");
  const safeFileName = fileName?.replace(/[^a-z0-9_-]/gi, "_") || null;
  const uniqueName = `${safeFileName ?? randomUUID()}.${ext}`;
  const storageKey = `${safeFolder}/${uniqueName}`;

  const dir = path.join(process.cwd(), "public", "uploads", safeFolder);
  await fs.mkdir(dir, { recursive: true });

  if (safeFileName) {
    const entries = await fs.readdir(dir).catch(() => [] as string[]);
    await Promise.all(
      entries
        .filter((entry) => entry !== uniqueName && entry.startsWith(`${safeFileName}.`))
        .map((entry) => fs.unlink(path.join(dir, entry)).catch(() => {})),
    );
  }

  await fs.writeFile(path.join(dir, uniqueName), Buffer.from(await file.arrayBuffer()));

  return {
    ok: true,
    storageKey,
    fileName: file.name,
    fileSizeBytes: file.size,
    mimeType: file.type,
  };
}
