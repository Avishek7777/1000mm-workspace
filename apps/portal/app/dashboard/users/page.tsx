import { requireRole } from "@/lib/auth/helpers";
import { auth } from "@/lib/auth/config";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { CreateLmdButton } from "./_components/CreateLmdButton";
import { CreateTraineeButton } from "./_components/CreateTraineeButton";
import { CreateUserButton } from "./_components/CreateUserButton";
import { FilterBar } from "../_components/FilterBar";

const ROLE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN: "System Admin",
  MAIN_DIRECTOR: "Union Director",
  SECRETARY: "Secretary",
  ASSOCIATE_DIRECTOR: "Associate Director",
  LOCAL_DIRECTOR: "Local Director",
  TRAINER: "Trainer",
  TRAINEE: "Trainee",
};

const ROLE_COLORS: Record<string, string> = {
  SYSTEM_ADMIN: "bg-red-100 text-red-700",
  MAIN_DIRECTOR: "bg-purple-100 text-purple-700",
  SECRETARY: "bg-teal-100 text-teal-700",
  ASSOCIATE_DIRECTOR: "bg-teal-100 text-teal-700",
  LOCAL_DIRECTOR: "bg-blue-100 text-blue-700",
  TRAINER: "bg-amber-100 text-amber-700",
  TRAINEE: "bg-gray-100 text-gray-600",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    mission?: string;
    q?: string;
    status?: string;
  }>;
}) {
  await requireRole(["SYSTEM_ADMIN"]);
  const session = await auth();
  const { role, mission, q, status } = await searchParams;

  const actor = await prisma.user.findUnique({
    where: { id: session!.user!.id },
  });
  const isSA = actor?.role === "SYSTEM_ADMIN";

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(role ? { role: role as any } : {}),
      ...(mission ? { homeMission: { code: mission as any } } : {}),
      ...(status === "active"
        ? { isActive: true }
        : status === "inactive"
          ? { isActive: false }
          : {}),
      ...(q ? { fullName: { contains: q, mode: "insensitive" as const } } : {}),
    },
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
    include: {
      homeMission: { select: { code: true } },
      flagRequests: { where: { status: "PENDING" }, select: { id: true } },
    },
  });

  const pendingFlagCount = isSA
    ? await prisma.userFlagRequest.count({ where: { status: "PENDING" } })
    : 0;

  const missions = ["EBM", "NBM", "SBM", "WBM"];

  // For SA create LMD modal
  const missionList = isSA
    ? await prisma.localMission.findMany({
        where: { deletedAt: null },
        orderBy: { code: "asc" },
        select: { id: true, code: true, name: true },
      })
    : [];
  const roles = [
    "SYSTEM_ADMIN",
    "MAIN_DIRECTOR",
    "SECRETARY",
    "ASSOCIATE_DIRECTOR",
    "LOCAL_DIRECTOR",
    "TRAINER",
    "TRAINEE",
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Users</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {users.length} user{users.length !== 1 ? "s" : ""}
            {!isSA && " — view only · flag users for deactivation review"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSA && <CreateTraineeButton missions={missionList} />}
          {isSA && <CreateLmdButton missions={missionList} />}
          {isSA && <CreateUserButton missions={missionList} />}
          {isSA && pendingFlagCount > 0 && (
            <Link
              href="/dashboard/users/flag-requests"
              className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {pendingFlagCount}
              </span>
              Flag Requests
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <form method="GET">
          {role && <input type="hidden" name="role" value={role} />}
          {mission && <input type="hidden" name="mission" value={mission} />}
          {status && <input type="hidden" name="status" value={status} />}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Search
            </label>
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search by name…"
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-teal-500"
            />
          </div>
        </form>
        <FilterBar
          basePath="/dashboard/users"
          current={{ role: role ?? "", mission: mission ?? "", status: status ?? "", q: q ?? "" }}
          filters={[
            {
              name: "role",
              label: "Role",
              allLabel: "All roles",
              options: roles.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
            },
            {
              name: "mission",
              label: "Mission",
              allLabel: "All missions",
              options: missions.map((m) => ({ value: m, label: m })),
            },
            {
              name: "status",
              label: "Status",
              allLabel: "All statuses",
              options: [
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ],
            },
          ]}
        />
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-400">No users found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Mission
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Joined
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => {
                const hasPendingFlag = u.flagRequests.length > 0;
                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-gray-50 transition-colors ${!u.isActive ? "opacity-60" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{u.fullName}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_COLORS[u.role]}`}
                      >
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {u.homeMission?.code ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${u.isActive ? "bg-teal-500" : "bg-gray-300"}`}
                        />
                        <span className="text-xs text-gray-600">
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                        {hasPendingFlag && (
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            Flagged
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/users/${u.id}`}
                        className="text-xs text-teal-600 hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
