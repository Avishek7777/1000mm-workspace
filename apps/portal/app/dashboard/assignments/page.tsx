import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { Calendar, CheckCircle2, Clock, ChevronRight } from "lucide-react";

export const metadata = { title: "My Assignments" };

function fmtDate(d: Date | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function TraineeAssignmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "TRAINEE") redirect("/dashboard");

  const traineeId = session.user.id;

  // Find all programs the trainee is enrolled in
  const enrollments = await prisma.programEnrollment.findMany({
    where: { traineeId, deletedAt: null },
    select: { programId: true, program: { select: { id: true, title: true, code: true } } },
  });

  if (enrollments.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Assignments</h1>
          <p className="mt-0.5 text-sm text-gray-500">Assignments from your training programs</p>
        </div>
        <div className="rounded-xl border border-dashed border-gray-200 py-20 text-center">
          <p className="text-sm text-gray-400">You are not enrolled in any programs yet.</p>
        </div>
      </div>
    );
  }

  const programIds = enrollments.map((e) => e.programId);

  const assignments = await prisma.assignment.findMany({
    where: { programId: { in: programIds }, deletedAt: null },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      program: { select: { id: true, title: true, code: true } },
      topic: { select: { id: true, title: true } },
      submissions: { where: { traineeId }, select: { id: true, submittedAt: true, feedback: true } },
    },
  });

  const pending = assignments.filter((a) => a.submissions.length === 0);
  const submitted = assignments.filter((a) => a.submissions.length > 0);

  function renderList(list: typeof assignments, emptyMsg: string) {
    if (list.length === 0) return <p className="text-xs text-gray-400 py-4 text-center">{emptyMsg}</p>;
    return (
      <div className="space-y-3">
        {list.map((a) => {
          const sub = a.submissions[0];
          const overdue = !sub && a.dueDate && new Date(a.dueDate) < new Date();
          return (
            <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] text-gray-400">{a.program.code}</span>
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
                    {sub?.feedback && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">Feedback received</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                  {a.description && <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{a.description}</p>}
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {sub ? (
                    <CheckCircle2 className="h-4 w-4 text-teal-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-400" />
                  )}
                  <Link
                    href={`/dashboard/assignments/${a.id}`}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {sub ? "View" : "Submit"} <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Assignments</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {assignments.length} total · {pending.length} pending · {submitted.length} submitted
        </p>
      </div>

      {pending.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-700">Pending</p>
          {renderList(pending, "All caught up!")}
        </div>
      )}

      {submitted.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-teal-700">Submitted</p>
          {renderList(submitted, "")}
        </div>
      )}

      {assignments.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 py-20 text-center">
          <p className="text-sm text-gray-400">No assignments have been posted yet.</p>
        </div>
      )}
    </div>
  );
}
