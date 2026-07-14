import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  // Reject any segment that could escape the uploads roots (e.g. "..").
  if (
    segments.some(
      (s) => s === ".." || s === "." || s.includes("/") || s.includes("\\"),
    )
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", ...segments);
  // Legacy location: the website's trainer-application route used to write to
  // <monorepo-root>/uploads before both apps standardized on public/uploads.
  const legacyPath = path.join(process.cwd(), "..", "..", "uploads", ...segments);

  try {
    const buffer = await fs
      .readFile(filePath)
      .catch(() => fs.readFile(legacyPath));
    const ext = segments[segments.length - 1].split(".").pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      txt: "text/plain",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };
    const contentType = mimeTypes[ext ?? ""] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        // inline = open in browser, attachment = force download
        "Content-Disposition": "inline",
        // Short-lived cache: several upload flows reuse deterministic file
        // names (project extras, profile photos), so replacements must
        // propagate quickly to the website image optimizer and browsers.
        "Cache-Control": "public, max-age=60, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
