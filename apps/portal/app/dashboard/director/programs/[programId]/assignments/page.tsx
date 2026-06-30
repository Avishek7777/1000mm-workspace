import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Paperclip, Users, CheckCircle, Clock } from "lucide-react";

function fmtDate(d: Date | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function DirectorProgramAssignmentsPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  await requireRole(["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"]);
  const { programId } = await params;

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, deletedAt: null },
    select: {
      id: true, title: true, code: true,
      enrollments: { where: { deletedAt: null }, select: { id: true } },
    },
  });
  if (!program) redirect("/dashboard/director/programs");

  const assignments = await prisma.assignment.findMany({
    where: { programId, deletedAt: null },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      topic: { select: { id: true, title: true } },
      createdBy: { select: { fullName: true } },
      _count: { select: { submissions: true } },
    },
  });

  const enrolledCount = program.enrollments.length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/dashboard/director/programs/${programId}`} className="text-xs text-gray-400 hover:text-gray-600">
            ← {program.code}
          </Link>
          <span className="text-xs text-gray-300">/</span>
          <span className="text-xs text-gray-600">Assignments</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">{program.title}</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {assignments.length} assignment{assignments.length !== 1 ? "s" : ""} · {enrolledCount} enrolled trainee{enrolledCount !== 1 ? "s" : ""}
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">No assignments have been posted for this program yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const submitted = a._count.submissions;
            const pending = enrolledCount - submitted;
            const overdue = a.dueDate && new Date(a.dueDate) < new Date();
            return (
              <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {a.topic && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                          {a.topic.title}
                        </span>
                      )}
                      {a.dueDate && (
                        <span className={`flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 ${overdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                          <Calendar className="h-2.5 w-2.5" />
                          Due {fmtDate(a.dueDate)}{overdue ? " — overdue" : ""}
                        </span>
                      )}
                      {a.fileStorageKey && (
                        <a href={`/api/uploads/${a.fileStorageKey}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-teal-600 hover:text-teal-800">
                          <Paperclip className="h-2.5 w-2.5" />{a.fileName}
                        </a>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                    {a.description && <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{a.description}</p>}
                    <p className="mt-1.5 text-[10px] text-gray-400">by {a.createdBy.fullName}</p>
                  </div>
                  <div className="flex-shrink-0 space-y-1 text-right">
                    <div className="flex items-center justify-end gap-1 text-xs text-teal-700">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span className="font-semibold">{submitted}</span>
                      <span className="text-gray-400">submitted</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 text-xs text-amber-600">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="font-semibold">{pending}</span>
                      <span className="text-gray-400">pending</span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      <Users className="inline h-2.5 w-2.5 mr-0.5" />
                      {submitted}/{enrolledCount}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
