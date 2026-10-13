import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { IdCardPdf } from "@/lib/exports/IdCardPdf";
import QRCode from "qrcode";
import sharp from "sharp";
import fs from "fs";
import path from "path";

function loadLogoDataUrl(): string {
  try {
    const logoPath = path.join(process.cwd(), "public", "logos", "1000mm-logo.png");
    const buffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return "";
  }
}

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

// @react-pdf/renderer only decodes JPEG and PNG. A WebP (which the
// self-service profile upload accepts) would throw mid-render and lose the
// whole sheet, so unsupported types are skipped and the card keeps its
// placeholder instead.
const PDF_SAFE_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

// The card's photo box is 56x72pt; this is roughly that at print resolution.
// Uploads are capped at 2 MB each, and embedding them raw put ~250 KB per
// card into the PDF — a whole program's sheet would run to tens of MB and
// risk OOM on the 3.8 GB VPS while rendering.
const PHOTO_W = 233;
const PHOTO_H = 300;

/**
 * Read an uploaded image off disk, downscaled, as a data URL.
 *
 * Deliberately not an HTTP fetch of /api/uploads/...: that route requires a
 * session which a server-side render does not carry, and `profile-photos` is
 * not in its public prefix list. Reading the file directly also means the
 * photo never has to be reachable over the network to end up on a card.
 */
async function loadUploadDataUrl(
  storageKey: string | null | undefined,
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
      .resize(PHOTO_W, PHOTO_H, { fit: "cover", position: "top" })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${resized.toString("base64")}`;
  } catch {
    // Rather than lose the photo, fall back to the original bytes.
    return `data:${mime};base64,${raw.toString("base64")}`;
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const isSA = user.role === "SYSTEM_ADMIN";
  const isUD = user.role === "MAIN_DIRECTOR" || user.role === "SECRETARY" || user.role === "ASSOCIATE_DIRECTOR";

  if (!isSA && !isUD) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (isUD) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "idcards.printing_enabled" },
    });
    const enabled = (setting?.value as boolean | null) ?? false;
    if (!enabled) {
      return new NextResponse(
        "ID card printing is not currently enabled by the System Admin.",
        { status: 403 },
      );
    }
  }

  const { searchParams } = new URL(req.url);
  const programId = searchParams.get("programId") ?? undefined;
  const enrollmentIdsParam = searchParams.get("enrollmentIds") ?? undefined;
  const enrollmentIds = enrollmentIdsParam
    ? enrollmentIdsParam.split(",").filter(Boolean)
    : undefined;

  if (!programId && !enrollmentIds?.length) {
    return new NextResponse("Provide programId or enrollmentIds.", { status: 400 });
  }

  const enrollments = await prisma.programEnrollment.findMany({
    where: {
      deletedAt: null,
      // On the roster — not "has an accepted application". Trainees placed
      // manually may have no application row linked to their enrollment.
      status: "ENROLLED",
      ...(programId ? { programId } : {}),
      ...(enrollmentIds?.length ? { id: { in: enrollmentIds } } : {}),
    },
    include: {
      trainee: {
        select: {
          id: true,
          fullName: true,
          profilePicture: true,
          homeMission: { select: { code: true } },
        },
      },
      program: {
        select: {
          code: true,
          title: true,
          endDate: true,
          batch: true,
        },
      },
      application: {
        select: {
          referenceNumber: true,
          // The passport photo submitted with the application is the official
          // one for a card; the self-service profile picture is a fallback.
          documents: {
            where: { kind: "PROFILE_PHOTO", deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { storageKey: true },
          },
        },
      },
    },
    orderBy: [
      { trainee: { homeMission: { code: "asc" } } },
      { trainee: { fullName: "asc" } },
    ],
  });

  if (enrollments.length === 0) {
    return new NextResponse("No enrolled trainees found.", { status: 404 });
  }

  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const logoUrl = loadLogoDataUrl();
  // /verify lives on the portal itself; NEXT_PUBLIC_APP_URL points to the
  // public website, so it must not be used here.
  const appUrl =
    process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://portal.1000mmbd.org";

  const cards = await Promise.all(
    enrollments.map(async (e) => {
      const refNum = e.application?.referenceNumber ?? e.id.slice(-8).toUpperCase();
      const qrDataUrl = await QRCode.toDataURL(`${appUrl}/verify/${refNum}`, {
        width: 80,
        margin: 1,
        color: { dark: "#0F6E56", light: "#FAFAF8" },
      });
      const photoDataUrl =
        (await loadUploadDataUrl(e.application?.documents[0]?.storageKey)) ??
        (await loadUploadDataUrl(e.trainee.profilePicture));

      return {
        enrollmentId: e.id,
        referenceNumber: refNum,
        photoDataUrl,
        fullName: e.trainee.fullName,
        missionCode: e.trainee.homeMission?.code ?? "—",
        programCode: e.program.code,
        programTitle: e.program.title,
        batch: e.program.batch ?? null,
        enrolledAt: new Date(e.enrolledAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        validUntil: new Date(e.program.endDate).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        qrDataUrl,
      };
    }),
  );

  await prisma.auditLog.create({
    data: {
      action: "ID_CARDS_GENERATED",
      actorId: user.id,
      actorRole: user.role,
      targetType: "ProgramEnrollment",
      details: {
        count: cards.length,
        programId: programId ?? null,
        selective: !!enrollmentIds?.length,
      },
    },
  });

  const buffer = await renderToBuffer(IdCardPdf({ cards, generatedAt, logoUrl }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="id-cards-${Date.now()}.pdf"`,
    },
  });
}
