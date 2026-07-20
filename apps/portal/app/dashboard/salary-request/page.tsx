import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-teal-100 text-teal-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function SalaryRequestPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user || !user.isMissionary) redirect("/dashboard");

  const currentCycle = new Date().getFullYear();
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const dayOfMonth = today.getDate();

  // Get window settings
  const [startSetting, endSetting] = await Promise.all([
    prisma.systemSetting.findUnique({
      where: { key: "salary.request_window_start" },
    }),
    prisma.systemSetting.findUnique({
      where: { key: "salary.request_window_end" },
    }),
  ]);
  const windowStart = (startSetting?.value as number) ?? 8;
  const windowEnd = (endSetting?.value as number) ?? 14;
  const isWindowOpen = dayOfMonth >= windowStart && dayOfMonth <= windowEnd;

  // Get assignment
  const assignment = await prisma.salaryAssignment.findUnique({
    where: {
      missionaryId_cycle: { missionaryId: user.id, cycle: currentCycle },
    },
    include: { mission: { select: { name: true, code: true } } },
  });

  // Check if already submitted this month
  const thisMonthRequest = await prisma.salaryRequest.findUnique({
    where: { missionaryId_month_year: { missionaryId: user.id, month, year } },
  });

  // All past requests
  const pastRequests = await prisma.salaryRequest.findMany({
    where: { missionaryId: user.id },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Salary Request</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Your monthly stipend requests — submitted by your Local Mission Director
        </p>
      </div>

      {/* Assignment card */}
      {assignment ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Your Assignment
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[11px] text-gray-400">Mission</p>
              <p className="font-medium text-gray-800">
                {assignment.mission.name}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Deployment Location</p>
              <p className="font-medium text-gray-800">
                {assignment.deploymentLocation ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Monthly Stipend</p>
              <p className="text-lg font-semibold text-teal-700">
                ৳{assignment.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Cycle</p>
              <p className="font-medium text-gray-800">{currentCycle}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No salary has been assigned to you yet. Contact your Local Director.
        </div>
      )}

      {/* Request window status — read-only; the LMD submits the request */}
      {assignment && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {MONTHS[month - 1]} {year} Request
            </p>
            {isWindowOpen ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-medium text-teal-700">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                Window open (day {windowStart}–{windowEnd})
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] text-gray-500">
                Window closed · Opens day {windowStart}
              </span>
            )}
          </div>

          {thisMonthRequest ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Request submitted for this month.
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[thisMonthRequest.status]}`}
              >
                {thisMonthRequest.status}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Not yet submitted. Your Local Mission Director submits this
              request on your behalf{isWindowOpen ? " during the window above" : " once the window opens"}.
            </p>
          )}
        </div>
      )}

      {/* Past requests */}
      {pastRequests.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
            Request History
          </p>
          {pastRequests.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {MONTHS[r.month - 1]} {r.year}
                </p>
                <p className="text-xs text-teal-700 font-semibold">
                  ৳{r.amount.toLocaleString()}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}
              >
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
