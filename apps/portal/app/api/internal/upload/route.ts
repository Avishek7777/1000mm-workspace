import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile } from "@/lib/uploadFile";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — matches the website's own cap

/**
 * Server-to-server upload endpoint for the website app.
 *
 * The website and portal deploy as two separate standalone bundles with no
 * shared filesystem (see DEPLOY.md) — a public-facing website route can't
 * write directly into the portal's public/uploads/ the way a single-server
 * checkout could. This endpoint lets the website's server-side routes (e.g.
 * the public trainer-application form) save a file into the portal's local
 * storage over HTTP instead, authenticated with a shared secret rather than
 * a user session (there is no logged-in portal user in that flow).
 *
 * Not for browser use: INTERNAL_UPLOAD_SECRET must never reach client code.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.INTERNAL_UPLOAD_SECRET;
  if (!secret || req.headers.get("x-internal-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string | null) ?? "misc";
  const fileName = (formData.get("fileName") as string | null)?.trim() || null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const result = await saveUploadedFile(file, folder, fileName, MAX_BYTES);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { ok: _ok, ...body } = result;
  return NextResponse.json(body);
}
