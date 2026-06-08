import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { FlagActions } from "./_components/FlagActions";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function FlagRequestsPage() {
  await requireRole(["SYSTEM_ADMIN"]);

  const flags = await prisma.userFlagRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      targetUser: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          homeMission: { select: { code: true } },
        },
      },
      requestedBy: { select: { fullName: true } },
      resolvedBy: { select: { fullName: true } },
    },
  });

  const pending = flags.filter((f) => f.status === "PENDING");
  const resolved = flags.filter((f) => f.status !== "PENDING");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/users"
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ← Back to Users
          </Link>
          <h1 className="mt-1 text-lg font-semibold text-gray-900">
            Flag Requests
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {pending.length} pending · {resolved.length} resolved
          </p>
        </div>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-amber-600">
            Pending Review
          </p>
          {pending.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border border-amber-200 bg-white p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/dashboard/users/${f.targetUser.id}`}
                      className="text-sm font-semibold text-gray-900 hover:text-teal-700"
                    >
                      {f.targetUser.fullName}
                    </Link>
                    <span className="text-xs text-gray-400">
                      {f.targetUser.role.replace(/_/g, " ")}
                    </span>
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] text-purple-700">
                      {f.targetUser.homeMission?.code}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{f.targetUser.email}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatDate(f.createdAt)}
                </span>
              </div>
              <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2">
                <p className="text-[10px] font-medium text-amber-700 mb-0.5">
                  Flagged by {f.requestedBy.fullName}:
                </p>
                <p className="text-xs text-gray-700">{f.reason}</p>
              </div>
              <FlagActions flagId={f.id} />
            </div>
          ))}
        </div>
      )}

      {pending.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-400">No pending flag requests.</p>
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
            Resolved
          </p>
          {resolved.map((f) => (
            <div
              key={f.id}
              className={`rounded-xl border bg-white p-4 opacity-75 ${
                f.status === "APPROVED" ? "border-red-100" : "border-gray-100"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link
                      href={`/dashboard/users/${f.targetUser.id}`}
                      className="text-sm font-medium text-gray-800 hover:text-teal-700"
                    >
                      {f.targetUser.fullName}
                    </Link>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        f.status === "APPROVED"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{f.reason}</p>
                  {f.resolverNote && (
                    <p className="mt-1 text-xs text-gray-400 italic">
                      Note: {f.resolverNote}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-gray-400">
                    {f.resolvedBy?.fullName}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {f.resolvedAt ? formatDate(f.resolvedAt) : ""}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
