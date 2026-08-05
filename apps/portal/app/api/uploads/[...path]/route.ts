import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth/config";

/**
 * Upload folders the public website is allowed to read without a session.
 *
 * The website renders project and testimony images through next/image, whose
 * optimizer fetches them server-to-server with no cookies — so these must stay
 * open. Everything else here is personal: applicant NIDs, birth and baptism
 * certificates, profile photos, assignment submissions, LMD paperwork. Those
 * now require a logged-in portal session.
 *
 * Matched against the first path segment, which is the `folder` value passed
 * to /api/upload (see lib/uploadFile.ts and lib/r2.ts).
 */
const PUBLIC_PREFIXES = new Set(["projects", "testimonies"]);

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

  const isPublic = PUBLIC_PREFIXES.has(segments[0] ?? "");
  if (!isPublic) {
    const session = await auth();
    if (!session?.user?.id) {
      // 404 rather than 401: an unauthenticated caller learns nothing about
      // whether a given storage key exists.
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
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
        // Public assets get a short shared cache: several upload flows reuse
        // deterministic file names (project extras), so replacements must
        // propagate quickly to the website image optimizer and browsers.
        //
        // Session-gated files must never enter a shared cache. Cloudflare
        // proxies the portal and caches .pdf/.jpg by default, so a `public`
        // directive here would let one applicant's documents be served from
        // the edge to someone else.
        "Cache-Control": isPublic
          ? "public, max-age=60, must-revalidate"
          : "private, no-store",
        ...(isPublic ? {} : { Vary: "Cookie" }),
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
