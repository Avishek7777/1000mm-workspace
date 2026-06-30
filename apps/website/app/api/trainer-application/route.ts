// apps/website/app/api/trainer-application/route.ts
//
// Saves uploaded files to the LOCAL filesystem under the shared uploads folder.
// The portal's /api/uploads/[...path]/route.ts already serves files from this
// same folder, so no extra serving logic is needed.
//
// Storage path (matches portal convention):
//   <monorepo-root>/uploads/trainer-applications/<slug>-<timestamp>-<kind>.<ext>
//
// When R2 is wired up later, replace the writeFileToUploads() helper here and
// in apps/portal/lib/r2.ts at the same time.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@1000mm/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { headers } from "next/headers";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

// ── File storage helper ───────────────────────────────────────────────────────
// Mirrors the saveFile() behaviour in apps/portal/lib/r2.ts.
// Writes to <monorepo-root>/uploads/<storageKey> and returns storageKey.
async function saveUploadedFile(
  file: File,
  storageKey: string,
): Promise<string> {
  // __dirname is inside .next at runtime, so resolve relative to cwd() which
  // Next.js sets to the app root (apps/website). Go up two levels to reach
  // the monorepo root where the shared uploads/ folder lives.
  const uploadsRoot = path.resolve(process.cwd(), "../../uploads");
  const fullPath = path.join(uploadsRoot, storageKey);
  const dir = path.dirname(fullPath);

  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);

  return storageKey;
}

function fileExtension(file: File): string {
  // Prefer the original filename extension; fall back to mime-type mapping
  const fromName = file.name.includes(".") ? file.name.split(".").pop()! : "";
  if (fromName) return fromName.toLowerCase();
  const mimeMap: Record<string, string> = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "image/jpeg": "jpg",
    "image/png": "png",
  };
  return mimeMap[file.type] ?? "bin";
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

    // ── Save files ───────────────────────────────────────────────────────────
    // Storage keys are relative paths inside the uploads/ folder.
    // e.g. "trainer-applications/john-doe-1234567890-cv.pdf"
    const slug = email
      .split("@")[0]
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()
      .slice(0, 30);
    const ts = Date.now();

    const cvKey = `trainer-applications/${slug}-${ts}-cv.${fileExtension(cvFile)}`;
    const passportKey = `trainer-applications/${slug}-${ts}-passport.${fileExtension(passportFile)}`;
    const photoKey = `trainer-applications/${slug}-${ts}-photo.${fileExtension(photoFile)}`;

    await Promise.all([
      saveUploadedFile(cvFile, cvKey),
      saveUploadedFile(passportFile, passportKey),
      saveUploadedFile(photoFile, photoKey),
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
