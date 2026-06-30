import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { BookOpen, CalendarDays, MapPin, ClipboardList, FolderOpen } from "lucide-react";

export const metadata = { title: "My Programs" };

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function TrainerProgramsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "TRAINER") redirect("/dashboard");

  const trainerId = session.user.id;

  const programs = await prisma.trainingProgram.findMany({
    where: { topics: { some: { trainerId, deletedAt: null } }, deletedAt: null },
    orderBy: { startDate: "desc" },
    include: {
      topics: {
        where: { trainerId, deletedAt: null },
        select: { id: true, title: true },
        orderBy: { order: "asc" },
      },
      enrollments: { where: { deletedAt: null }, select: { id: true } },
      _count: {
        select: {
          assignments: { where: { deletedAt: null } },
          resources: { where: { deletedAt: null } },
        },
      },
      applicationWindows: {
        where: { deletedAt: null },
        orderBy: { applicationCloseDate: "desc" },
        take: 1,
        select: { state: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">My Programs</h1>
        <p className="mt-0.5 text-sm text-gray-500">Manage assignments and resources for each program you teach.</p>
      </div>

      {programs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-20 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">You haven't been assigned to any programs yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map((p) => {
            const now = new Date();
            const status = p.endDate < now ? "Completed" : p.startDate <= now ? "Active" : "Upcoming";
            const statusStyle = status === "Active" ? "bg-emerald-100 text-emerald-700" : status === "Upcoming" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500";

            return (
              <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}>{status}</span>
                      <span className="font-mono text-xs text-gray-400">{p.code}</span>
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900 truncate">{p.title}</h2>
                    {p.topics.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {p.topics.map((t) => (
                          <span
                            key={t.id}
                            className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-medium text-violet-700"
                          >
                            {t.title}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{fmtDate(p.startDate)} – {fmtDate(p.endDate)}</span>
                      {p.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{p.location}</span>}
                      <span className="text-gray-400">{p.enrollments.length} enrolled</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/dashboard/programs/${p.id}/assignments`}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-medium text-gray-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Assignments
                    {p._count.assignments > 0 && (
                      <span className="ml-1 rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700">
                        {p._count.assignments}
                      </span>
                    )}
                  </Link>
                  <Link
                    href={`/dashboard/programs/${p.id}/resources`}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-medium text-gray-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Resources
                    {p._count.resources > 0 && (
                      <span className="ml-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                        {p._count.resources}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
