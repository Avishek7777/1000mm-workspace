import { requireRole } from "@/lib/auth/helpers";
import { loadScholarships } from "@/lib/scholarshipQueries";
import { ScholarshipStatusCard } from "@/app/dashboard/_components/scholarships/ScholarshipStatusCard";
import { ScholarshipExportButtons } from "@/app/dashboard/_components/scholarships/ScholarshipExportButtons";

export const dynamic = "force-dynamic";

/**
 * The Union Director's queue. Applications only reach here once an LMD has
 * suggested them — anything the LMD rejected ends at their stage and is not
 * the UD's to reconsider.
 */
export default async function DirectorScholarshipsPage() {
  await requireRole(["MAIN_DIRECTOR", "SYSTEM_ADMIN"]);

  const requests = await loadScholarships({});
  const awaiting = requests.filter((r) => r.status === "LMD_SUGGESTED");
  const decided = requests.filter((r) => ["APPROVED", "REJECTED"].includes(r.status));
  const totalFunded = decided
    .filter((r) => r.status === "APPROVED")
    .reduce((sum, r) => sum + (r.approvedAmount ?? 0), 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Scholarship Applications</h1>
          <p className="mt-0.5 text-sm text-gray-500">All missions</p>
        </div>
        <ScholarshipExportButtons />
      </div>

      {totalFunded > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-lg font-semibold text-gray-900">
            {totalFunded.toLocaleString("en-GB")}
          </p>
          <p className="text-[11px] tracking-wide text-gray-400 uppercase">Total funded</p>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
          Awaiting your decision
          {awaiting.length > 0 && (
            <span className="ml-2 rounded-full bg-teal-100 px-1.5 py-0.5 text-teal-700">
              {awaiting.length}
            </span>
          )}
        </h2>
        {awaiting.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
            Nothing waiting on you
          </p>
        ) : (
          <div className="space-y-3">
            {awaiting.map((r) => (
              <ScholarshipStatusCard key={r.id} request={r} viewer="UD" />
            ))}
          </div>
        )}
      </section>

      {decided.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
            Decided
          </h2>
          <div className="space-y-3">
            {decided.map((r) => (
              <ScholarshipStatusCard key={r.id} request={r} viewer="UD" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
