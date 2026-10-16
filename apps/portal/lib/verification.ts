import "server-only";

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { prisma } from "@1000mm/db";

/**
 * Card / certificate verification.
 *
 * The reference number printed on a card is sequential —
 * `{MISSION}-{YEAR}-{00001}`, four mission codes and a counter from 1 — so the
 * whole space can be enumerated with a few thousand requests. Keying the public
 * /verify page off it would hand out every trainee's name, mission, deployment
 * location and photo to anyone willing to count.
 *
 * So QR links carry an unguessable token instead. Scanning a card you are
 * holding shows the full record; guessing reference numbers shows a reduced one
 * with no photo and no deployment location (see VERIFY_FULL vs VERIFY_LIMITED
 * at the /verify page).
 */

/** 32 lowercase hex chars — distinguishable from any reference number. */
const TOKEN_BYTES = 16;

export const VERIFY_TOKEN_RE = /^[0-9a-f]{32}$/;

/**
 * Return this enrollment's verification token, creating one on first use.
 *
 * Generated lazily at print time rather than backfilled, so tokens exist only
 * for records that have actually been issued.
 */
export async function ensureVerifyToken(enrollmentId: string): Promise<string> {
  const existing = await prisma.programEnrollment.findUnique({
    where: { id: enrollmentId },
    select: { verifyToken: true },
  });
  if (existing?.verifyToken) return existing.verifyToken;

  // Retry on the vanishingly unlikely unique collision, and on the realistic
  // race where two prints of the same card land at once.
  for (let attempt = 0; attempt < 5; attempt++) {
    const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
    try {
      await prisma.programEnrollment.update({
        where: { id: enrollmentId },
        data: { verifyToken: token },
      });
      return token;
    } catch {
      const now = await prisma.programEnrollment.findUnique({
        where: { id: enrollmentId },
        select: { verifyToken: true },
      });
      if (now?.verifyToken) return now.verifyToken;
    }
  }
  throw new Error(`Could not assign a verify token to enrollment ${enrollmentId}`);
}

/** The URL to encode in a QR code for this enrollment. */
export async function verifyUrlFor(enrollmentId: string): Promise<string> {
  const token = await ensureVerifyToken(enrollmentId);
  // /verify lives on the portal itself; NEXT_PUBLIC_APP_URL points to the
  // public website, so it must not be used here.
  const base = process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://portal.1000mmbd.org";
  return `${base}/verify/${token}`;
}

// ─── Photos ───────────────────────────────────────────────────────────────────

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

// @react-pdf/renderer only decodes JPEG and PNG. A WebP (which the
// self-service profile upload accepts) would throw mid-render and lose a whole
// sheet, so unsupported types are skipped and the card keeps its placeholder.
const PDF_SAFE_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

/** Roughly the card's 56x72pt photo box at print resolution. */
export const CARD_PHOTO_SIZE = { width: 233, height: 300 };

/**
 * Read an uploaded image off disk, downscaled, as a data URL.
 *
 * Deliberately not an HTTP fetch of /api/uploads/...: that route requires a
 * session which a server-side render does not carry, and `profile-photos` is
 * not one of its public prefixes. Reading from disk also means a photo never
 * has to be reachable over the network to appear on a card or a verify page —
 * it is inlined into the response instead.
 *
 * Uploads are capped at 2 MB each; embedding them raw put ~250 KB per card
 * into a PDF, so a whole programme's sheet ran to tens of MB and risked OOM
 * while rendering. Downscaling takes a real photo from 248 KB to 25 KB.
 */
export async function loadPhotoDataUrl(
  storageKey: string | null | undefined,
  size: { width: number; height: number } = CARD_PHOTO_SIZE,
): Promise<string | null> {
  if (!storageKey) return null;

  // Accept both a bare storageKey and a stored "/uploads/..." URL.
  const key = storageKey.replace(/^\/+/, "").replace(/^uploads\//, "");
  // Refuse anything that could climb out of the uploads root.
  if (key.split("/").some((seg) => seg === "." || seg === "..")) return null;

  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  const mime = PDF_SAFE_MIME[ext];
  if (!mime) return null;

  const full = path.join(UPLOADS_ROOT, key);
  if (!full.startsWith(UPLOADS_ROOT)) return null;

  let raw: Buffer;
  try {
    raw = fs.readFileSync(full);
  } catch {
    // Missing file is normal — not every trainee has a photo on record.
    return null;
  }

  try {
    const resized = await sharp(raw)
      .rotate() // honour EXIF orientation, or phone photos come out sideways
      .resize(size.width, size.height, { fit: "cover", position: "top" })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${resized.toString("base64")}`;
  } catch {
    // Rather than lose the photo, fall back to the original bytes.
    return `data:${mime};base64,${raw.toString("base64")}`;
  }
}


/**
 * The photograph for an application: the FIRST PROFILE_PHOTO uploaded.
 *
 * Callers must pass `documents` ordered by `createdAt` ascending.
 *
 * Deliberately not `Application.profilePhotoDocumentId`. That field is
 * rewritten on every upload, so it tracks the most recent file rather than an
 * approved choice — and the most recent file is not trustworthy. On
 * SBM-2026-00004 the newest of two uploads is a photograph of a different
 * person entirely, which is exactly how a stranger's face reached a printed
 * card. The oldest is what the review page shows (it fetches `createdAt: asc`
 * and takes the first), so it is the image a reviewer actually looked at when
 * they accepted the application.
 *
 * This is a safe default, not a correct answer. Where an application carries
 * several photographs, only a human can say which is the holder — 15 of 27
 * enrolled trainees were in that state as of 2026-10-16. Staff need a way to
 * choose explicitly; until then, what was reviewed is what prints.
 */
export function pickApplicationPhotoKey(
  app:
    | { documents: { id: string; storageKey: string }[] }
    | null
    | undefined,
): string | null {
  return app?.documents[0]?.storageKey ?? null;
}

/**
 * The photo to print for an enrollment.
 *
 * When an application is linked, its photograph is the ONLY acceptable source:
 * that is the identity that was reviewed and accepted. The account's
 * self-service `profilePicture` is deliberately not a fallback here — a portal
 * account is not necessarily the applicant (one may be shared, or registered
 * under a relative's name), so falling back to it put a casual snapshot of a
 * different person onto official cards.
 *
 * The account picture is used only when there is no application at all, i.e. a
 * trainee placed on a roster by hand, where the account is the only identity on
 * record.
 */
export async function loadEnrollmentPhoto(
  applicationPhotoKey: string | null | undefined,
  hasApplication: boolean,
  profilePicture: string | null | undefined,
  size?: { width: number; height: number },
): Promise<string | null> {
  if (hasApplication) return loadPhotoDataUrl(applicationPhotoKey, size);
  return loadPhotoDataUrl(profilePicture, size);
}
