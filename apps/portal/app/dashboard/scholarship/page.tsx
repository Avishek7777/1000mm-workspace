import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import { checkScholarshipEligibility } from "@/lib/scholarshipEligibility";
import { ScholarshipForm } from "./_components/ScholarshipForm";
import { ScholarshipStatusCard } from "@/app/dashboard/_components/scholarships/ScholarshipStatusCard";

export const dynamic = "force-dynamic";

export default async function ScholarshipPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, fullName: true, role: true, isMissionary: true },
  });
  if (!user) redirect("/login");

  const [requests, eligibility] = await Promise.all([
    prisma.scholarshipRequest.findMany({
      where: { missionaryId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        lmdReviewer: { select: { fullName: true } },
        udReviewer: { select: { fullName: true } },
        mission: { select: { code: true, name: true } },
        missionary: { select: { fullName: true } },
      },
    }),
    checkScholarshipEligibility(session.user.id),
  ]);

  // Only one application may be in flight at a time — the form is replaced by
  // its status while it is being reviewed.
  const inFlight = requests.find((r) =>
    ["SUBMITTED", "UNDER_LMD_REVIEW", "LMD_SUGGESTED"].includes(r.status),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Scholarship Application</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Study funding for missionaries who have completed a year of service.
        </p>
      </div>

      {/* Eligibility — shown whenever they cannot apply right now */}
      {!eligibility.eligible && !inFlight && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-medium text-amber-900">Not yet eligible</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">{eligibility.reason}</p>
          {eligibility.eligibleFrom && (
            <p className="mt-2 text-xs text-amber-700">
              At your current rate of service you can apply from around{" "}
              <span className="font-medium">
                {eligibility.eligibleFrom.toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              .
            </p>
          )}
        </div>
      )}

      {eligibility.eligible && !inFlight && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-3">
          <p className="text-xs text-green-800">
            You have <span className="font-medium">{eligibility.monthsServed} months</span> of
            service and can apply.
          </p>
        </div>
      )}

      {/* Existing applications */}
      {requests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Your Applications
          </h2>
          {requests.map((r) => (
            <ScholarshipStatusCard key={r.id} request={r} viewer="APPLICANT" />
          ))}
        </div>
      )}

      {/* The form itself */}
      {inFlight ? (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
          Your application is under review. You can apply again once it has been decided.
        </p>
      ) : eligibility.eligible ? (
        <ScholarshipForm applicantName={user.fullName} />
      ) : null}
    </div>
  );
}
