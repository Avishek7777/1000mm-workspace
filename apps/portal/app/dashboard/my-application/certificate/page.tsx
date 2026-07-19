import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import Link from "next/link";

export default async function MyCertificatePage() {
  await requireRole(["TRAINEE"]);
  const session = await auth();

  const enrollment = await prisma.programEnrollment.findFirst({
    where: {
      traineeId: session!.user!.id,
      deletedAt: null,
      application: { status: "ACCEPTED" },
    },
    select: {
      id: true,
      certificateIssued: true,
      certificateIssuedAt: true,
      certificateRevokedAt: true,
      program: { select: { code: true, title: true, endDate: true } },
      application: { select: { referenceNumber: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const refNum = enrollment?.application?.referenceNumber ?? enrollment?.id?.slice(-8).toUpperCase();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/dashboard/trainee" className="text-xs text-gray-500 hover:text-gray-700">
          ← Back to Dashboard
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">My Certificate</h1>
      </div>

      {!enrollment ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-400">No active enrollment found.</p>
        </div>
      ) : enrollment.certificateRevokedAt ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-red-800">Certificate Revoked</h2>
          <p className="text-xs text-red-700">
            Your certificate for <strong>{enrollment.program.title}</strong> ({enrollment.program.code}) has
            been revoked and can no longer be downloaded or verified. Please contact
            the 1000MM Bangladesh office if you believe this is a mistake.
          </p>
        </div>
      ) : !enrollment.certificateIssued ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-amber-800">Certificate Not Yet Issued</h2>
          <p className="text-xs text-amber-700">
            Your certificate for <strong>{enrollment.program.title}</strong> ({enrollment.program.code}) has not been issued yet.
            It will become available here once issued by the Union Director.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d7a6e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-teal-800">Certificate Ready</h2>
            <p className="mt-1 text-xs text-teal-700">
              {enrollment.program.title} ({enrollment.program.code})
            </p>
            {enrollment.certificateIssuedAt && (
              <p className="mt-1 text-[11px] text-teal-600">
                Issued on {new Date(enrollment.certificateIssuedAt).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            )}
          </div>
          <a
            href={`/api/certificates?enrollmentId=${enrollment.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Download Certificate PDF
          </a>
          {refNum && (
            <p className="text-[10px] text-teal-600">
              Reference: <span className="font-mono font-bold">{refNum}</span>
            </p>
          )}
        </div>
      )}

      {refNum && enrollment?.certificateIssued && !enrollment?.certificateRevokedAt && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-2 text-xs font-semibold text-gray-500">Verify Certificate</p>
          <p className="text-xs text-gray-500">
            Anyone can verify the authenticity of this certificate using the reference number above at:
          </p>
          <p className="mt-1 font-mono text-xs text-teal-700 break-all">
            /api/public/verify/{refNum}
          </p>
        </div>
      )}
    </div>
  );
}
