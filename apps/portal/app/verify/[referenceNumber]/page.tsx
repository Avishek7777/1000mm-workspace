import { prisma } from "@1000mm/db";
import { VERIFY_TOKEN_RE, loadEnrollmentPhoto } from "@/lib/verification";
import Link from "next/link";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ referenceNumber: string }>;
}) {
  const { referenceNumber } = await params;
  const code = referenceNumber.trim();

  // A verification token is 32 lowercase hex characters; reference numbers are
  // uppercase with dashes ({MISSION}-{YEAR}-{00001}) and the ID-card fallback
  // is 8 uppercase alphanumerics. So both forms share this route without
  // ambiguity.
  const isToken = VERIFY_TOKEN_RE.test(code);
  const ref = code.toUpperCase();

  const SELECT = {
    id: true,
    certificateIssued: true,
    certificateIssuedAt: true,
    certificateRevokedAt: true,
    deploymentLocation: true,
    trainee: {
      select: {
        fullName: true,
        profilePicture: true,
        homeMission: { select: { code: true, name: true } },
      },
    },
    program: {
      select: { code: true, title: true, startDate: true, endDate: true },
    },
    application: {
      select: {
        referenceNumber: true,
        documents: {
          where: { kind: "PROFILE_PHOTO" as const, deletedAt: null },
          orderBy: { createdAt: "desc" as const },
          take: 1,
          select: { storageKey: true },
        },
      },
    },
  } as const;

  // No certificateIssued filter: the same QR is printed on ID cards, which
  // exist before any certificate is issued. An enrollment without a
  // certificate verifies as a trainee ID instead of "not found".
  let found = isToken
    ? await prisma.programEnrollment.findFirst({
        where: { deletedAt: null, verifyToken: code },
        select: SELECT,
      })
    : await prisma.programEnrollment.findFirst({
        where: { deletedAt: null, application: { referenceNumber: ref } },
        select: SELECT,
      });

  // Trainees placed on a roster manually may have no application linked
  // (applicationId is @unique, so a prior enrollment can already hold it).
  // Their ID card falls back to printing the last 8 characters of the
  // enrollment id, so resolve that form too or the QR reads "not found".
  if (!found && !isToken && /^[0-9A-Z]{8}$/.test(ref)) {
    found = await prisma.programEnrollment.findFirst({
      where: { deletedAt: null, id: { endsWith: ref.toLowerCase() } },
      select: SELECT,
    });
  }

  // Back to a const so the isValid/isIdOnly checks below narrow it for the JSX.
  const enrollment = found;

  // Full detail is only shown to someone who reached this page from a scanned
  // card or certificate. Reference numbers are sequential, so anyone can
  // enumerate them; the photo and the deployment location are withheld on that
  // path. Deployment location in particular says where a missionary physically
  // is. See lib/verification.ts.
  const full = isToken && !!enrollment;

  const photoDataUrl = full
    ? await loadEnrollmentPhoto(
        enrollment.application?.documents[0]?.storageKey,
        enrollment.trainee.profilePicture,
        { width: 240, height: 300 },
      )
    : null;

  // Token links do not carry a human-readable reference, so take it off the
  // record; fall back to the same 8-character form the ID card prints.
  const displayRef =
    enrollment?.application?.referenceNumber ??
    (enrollment ? enrollment.id.slice(-8).toUpperCase() : ref);

  const isRevoked = !!enrollment?.certificateRevokedAt;
  const isValid = !!enrollment?.certificateIssued && !isRevoked;
  const isIdOnly = !!enrollment && !enrollment.certificateIssued && !isRevoked;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold tracking-widest text-teal-700 uppercase">
          1000 Missionary Movement Bangladesh
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-900">Certificate Verification</h1>
      </div>

      <div className="w-full max-w-md">
        {/* Looked up by reference number rather than by scanning a card, so the
            photo and deployment location are withheld — see lib/verification.ts. */}
        {enrollment && !full && (
          <div className="mb-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-[11px] text-gray-500">
              Scan the QR code on the card or certificate itself to see the full
              record, including the holder&apos;s photograph.
            </p>
          </div>
        )}
        {isValid ? (
          <div className="rounded-2xl border border-teal-200 bg-white shadow-sm overflow-hidden">
            {/* Valid banner */}
            <div className="bg-teal-700 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold">Certificate Verified</p>
                  <p className="text-[11px] text-teal-200">This certificate is authentic and issued by 1000MMBD.</p>
                </div>
              </div>
            </div>

            {/* Photo, only on the scanned-card path — lets whoever is holding
                the card check the face against the person in front of them,
                which is the point of verifying an ID. */}
            {photoDataUrl && (
              <div className="flex justify-center border-b border-gray-100 bg-gray-50 py-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoDataUrl}
                  alt={`Photograph of ${enrollment!.trainee.fullName}`}
                  width={120}
                  height={150}
                  className="h-[150px] w-[120px] rounded-lg border border-gray-200 object-cover shadow-sm"
                />
              </div>
            )}

            {/* Details */}
            <div className="divide-y divide-gray-100 px-6">
              {[
                { label: "Reference Number", value: displayRef },
                { label: "Recipient", value: enrollment.trainee.fullName },
                { label: "Mission", value: enrollment.trainee.homeMission?.name ?? "—" },
                { label: "Program", value: `${enrollment.program.code} — ${enrollment.program.title}` },
                {
                  label: "Training Period",
                  value: `${new Date(enrollment.program.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} – ${new Date(enrollment.program.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
                },
                ...(full && enrollment.deploymentLocation
                  ? [{ label: "Deployment Location", value: enrollment.deploymentLocation }]
                  : []),
                {
                  label: "Certificate Issued",
                  value: enrollment.certificateIssuedAt
                    ? new Date(enrollment.certificateIssuedAt).toLocaleDateString("en-GB", {
                        day: "numeric", month: "long", year: "numeric",
                      })
                    : "—",
                },
              ].map((item) => (
                <div key={item.label} className="py-3">
                  <p className="text-[11px] text-gray-400">{item.label}</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : isIdOnly ? (
          <div className="rounded-2xl border border-blue-200 bg-white shadow-sm overflow-hidden">
            {/* Trainee ID banner — same reference is printed on ID cards before any certificate exists */}
            <div className="bg-blue-700 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold">Trainee ID Verified</p>
                  <p className="text-[11px] text-blue-200">
                    This ID belongs to a registered 1000MMBD trainee. No certificate has been issued yet.
                  </p>
                </div>
              </div>
            </div>

            {/* Photo, only on the scanned-card path — lets whoever is holding
                the card check the face against the person in front of them,
                which is the point of verifying an ID. */}
            {photoDataUrl && (
              <div className="flex justify-center border-b border-gray-100 bg-gray-50 py-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoDataUrl}
                  alt={`Photograph of ${enrollment!.trainee.fullName}`}
                  width={120}
                  height={150}
                  className="h-[150px] w-[120px] rounded-lg border border-gray-200 object-cover shadow-sm"
                />
              </div>
            )}

            <div className="divide-y divide-gray-100 px-6">
              {[
                { label: "Reference Number", value: displayRef },
                { label: "Name", value: enrollment!.trainee.fullName },
                { label: "Mission", value: enrollment!.trainee.homeMission?.name ?? "—" },
                { label: "Program", value: `${enrollment!.program.code} — ${enrollment!.program.title}` },
                {
                  label: "Training Period",
                  value: `${new Date(enrollment!.program.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} – ${new Date(enrollment!.program.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
                },
              ].map((item) => (
                <div key={item.label} className="py-3">
                  <p className="text-[11px] text-gray-400">{item.label}</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : isRevoked ? (
          <div className="rounded-2xl border border-red-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-red-600 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold">Certificate Revoked</p>
                  <p className="text-[11px] text-red-200">
                    The certificate for reference number <strong>{ref}</strong> has been revoked by 1000MMBD.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 text-sm text-gray-500">
              <p>
                This certificate was issued but is no longer valid
                {enrollment?.certificateRevokedAt && (
                  <>
                    {" "}as of{" "}
                    {new Date(enrollment.certificateRevokedAt).toLocaleDateString("en-GB", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </>
                )}
                . Contact the 1000MM Bangladesh office for details.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-red-600 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold">Certificate Not Found</p>
                  <p className="text-[11px] text-red-200">No certificate matches reference number <strong>{ref}</strong>.</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 text-sm text-gray-500">
              <p>This could mean:</p>
              <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
                <li>The reference number was typed incorrectly</li>
                <li>The certificate has not yet been issued</li>
                <li>The certificate belongs to a different portal</li>
              </ul>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-[11px] text-gray-400">
          Verification powered by{" "}
          <Link href="/" className="text-teal-600 hover:underline">
            1000MMBD Portal
          </Link>
        </p>
      </div>
    </div>
  );
}
