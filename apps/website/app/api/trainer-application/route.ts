// apps/website/app/api/trainer-application/route.ts
//
// The website and portal deploy as two SEPARATE standalone apps with no
// shared filesystem (see DEPLOY.md) — this route can't write directly into
// the portal's public/uploads/ the way a single-server checkout could.
// Files are instead uploaded to the portal over HTTP via its internal,
// shared-secret-authenticated endpoint (apps/portal/app/api/internal/upload),
// which is what actually serves them afterwards through /api/uploads/[...path].

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@1000mm/db";
import { headers } from "next/headers";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

// ── File storage helper ───────────────────────────────────────────────────────
// Uploads to the portal's /api/internal/upload endpoint and returns the
// storageKey it reports back (relative to the portal's public/uploads/).
async function saveUploadedFile(
  file: File,
  folder: string,
  fileName: string,
): Promise<string> {
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL;
  const secret = process.env.INTERNAL_UPLOAD_SECRET;
  if (!portalUrl || !secret) {
    throw new Error(
      "NEXT_PUBLIC_PORTAL_URL and INTERNAL_UPLOAD_SECRET must both be set for the website to upload trainer-application documents.",
    );
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  fd.append("fileName", fileName);

  const res = await fetch(`${portalUrl}/api/internal/upload`, {
    method: "POST",
    headers: { "x-internal-secret": secret },
    body: fd,
  });
  const data = await res.json();
  if (!res.ok || !data.storageKey) {
    throw new Error(data.error ?? "Upload to portal failed");
  }
  return data.storageKey as string;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // ── Text fields ──────────────────────────────────────────────────────────
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const phone = String(formData.get("phone") ?? "").trim() || null;
    const country = String(formData.get("country") ?? "").trim() || null;
    const fullAddress = String(formData.get("fullAddress") ?? "").trim();
    const specialization = String(formData.get("specialization") ?? "").trim();
    const acceptsSelfFunding = formData.get("acceptsSelfFunding") === "true";
    const requestsInvitationLetter =
      formData.get("requestsInvitationLetter") === "true";

    // ── Basic validation ─────────────────────────────────────────────────────
    if (!fullName || !email || !fullAddress || !specialization) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 },
      );
    }
    if (!acceptsSelfFunding) {
      return NextResponse.json(
        { error: "You must acknowledge the expense policy before applying." },
        { status: 400 },
      );
    }

    // ── Duplicate guard ──────────────────────────────────────────────────────
    const existing = await prisma.trainerApplication.findFirst({
      where: { email, status: { in: ["PENDING", "APPROVED"] } },
    });
    if (existing) {
      return NextResponse.json(
        {
          error:
            "An application from this email address is already under review.",
        },
        { status: 409 },
      );
    }

    // ── File validation ──────────────────────────────────────────────────────
    const cvFile = formData.get("cv") as File | null;
    const passportFile = formData.get("passport") as File | null;
    const photoFile = formData.get("photo") as File | null;

    if (!cvFile || !passportFile || !photoFile) {
      return NextResponse.json(
        { error: "All three documents are required." },
        { status: 400 },
      );
    }

    const fileChecks: [string, File, string[]][] = [
      ["CV", cvFile, ALLOWED_CV_TYPES],
      ["Passport", passportFile, ALLOWED_IMAGE_TYPES],
      ["Photo", photoFile, ALLOWED_IMAGE_TYPES],
    ];
    for (const [label, file, allowed] of fileChecks) {
      if (!allowed.includes(file.type)) {
        return NextResponse.json(
          { error: `${label}: unsupported file type (${file.type}).` },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `${label}: file exceeds 10 MB limit.` },
          { status: 400 },
        );
      }
    }

    // ── Save files (uploaded to the portal — see saveUploadedFile above) ─────
    // The portal's internal upload endpoint appends the extension itself
    // based on the file's MIME type, so fileName is passed without one.
    const slug = email
      .split("@")[0]
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()
      .slice(0, 30);
    const ts = Date.now();

    const [cvKey, passportKey, photoKey] = await Promise.all([
      saveUploadedFile(cvFile, "trainer-applications", `${slug}-${ts}-cv`),
      saveUploadedFile(passportFile, "trainer-applications", `${slug}-${ts}-passport`),
      saveUploadedFile(photoFile, "trainer-applications", `${slug}-${ts}-photo`),
    ]);

    // ── IP address ───────────────────────────────────────────────────────────
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
      headersList.get("x-real-ip") ??
      null;

    // ── Create DB record ─────────────────────────────────────────────────────
    await prisma.trainerApplication.create({
      data: {
        fullName,
        email,
        phone,
        country,
        fullAddress,
        specialization,
        acceptsSelfFunding,
        requestsInvitationLetter,
        cvStorageKey: cvKey,
        passportStorageKey: passportKey,
        photoStorageKey: photoKey,
        ipAddress,
      },
    });

    // ── Notify SA (wire to Resend when email is ready) ───────────────────────
    console.log(
      `[DEV EMAIL] New trainer application from ${fullName} <${email}> — review at ${process.env.NEXT_PUBLIC_PORTAL_URL}/dashboard/system-admin/trainer-applications`,
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[trainer-application POST]", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
