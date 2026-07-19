import { prisma } from "@1000mm/db";
import Link from "next/link";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ referenceNumber: string }>;
}) {
  const { referenceNumber } = await params;
  const ref = referenceNumber.trim().toUpperCase();

  const enrollment = await prisma.programEnrollment.findFirst({
    where: {
      deletedAt: null,
      certificateIssued: true,
      application: { referenceNumber: ref },
    },
    select: {
      certificateIssuedAt: true,
      certificateRevokedAt: true,
      deploymentLocation: true,
      trainee: {
        select: {
          fullName: true,
          homeMission: { select: { code: true, name: true } },
        },
      },
      program: {
        select: { code: true, title: true, startDate: true, endDate: true },
      },
    },
  });

  const isRevoked = !!enrollment?.certificateRevokedAt;
  const isValid = !!enrollment && !isRevoked;

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

            {/* Details */}
            <div className="divide-y divide-gray-100 px-6">
              {[
                { label: "Reference Number", value: ref },
                { label: "Recipient", value: enrollment.trainee.fullName },
                { label: "Mission", value: enrollment.trainee.homeMission?.name ?? "—" },
                { label: "Program", value: `${enrollment.program.code} — ${enrollment.program.title}` },
                {
                  label: "Training Period",
                  value: `${new Date(enrollment.program.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} – ${new Date(enrollment.program.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
                },
                ...(enrollment.deploymentLocation
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
