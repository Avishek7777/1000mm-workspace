import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const filePath = path.join(process.cwd(), "public", "uploads", ...segments);

  try {
    const buffer = await fs.readFile(filePath);
    const ext = segments[segments.length - 1].split(".").pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
    };
    const contentType = mimeTypes[ext ?? ""] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        // inline = open in browser, attachment = force download
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
