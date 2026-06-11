import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { SalaryRequestActions } from "./_components/SalaryRequestActions";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-teal-100 text-teal-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function SalaryRequestsPage() {
  await requireRole(["MAIN_DIRECTOR", "SYSTEM_ADMIN"]);

  const requests = await prisma.salaryRequest.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    include: {
      missionary: { select: { fullName: true, email: true } },
      mission: { select: { code: true, name: true } },
      reviewedBy: { select: { fullName: true } },
    },
  });

  const pending = requests.filter((r) => r.status === "PENDING");
  const reviewed = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Salary Requests</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {pending.length} pending · {reviewed.length} reviewed
        </p>
      </div>

      {requests.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">No salary requests yet.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-amber-600">
            Pending
          </p>
          {pending.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-amber-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                      {r.mission.code}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {MONTHS[r.month - 1]} {r.year}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {r.missionary.fullName}
                  </p>
                  <p className="text-xs text-gray-400">{r.missionary.email}</p>
                  <p className="mt-1 text-sm font-semibold text-teal-700">
                    ৳{r.amount.toLocaleString()}
                  </p>
                </div>
                <SalaryRequestActions requestId={r.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
            Reviewed
          </p>
          {reviewed.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-gray-100 bg-white p-5 opacity-80"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                      {r.mission.code}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[r.status]}`}
                    >
                      {r.status}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {MONTHS[r.month - 1]} {r.year}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {r.missionary.fullName}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-700">
                    ৳{r.amount.toLocaleString()}
                  </p>
                  {r.notes && (
                    <p className="mt-1 text-xs text-gray-400 italic">
                      {r.notes}
                    </p>
                  )}
                  {r.reviewedBy && (
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      by {r.reviewedBy.fullName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
