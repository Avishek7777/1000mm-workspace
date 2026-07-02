import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ALLOWED_MIME_TYPES: Record<string, string> = {
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

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string | null) ?? "misc";
  const fileName = (formData.get("fileName") as string | null)?.trim() || null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 413 });
  }

  const ext = ALLOWED_MIME_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 415 });
  }

  // Cross-validate the actual file extension against the declared MIME type to
  // prevent MIME spoofing (e.g. renaming malware.exe to file.png).
  const declaredExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  const expectedExts: Record<string, string[]> = {
    pdf: ["pdf"], doc: ["doc"], docx: ["docx"],
    xls: ["xls"], xlsx: ["xlsx"], ppt: ["ppt"], pptx: ["pptx"],
    jpg: ["jpg", "jpeg"], png: ["png"], gif: ["gif"], webp: ["webp"], txt: ["txt"],
  };
  if (!expectedExts[ext]?.includes(declaredExt)) {
    return NextResponse.json({ error: "File extension does not match file type" }, { status: 415 });
  }

  // Sanitize folder name to path-safe segments (slashes allowed for nesting,
  // e.g. "projects/training-center")
  const safeFolder = folder
    .split("/")
    .map((segment) => segment.replace(/[^a-z0-9_-]/gi, "_"))
    .filter(Boolean)
    .join("/");
  // A deterministic file name (e.g. "cover") lets callers organize uploads
  // predictably instead of an opaque UUID; falls back to a UUID otherwise.
  const safeFileName = fileName?.replace(/[^a-z0-9_-]/gi, "_") || null;
  const uniqueName = `${safeFileName ?? randomUUID()}.${ext}`;
  const storageKey = `${safeFolder}/${uniqueName}`;

  const dir = path.join(process.cwd(), "public", "uploads", safeFolder);
  await fs.mkdir(dir, { recursive: true });

  if (safeFileName) {
    // Replacing a deterministic-named file: remove any stale sibling with a
    // different extension (e.g. previous upload was .png, this one is .jpg)
    // so it doesn't linger as an orphan.
    const entries = await fs.readdir(dir).catch(() => [] as string[]);
    await Promise.all(
      entries
        .filter((entry) => entry !== uniqueName && entry.startsWith(`${safeFileName}.`))
        .map((entry) => fs.unlink(path.join(dir, entry)).catch(() => {})),
    );
  }

  await fs.writeFile(path.join(dir, uniqueName), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({
    storageKey,
    fileName: file.name,
    fileSizeBytes: file.size,
    mimeType: file.type,
  });
}
