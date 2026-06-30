import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProgramEditForm, WindowPanel } from "./_components/ProgramComponents";
import { PublishToggle } from "../_components/PublishToggle";
import { TopicsPanel } from "./_components/TopicsPanel";

const CATEGORY_LABELS: Record<string, string> = {
  SPIRITUAL: "Spiritual",
  PHYSICAL: "Physical",
  MENTAL: "Mental",
  SOCIAL: "Social",
};

const WINDOW_STATE_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  DRAFT: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
  ADVERTISING: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  OPEN: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  CLOSED: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  ARCHIVED: {
    bg: "bg-gray-50",
    text: "text-gray-400",
    border: "border-gray-200",
  },
};

const MAX_ACTIVE = 5;

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  await requireRole(["MAIN_DIRECTOR", "SECRETARY", "ASSOCIATE_DIRECTOR", "SYSTEM_ADMIN"]);
  const { programId } = await params;

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, deletedAt: null },
    include: {
      applicationWindows: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          scopedToMission: { select: { code: true, name: true } },
          _count: { select: { applications: { where: { deletedAt: null } } } },
        },
      },
      enrollments: {
        where: { deletedAt: null },
        select: {
          id: true,
          attendanceConfirmed: true,
          certificateIssued: true,
        },
      },
      topics: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          trainer: { select: { id: true, fullName: true } },
        },
      },
      _count: { select: { fieldReports: true } },
    },
  });

  if (!program) redirect("/dashboard/director/programs");

  const [missions, allTrainers] = await Promise.all([
    prisma.localMission.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.user.findMany({
      where: { role: "TRAINER", isActive: true, deletedAt: null },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, homeMission: { select: { code: true } } },
    }),
  ]);

  const activeCount = await prisma.trainingProgram.count({
    where: { isPublished: true, deletedAt: null },
  });

  const activeWindow = program.applicationWindows.find(
    (w) => w.state === "OPEN",
  );
  const latestWindow = program.applicationWindows[0] ?? null;

  const enrolledCount = program.enrollments.length;
  const attendingCount = program.enrollments.filter(
    (e) => e.attendanceConfirmed,
  ).length;
  const certifiedCount = program.enrollments.filter(
    (e) => e.certificateIssued,
  ).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back + header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/director/programs"
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            ← Back to Programs
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-xs text-gray-400">
              {program.code}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
              {CATEGORY_LABELS[program.category]}
            </span>
            {program.isPublished && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                Active
              </span>
            )}
          </div>
          <h1 className="mt-1 text-lg font-semibold text-gray-900">
            {program.title}
          </h1>
          {program.titleBangla && (
            <p className="text-sm text-gray-500">{program.titleBangla}</p>
          )}
        </div>
        <PublishToggle
          programId={program.id}
          isPublished={program.isPublished}
          canPublish={activeCount < MAX_ACTIVE || program.isPublished}
          hasOpenWindow={!!activeWindow}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Target Intake", value: program.targetIntake },
          { label: "Enrolled", value: enrolledCount },
          { label: "Attending", value: attendingCount },
          { label: "Certified", value: certifiedCount },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-4 text-center"
          >
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Application Windows */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Application Windows
          </h2>
        </div>

        {program.applicationWindows.length === 0 ? (
          <div className="mb-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 py-6 text-center">
            <p className="text-sm text-gray-400">No application windows yet.</p>
          </div>
        ) : (
          <div className="mb-4 space-y-3">
            {program.applicationWindows.map((w) => {
              const colors = WINDOW_STATE_COLORS[w.state];
              return (
                <div
                  key={w.id}
                  className={`rounded-lg border ${colors.border} ${colors.bg} p-4`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}
                        >
                          {w.state}
                        </span>
                        {w.scopedToMission && (
                          <span className="text-xs text-gray-500">
                            · {w.scopedToMission.code} only
                          </span>
                        )}
                        {!w.scopedToMission && (
                          <span className="text-xs text-gray-400">
                            · All missions
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <p>
                          Application open:{" "}
                          {new Date(w.applicationOpenDate).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                          {" → "}
                          {new Date(w.applicationCloseDate).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </p>
                        <p>
                          Target intake: {w.targetIntake} · Applications:{" "}
                          {w._count.applications}
                        </p>
                      </div>
                    </div>
                    <WindowPanel
                      windowId={w.id}
                      state={w.state}
                      programId={program.id}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create window form — only if no non-archived window exists */}
        {!program.applicationWindows.some(
          (w) => !["ARCHIVED"].includes(w.state),
        ) && <CreateWindowSection programId={program.id} missions={missions} />}
      </div>

      {/* Training content quick links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href={`/dashboard/director/programs/${program.id}/assignments`}
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:border-teal-300 hover:shadow-sm transition-all group"
        >
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-teal-700">Assignments</p>
            <p className="text-xs text-gray-400 mt-0.5">View all trainee assignment submissions</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-teal-500"><polyline points="9 18 15 12 9 6" /></svg>
        </Link>
        <Link
          href="/dashboard/resources"
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:border-violet-300 hover:shadow-sm transition-all group"
        >
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-violet-700">Resources</p>
            <p className="text-xs text-gray-400 mt-0.5">Manage training materials and files</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-violet-500"><polyline points="9 18 15 12 9 6" /></svg>
        </Link>
      </div>

      {/* Topics & Trainers */}
      <TopicsPanel
        programId={program.id}
        topics={program.topics}
        trainers={allTrainers}
      />

      {/* Edit program form */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">
          Edit Program Details
        </h2>
        <ProgramEditForm program={program} />
      </div>
    </div>
  );
}

// ── Create Window inline section ──────────────────────────────────────────────

function CreateWindowSection({
  programId,
  missions,
}: {
  programId: string;
  missions: { id: string; code: string; name: string }[];
}) {
  return (
    <div className="border-t border-gray-100 pt-4">
      <p className="mb-3 text-xs font-medium text-gray-700">
        Create Application Window
      </p>
      {/* This form uses a server action directly — no client component needed */}
      <form
        action={async (fd: FormData) => {
          "use server";
          const { createWindowAction } = await import("@/actions/programs");
          await createWindowAction(programId, { ok: false }, fd);
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Advertising Start
            </label>
            <input
              type="date"
              name="advertisingStartDate"
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Applications Open <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="applicationOpenDate"
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Applications Close <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="applicationCloseDate"
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Training Start <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="trainingStartDate"
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Target Intake <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="targetIntake"
              placeholder="e.g. 100"
              min={1}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Scope to Mission (optional)
            </label>
            <select
              name="scopedToMissionId"
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
            >
              <option value="">All missions</option>
              {missions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code} — {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Notes
          </label>
          <input
            name="notes"
            placeholder="Optional notes about this window"
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-800 transition-colors"
          >
            Create Window
          </button>
        </div>
      </form>
    </div>
  );
}
