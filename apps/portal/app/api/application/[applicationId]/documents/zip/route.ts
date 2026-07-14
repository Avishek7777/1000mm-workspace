import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import fs from "node:fs/promises";
import path from "node:path";
import { zipSync, strToU8 } from "fflate";

const APPLICANT_DOC_KINDS = [
  "PROFILE_PHOTO",
  "FATHER_NID",
  "MOTHER_NID",
  "EDUCATION_CERTIFICATE",
  "DISTRICT_PASTOR_RECOMMENDATION",
  "NID",
  "BIRTH_CERTIFICATE",
  "PARENT_PASSPORT_PHOTO",
  "BAPTISM_CERTIFICATE",
  "PARENTS_CONSENT",
  "LETTER_OF_INTENT",
];

// Readable folder names per kind
const KIND_LABELS: Record<string, string> = {
  PROFILE_PHOTO: "01_Profile_Photo",
  FATHER_NID: "02_Father_NID",
  MOTHER_NID: "03_Mother_NID",
  EDUCATION_CERTIFICATE: "04_Education_Certificate",
  DISTRICT_PASTOR_RECOMMENDATION: "05_Pastor_Recommendation",
  NID: "06_NID",
  BIRTH_CERTIFICATE: "07_Birth_Certificate",
  PARENT_PASSPORT_PHOTO: "08_Parent_Passport_Photo",
  BAPTISM_CERTIFICATE: "09_Baptism_Certificate",
  PARENTS_CONSENT: "10_Parents_Consent",
  LETTER_OF_INTENT: "11_Letter_of_Intent",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId } = await params;

  // Union-office staff can download any application's documents;
  // an LMD only those submitted from their own mission.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { directedMission: true },
  });

  const isStaff = [
    "MAIN_DIRECTOR",
    "SECRETARY",
    "ASSOCIATE_DIRECTOR",
    "SYSTEM_ADMIN",
  ].includes(user?.role ?? "");
  const isLmd = user?.role === "LOCAL_DIRECTOR" && !!user.directedMission;

  if (!user || (!isStaff && !isLmd)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const app = await prisma.application.findFirst({
    where: {
      id: applicationId,
      deletedAt: null,
      ...(isLmd && !isStaff
        ? { submittedFromMissionId: user.directedMission!.id }
        : {}),
    },
    select: {
      applicantFullName: true,
      referenceNumber: true,
      documents: {
        where: {
          deletedAt: null,
          kind: { in: APPLICANT_DOC_KINDS as any },
        },
        select: { kind: true, fileName: true, storageKey: true },
      },
    },
  });

  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (app.documents.length === 0) {
    return NextResponse.json(
      { error: "No documents to download." },
      { status: 404 },
    );
  }

  // Build zip — { "filename": Uint8Array }
  const zipEntries: Record<string, Uint8Array> = {};

  // Track duplicate kind names (e.g. multiple EDUCATION_CERTIFICATE)
  const kindCount: Record<string, number> = {};

  for (const doc of app.documents) {
    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      ...doc.storageKey.split("/"),
    );

    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(filePath);
    } catch {
      // Skip missing files silently — don't fail the whole zip
      continue;
    }

    kindCount[doc.kind] = (kindCount[doc.kind] ?? 0) + 1;
    const count = kindCount[doc.kind];
    const label = KIND_LABELS[doc.kind] ?? doc.kind;
    const ext = path.extname(doc.fileName);
    const baseName = count > 1 ? `${label}_${count}${ext}` : `${label}${ext}`;

    zipEntries[baseName] = new Uint8Array(fileBuffer);
  }

  if (Object.keys(zipEntries).length === 0) {
    return NextResponse.json(
      { error: "No files could be read." },
      { status: 500 },
    );
  }

  const zipped = zipSync(zipEntries, { level: 0 }); // level 0 = store only (fast, files are already compressed)

  const safeName = (app.referenceNumber ?? app.applicantFullName).replace(
    /[^a-zA-Z0-9_-]/g,
    "_",
  );

  return new NextResponse(zipped, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeName}_Documents.zip"`,
      "Content-Length": String(zipped.byteLength),
    },
  });
}
