import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserActions } from "./_components/UserActions";
import { FlagUserForm } from "./_components/FlagUserForm";
import { MissionaryToggle } from "./_components/MissionaryToggle";

const ROLE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN: "System Admin",
  MAIN_DIRECTOR: "Union Director",
  LOCAL_DIRECTOR: "Local Director",
  TRAINER: "Trainer",
  TRAINEE: "Trainee",
};

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireRole(["SYSTEM_ADMIN", "MAIN_DIRECTOR"]);
  const session = await auth();
  const { userId } = await params;

  const actor = await prisma.user.findUnique({
    where: { id: session!.user!.id },
  });
  const isSA = actor?.role === "SYSTEM_ADMIN";
  const isUD = actor?.role === "MAIN_DIRECTOR";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      homeMission: { select: { name: true, code: true } },
      flagRequests: {
        orderBy: { createdAt: "desc" },
        include: {
          requestedBy: { select: { fullName: true } },
          resolvedBy: { select: { fullName: true } },
        },
      },
    },
  });
  if (!user) redirect("/dashboard/users");

  const pendingFlag = user.flagRequests.find((f) => f.status === "PENDING");
  const canFlag =
    isUD &&
    user.isActive &&
    !pendingFlag &&
    user.role !== "SYSTEM_ADMIN" &&
    user.id !== actor?.id;

  const appCount =
    user.role === "TRAINEE"
      ? await prisma.application.count({
          where: { applicantId: userId, deletedAt: null },
        })
      : null;
  const fieldReportCount =
    user.role === "TRAINEE"
      ? await prisma.fieldReport.count({ where: { traineeId: userId } })
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/users"
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ← Back to Users
        </Link>
        <div className="mt-1 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {user.fullName}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">{user.email}</p>
          </div>
          {isSA && (
            <UserActions
              userId={user.id}
              isActive={user.isActive}
              isSelf={user.id === actor?.id}
              isLmd={user.role === "LOCAL_DIRECTOR"}
            />
          )}
        </div>
      </div>

      {!user.isActive && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          This account is deactivated and cannot log in.
        </div>
      )}
      {pendingFlag && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <p className="text-sm font-medium text-amber-800">
            Flagged for deactivation review
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            Requested by {pendingFlag.requestedBy.fullName} ·{" "}
            {formatDate(pendingFlag.createdAt)}
          </p>
          <p className="mt-1 text-xs text-amber-600">
            Reason: {pendingFlag.reason}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Profile
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: "Full Name", value: user.fullName },
            { label: "Email", value: user.email },
            { label: "Role", value: ROLE_LABELS[user.role] ?? user.role },
            {
              label: "Mission",
              value: `${user.homeMission?.code} — ${user.homeMission?.name}`,
            },
            { label: "Status", value: user.isActive ? "Active" : "Inactive" },
            { label: "Joined", value: formatDate(user.createdAt) },
            { label: "Last Login", value: formatDate(user.lastLoginAt) },
            {
              label: "Email Verified",
              value: user.emailVerified
                ? formatDate(user.emailVerified)
                : "Not verified",
            },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[11px] text-gray-400">{item.label}</p>
              <p className="font-medium text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {user.role === "TRAINEE" && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Activity
          </p>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-[10px] text-gray-400">Applications</p>
              <p className="text-2xl font-semibold text-gray-900">{appCount}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-[10px] text-gray-400">Field Reports</p>
              <p className="text-2xl font-semibold text-gray-900">
                {fieldReportCount}
              </p>
            </div>
          </div>
          {/* Missionary status — SA only */}
          {isSA && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <div>
                <p className="text-xs font-medium text-gray-700">
                  Missionary Status
                </p>
                <p className="text-[11px] text-gray-400">
                  {user.isMissionary
                    ? "Currently active missionary — can submit salary requests"
                    : "Not a missionary"}
                </p>
              </div>
              <MissionaryToggle
                userId={user.id}
                isMissionary={user.isMissionary}
              />
            </div>
          )}
        </div>
      )}

      {canFlag && <FlagUserForm userId={user.id} userName={user.fullName} />}

      {user.flagRequests.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Flag History
          </p>
          <div className="space-y-3">
            {user.flagRequests.map((f) => (
              <div
                key={f.id}
                className={`rounded-lg border p-3 ${
                  f.status === "PENDING"
                    ? "border-amber-200 bg-amber-50"
                    : f.status === "APPROVED"
                      ? "border-red-200 bg-red-50"
                      : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-semibold uppercase ${
                      f.status === "PENDING"
                        ? "text-amber-700"
                        : f.status === "APPROVED"
                          ? "text-red-700"
                          : "text-gray-500"
                    }`}
                  >
                    {f.status}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {formatDate(f.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-700">{f.reason}</p>
                <p className="mt-1 text-[10px] text-gray-400">
                  by {f.requestedBy.fullName}
                </p>
                {f.resolverNote && (
                  <p className="mt-1 text-xs text-gray-500 italic">
                    SA note: {f.resolverNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
