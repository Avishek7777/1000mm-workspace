import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { Paperclip, Calendar, CheckCircle, Clock, Download } from "lucide-react";
import { FeedbackForm } from "./_components/FeedbackForm";
import { TrainerExportButtons } from "../_components/ExportButtons";

function fmtDate(d: Date | string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ programId: string; assignmentId: string }>;
}) {
  const { programId, assignmentId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "TRAINER") redirect("/dashboard");

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, programId, createdById: session.user.id, deletedAt: null },
    include: {
      program: { select: { id: true, title: true, code: true } },
      submissions: {
        orderBy: { submittedAt: "desc" },
        include: {
          trainee: { select: { id: true, fullName: true, homeMission: { select: { code: true } } } },
          feedbackBy: { select: { fullName: true } },
        },
      },
    },
  });
  if (!assignment) redirect(`/dashboard/programs/${programId}/assignments`);

  const enrolledTrainees = await prisma.programEnrollment.findMany({
    where: { programId, deletedAt: null },
    select: { traineeId: true },
  });
  const submittedIds = new Set(assignment.submissions.map((s) => s.traineeId));
  const pendingCount = enrolledTrainees.filter((e) => !submittedIds.has(e.traineeId)).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/dashboard/programs" className="text-xs text-gray-400 hover:text-gray-600">{assignment.program.code}</Link>
          <span className="text-xs text-gray-300">/</span>
          <Link href={`/dashboard/programs/${programId}/assignments`} className="text-xs text-gray-400 hover:text-gray-600">Assignments</Link>
          <span className="text-xs text-gray-300">/</span>
          <span className="text-xs text-gray-600 truncate">{assignment.title}</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">{assignment.title}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          {assignment.dueDate && (
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Due {fmtDate(assignment.dueDate)}</span>
          )}
          {assignment.fileStorageKey && (
            <a href={`/api/uploads/${assignment.fileStorageKey}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-teal-600 hover:text-teal-800">
              <Paperclip className="h-3.5 w-3.5" />{assignment.fileName}
            </a>
          )}
        </div>
        {assignment.description && (
          <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-teal-700">
            <CheckCircle className="h-4 w-4" />
            <strong>{assignment.submissions.length}</strong> submitted
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <Clock className="h-4 w-4" />
            <strong>{pendingCount}</strong> pending
          </span>
        </div>
        <TrainerExportButtons kind="submissions" assignmentId={assignmentId} />
      </div>

      {assignment.submissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
          <p className="text-sm text-gray-400">No submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignment.submissions.map((sub) => (
            <div key={sub.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{sub.trainee.fullName}</p>
                  <p className="text-[10px] text-gray-400">{sub.trainee.homeMission?.code ?? "—"} · submitted {fmtDateTime(sub.submittedAt)}</p>
                </div>
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">Submitted</span>
              </div>

              {sub.notes && (
                <div className="mb-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-700 whitespace-pre-wrap">{sub.notes}</div>
              )}

              {sub.fileStorageKey && (
                <a
                  href={`/api/uploads/${sub.fileStorageKey}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mb-3 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-teal-600 hover:text-teal-800 hover:bg-gray-50 transition-colors w-fit"
                >
                  <Download className="h-3.5 w-3.5" />
                  {sub.fileName}
                </a>
              )}

              <div className="border-t border-gray-100 pt-3 mt-3">
                <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 mb-1">
                  Feedback {sub.feedbackAt ? `· updated ${fmtDateTime(sub.feedbackAt)}` : ""}
                </p>
                <FeedbackForm
                  submissionId={sub.id}
                  programId={programId}
                  assignmentId={assignmentId}
                  existing={sub.feedback}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
