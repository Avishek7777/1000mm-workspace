import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import { FileText, Download, Globe, BookOpen } from "lucide-react";
import { UploadGeneralResourceForm } from "./_components/UploadGeneralResourceForm";
import { DeleteResourceButton } from "./_components/DeleteResourceButton";

export const metadata = { title: "Resources" };

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function ResourcesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const traineeId = session.user.id;
  const canManage = role === "SYSTEM_ADMIN" || role === "MAIN_DIRECTOR";

  // SA/UD fetch all programs for the upload form's scope selector
  const allPrograms = canManage
    ? await prisma.trainingProgram.findMany({
        where: { deletedAt: null },
        orderBy: { startDate: "desc" },
        select: { id: true, code: true, title: true },
      })
    : [];

  // Determine which program resources this user can see
  let programIds: string[] = [];
  if (role === "TRAINEE") {
    const enrollments = await prisma.programEnrollment.findMany({
      where: { traineeId, deletedAt: null },
      select: { programId: true },
    });
    programIds = enrollments.map((e) => e.programId);
  } else if (role === "TRAINER") {
    const programs = await prisma.trainingProgram.findMany({
      where: { topics: { some: { trainerId: session.user.id, deletedAt: null } }, deletedAt: null },
      select: { id: true },
    });
    programIds = programs.map((p) => p.id);
  }

  // SA/UD see all resources; others see general + their program's resources
  const whereClause = canManage
    ? { deletedAt: null }
    : {
        deletedAt: null,
        OR: [
          { programId: null },
          { programId: { in: programIds } },
        ],
      };

  const resources = await prisma.resource.findMany({
    where: whereClause,
    orderBy: [{ programId: "asc" }, { createdAt: "desc" }],
    include: {
      program: { select: { id: true, title: true, code: true } },
      uploadedBy: { select: { fullName: true } },
    },
  });

  const generalResources = resources.filter((r) => !r.programId);
  const programResources = resources.filter((r) => !!r.programId);

  // Group program resources by programId
  const byProgram = programResources.reduce<Record<string, typeof programResources>>((acc, r) => {
    const key = r.programId!;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  function renderTable(items: typeof resources, showUploader: boolean) {
    if (items.length === 0) return <p className="py-6 text-center text-xs text-gray-400">No resources yet.</p>;
    return (
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-3 pl-5 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Title</th>
              {showUploader && <th className="hidden sm:table-cell py-3 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">By</th>}
              <th className="hidden sm:table-cell py-3 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Date</th>
              <th className="hidden sm:table-cell py-3 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Size</th>
              <th className="py-3 pr-5 text-right text-[10px] font-semibold uppercase tracking-widest text-gray-400">Download</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={r.id} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                <td className="py-3 pl-5 pr-2">
                  <p className="text-xs font-medium text-gray-900">{r.title}</p>
                  {r.description && <p className="text-[10px] text-gray-400">{r.description}</p>}
                </td>
                {showUploader && (
                  <td className="hidden sm:table-cell py-3 pr-2 text-xs text-gray-500">{r.uploadedBy.fullName}</td>
                )}
                <td className="hidden sm:table-cell py-3 pr-2 text-xs text-gray-400">{fmtDate(r.createdAt)}</td>
                <td className="hidden sm:table-cell py-3 pr-2 text-xs text-gray-400">{fmtSize(r.fileSizeBytes)}</td>
                <td className="py-3 pr-5">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={`/api/uploads/${r.fileStorageKey}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800"
                      title={`Download ${r.fileName}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{r.fileName}</span>
                    </a>
                    {canManage && <DeleteResourceButton id={r.id} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Resources</h1>
          <p className="mt-0.5 text-sm text-gray-500">Training materials and documents</p>
        </div>
        {canManage && <UploadGeneralResourceForm programs={allPrograms} />}
      </div>

      {/* General Resources */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-teal-600" />
          <p className="text-sm font-semibold text-gray-800">General Resources</p>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{generalResources.length}</span>
        </div>
        {renderTable(generalResources, true)}
      </div>

      {/* Program-specific Resources */}
      {Object.keys(byProgram).length > 0 && (
        <div className="space-y-6">
          {Object.entries(byProgram).map(([, items]) => {
            const prog = items[0].program!;
            return (
              <div key={prog.id}>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-violet-600" />
                  <p className="text-sm font-semibold text-gray-800">{prog.title}</p>
                  <span className="font-mono text-[10px] text-gray-400">{prog.code}</span>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] text-violet-600">{items.length} file{items.length !== 1 ? "s" : ""}</span>
                </div>
                {renderTable(items, canManage)}
              </div>
            );
          })}
        </div>
      )}

      {resources.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 py-20 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">No resources available yet.</p>
        </div>
      )}
    </div>
  );
}
