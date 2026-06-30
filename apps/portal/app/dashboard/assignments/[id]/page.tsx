import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { Calendar, Paperclip, CheckCircle2, MessageSquare, Download } from "lucide-react";
import { SubmitAssignmentForm } from "./_components/SubmitAssignmentForm";

function fmtDate(d: Date | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function AssignmentSubmitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "TRAINEE") redirect("/dashboard");

  const traineeId = session.user.id;

  const assignment = await prisma.assignment.findFirst({
    where: { id, deletedAt: null },
    include: {
      program: { select: { id: true, title: true, code: true } },
      topic: { select: { id: true, title: true } },
      createdBy: { select: { fullName: true } },
    },
  });
  if (!assignment) redirect("/dashboard/assignments");

  // Verify enrollment
  const enrolled = await prisma.programEnrollment.findFirst({
    where: { programId: assignment.programId, traineeId, deletedAt: null },
  });
  if (!enrolled) redirect("/dashboard/assignments");

  const submission = await prisma.assignmentSubmission.findUnique({
    where: { assignmentId_traineeId: { assignmentId: id, traineeId } },
  });

  const overdue = !submission && assignment.dueDate && new Date(assignment.dueDate) < new Date();

  const hasFeedback = !!submission?.feedback;

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <Link href="/dashboard/assignments" className="text-xs text-teal-600 hover:text-teal-800">← Assignments</Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-gray-400">{assignment.program.code}</span>
          {assignment.topic && (
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-medium text-violet-700">
              {assignment.topic.title}
            </span>
          )}
          {submission ? (
            <span className="flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">
              <CheckCircle2 className="h-2.5 w-2.5" /> Submitted
            </span>
          ) : overdue ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">Overdue</span>
          ) : null}
          {hasFeedback && (
            <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
              <MessageSquare className="h-2.5 w-2.5" /> Feedback received
            </span>
          )}
        </div>
        <h1 className="mt-2 text-lg font-semibold text-gray-900">{assignment.title}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span>by <span className="font-medium text-gray-700">{assignment.createdBy.fullName}</span></span>
          {assignment.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Due {fmtDate(assignment.dueDate)}
              {overdue && <span className="ml-1 text-red-500 font-medium">— overdue</span>}
            </span>
          )}
        </div>
      </div>

      {/* Assignment brief */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Assignment</p>
        {assignment.description && (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
        )}
        {assignment.fileStorageKey && (
          <a
            href={`/api/uploads/${assignment.fileStorageKey}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-teal-600 hover:text-teal-800 hover:bg-gray-50 transition-colors w-fit"
          >
            <Paperclip className="h-3.5 w-3.5" />
            Download: {assignment.fileName}
          </a>
        )}
      </div>

      {/* Trainer feedback — shown prominently when present */}
      {hasFeedback && (
        <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-200">
              <MessageSquare className="h-3.5 w-3.5 text-blue-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Trainer Feedback</p>
              {submission?.feedbackAt && (
                <p className="text-[10px] text-blue-400">{fmtDateTime(submission.feedbackAt)}</p>
              )}
            </div>
          </div>
          <p className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">{submission!.feedback}</p>
        </div>
      )}

      {/* Your submission — read view */}
      {submission && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Your Submission</p>
              <p className="mt-0.5 text-[10px] text-gray-400">
                Submitted {fmtDateTime(submission.submittedAt)}
              </p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">
              <CheckCircle2 className="h-2.5 w-2.5" /> Submitted
            </span>
          </div>

          {submission.notes && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
              {submission.notes}
            </div>
          )}

          {submission.fileStorageKey && (
            <a
              href={`/api/uploads/${submission.fileStorageKey}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-teal-600 hover:text-teal-800 hover:bg-gray-50 transition-colors w-fit"
            >
              <Download className="h-3.5 w-3.5" />
              {submission.fileName}
            </a>
          )}
        </div>
      )}

      {/* Update / submit form */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-gray-900 mb-1">
          {submission ? "Update Submission" : "Submit Your Work"}
        </p>
        {submission && !hasFeedback && (
          <p className="text-[10px] text-gray-400 mb-4">
            You can update your work until the due date. The trainer has not yet reviewed your submission.
          </p>
        )}
        {submission && hasFeedback && (
          <p className="text-[10px] text-amber-600 mb-4">
            Your trainer has reviewed this submission. You may still update your work if permitted.
          </p>
        )}
        <SubmitAssignmentForm
          assignmentId={id}
          existing={submission ? { notes: submission.notes, fileStorageKey: submission.fileStorageKey, fileName: submission.fileName } : null}
        />
      </div>
    </div>
  );
}
