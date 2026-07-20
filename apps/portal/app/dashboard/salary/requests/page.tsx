import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { SalaryRequestActions } from "./_components/SalaryRequestActions";
import { PrintButton } from "@/components/PrintButton";
import { FilterBar } from "../../_components/FilterBar";
import { SalaryExportButton } from "./_components/SalaryExportButton";

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

const REVIEWER_ROLE_LABELS: Record<string, string> = {
  MAIN_DIRECTOR: "Union Director",
  SECRETARY: "Secretary",
  ASSOCIATE_DIRECTOR: "Associate Director",
  SYSTEM_ADMIN: "System Administrator",
};

export default async function SalaryRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ mission?: string; year?: string; month?: string; status?: string; program?: string }>;
}) {
  await requireRole(["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"]);
  const { mission, year, month, status, program } = await searchParams;
  const yearNum = year ? parseInt(year, 10) : undefined;
  const monthNum = month ? parseInt(month, 10) : undefined;
  const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
  type ValidStatus = typeof VALID_STATUSES[number];
  const validStatus: ValidStatus | undefined =
    status && (VALID_STATUSES as readonly string[]).includes(status)
      ? (status as ValidStatus)
      : undefined;

  const [missions, programs] = await Promise.all([
    prisma.localMission.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
      select: { id: true, code: true },
    }),
    prisma.trainingProgram.findMany({
      where: { deletedAt: null, enrollments: { some: { deletedAt: null } } },
      orderBy: { startDate: "desc" },
      select: { id: true, code: true, title: true },
    }),
  ]);
  const missionId = mission ? missions.find((m) => m.code === mission)?.id : undefined;

  const requests = await prisma.salaryRequest.findMany({
    where: {
      ...(missionId ? { missionId } : {}),
      ...(yearNum ? { year: yearNum } : {}),
      ...(monthNum ? { month: monthNum } : {}),
      ...(validStatus ? { status: validStatus } : {}),
      // Program: missionaries enrolled in the selected training program
      ...(program
        ? {
            missionary: {
              enrollmentsAsTrainee: {
                some: { programId: program, deletedAt: null },
              },
            },
          }
        : {}),
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
    include: {
      missionary: { select: { fullName: true, email: true } },
      mission: { select: { code: true, name: true } },
      reviewedBy: { select: { fullName: true, role: true } },
    },
  });

  const availableYears = [
    ...new Set(
      (await prisma.salaryRequest.findMany({ select: { year: true }, distinct: ["year"] }))
        .map((r) => r.year),
    ),
  ].sort((a, b) => b - a);

  const pending = requests.filter((r) => r.status === "PENDING");
  const reviewed = requests.filter((r) => r.status !== "PENDING");
  const approvedTotal = requests
    .filter((r) => r.status === "APPROVED")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Salary Requests</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {pending.length} pending · {reviewed.length} reviewed
            {approvedTotal > 0 ? ` · ৳${approvedTotal.toLocaleString()} approved` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <SalaryExportButton mission={mission} year={year} month={month} status={status} program={program} />
          <PrintButton label="Print" />
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        basePath="/dashboard/salary/requests"
        current={{ mission: mission ?? "", year: year ?? "", month: month ?? "", status: status ?? "", program: program ?? "" }}
        className="print:hidden"
        filters={[
          {
            name: "mission",
            label: "Mission",
            allLabel: "All missions",
            options: missions.map((m) => ({ value: m.code, label: m.code })),
          },
          {
            name: "program",
            label: "Program",
            allLabel: "All programs",
            options: programs.map((p) => ({ value: p.id, label: `${p.code} — ${p.title}` })),
          },
          {
            name: "year",
            label: "Year",
            allLabel: "All years",
            options: availableYears.map((y) => ({ value: String(y), label: String(y) })),
          },
          {
            name: "month",
            label: "Month",
            allLabel: "All months",
            options: MONTHS.map((m, i) => ({ value: String(i + 1), label: m })),
          },
          {
            name: "status",
            label: "Status",
            allLabel: "All statuses",
            options: [
              { value: "PENDING", label: "Pending" },
              { value: "APPROVED", label: "Approved" },
              { value: "REJECTED", label: "Rejected" },
            ],
          },
        ]}
      />

      {/* Print-only table */}
      {requests.length > 0 && (
        <div className="hidden print:block">
          <div className="flex items-center justify-between mb-4 border-b pb-3">
            <img src="/logos/1000mm-logo.png" alt="1000MM" className="h-12 w-auto" />
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">1000 Missionary Movement Bangladesh</p>
              <p className="text-xs text-gray-600 mt-0.5">Salary Requests Report</p>
              {(mission || yearNum || monthNum || status) && (
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {[mission, yearNum, monthNum ? MONTHS[monthNum - 1] : "", status].filter(Boolean).join(" · ")}
                </p>
              )}
              <p className="text-[10px] text-gray-400 mt-0.5">
                Generated {new Date().toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <img src="/logos/sda-logo.png" alt="SDA" className="h-12 w-auto" />
          </div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-400">
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">#</th>
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">Missionary</th>
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">Mission</th>
                <th className="py-1.5 pr-2 text-left font-semibold text-gray-700">Period</th>
                <th className="py-1.5 pr-2 text-right font-semibold text-gray-700">Amount</th>
                <th className="py-1.5 text-left font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="py-1 pr-2 text-gray-400">{i + 1}</td>
                  <td className="py-1 pr-2 font-medium text-gray-900">{r.missionary.fullName}</td>
                  <td className="py-1 pr-2 text-gray-600">{r.mission.code}</td>
                  <td className="py-1 pr-2 text-gray-600">{MONTHS[r.month - 1]} {r.year}</td>
                  <td className="py-1 pr-2 text-right text-gray-700">৳{r.amount.toLocaleString()}</td>
                  <td className="py-1 text-gray-600">{r.status}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-400">
                <td colSpan={4} className="py-1.5 pr-2 text-right font-semibold text-gray-700">
                  Approved Total
                </td>
                <td className="py-1.5 pr-2 text-right font-bold text-teal-700">
                  ৳{approvedTotal.toLocaleString()}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {requests.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">No salary requests yet.</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="print:hidden space-y-3">
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
        <div className="print:hidden space-y-3">
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
                      Reviewed By: {REVIEWER_ROLE_LABELS[r.reviewedBy.role] ?? r.reviewedBy.role} — {r.reviewedBy.fullName}
                    </p>
                  )}
                </div>
                {r.status === "APPROVED" && (
                  <a
                    href={`/api/salary/requests/${r.id}/invoice`}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Invoice
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
