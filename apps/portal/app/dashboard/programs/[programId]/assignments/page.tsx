import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { Paperclip, ChevronRight, Calendar, Users } from "lucide-react";
import { CreateAssignmentForm } from "./_components/CreateAssignmentForm";
import { DeleteAssignmentButton } from "./_components/DeleteAssignmentButton";
import { TrainerExportButtons } from "./_components/ExportButtons";

export const metadata = { title: "Assignments" };

function fmtDate(d: Date | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function ProgramAssignmentsPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "TRAINER") redirect("/dashboard");

  const trainerId = session.user.id;

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, topics: { some: { trainerId, deletedAt: null } }, deletedAt: null },
    select: {
      id: true, title: true, code: true,
      enrollments: { where: { deletedAt: null }, select: { id: true } },
      topics: {
        where: { trainerId, deletedAt: null },
        select: { id: true, title: true },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!program) redirect("/dashboard/programs");

  const assignments = await prisma.assignment.findMany({
    where: { programId, deletedAt: null },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      topic: { select: { id: true, title: true } },
      _count: { select: { submissions: true } },
    },
  });

  const enrolledCount = program.enrollments.length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Link href="/dashboard/programs" className="text-xs text-gray-400 hover:text-gray-600">{program.code}</Link>
            <span className="text-xs text-gray-300">/</span>
            <span className="text-xs text-gray-600">Assignments</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">{program.title}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{enrolledCount} enrolled trainee{enrolledCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Roster download — one per topic if multiple */}
          {program.topics.map((t) => (
            <TrainerExportButtons
              key={t.id}
              kind="roster"
              programId={programId}
              topicId={t.id}
            />
          ))}
          <Link href={`/dashboard/programs/${programId}/resources`} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
            Resources →
          </Link>
          <CreateAssignmentForm programId={programId} topics={program.topics} />
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">No assignments yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
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
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Paperclip className="h-2.5 w-2.5" />
                          {a.fileName}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                    {a.description && (
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{a.description}</p>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="h-3.5 w-3.5" />
                      {a._count.submissions}/{enrolledCount}
                    </span>
                    <DeleteAssignmentButton id={a.id} />
                    <Link
                      href={`/dashboard/programs/${programId}/assignments/${a.id}`}
                      className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      View <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
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
