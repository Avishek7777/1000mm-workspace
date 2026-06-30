import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { UploadResourceForm } from "./_components/UploadResourceForm";
import { DeleteResourceButton } from "./_components/DeleteResourceButton";

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function ProgramResourcesPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "TRAINER") redirect("/dashboard");

  const program = await prisma.trainingProgram.findFirst({
    where: { id: programId, trainers: { some: { id: session.user.id } }, deletedAt: null } as any,
    select: { id: true, title: true, code: true },
  });
  if (!program) redirect("/dashboard/programs");

  const resources = await prisma.resource.findMany({
    where: { programId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { fullName: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Link href="/dashboard/programs" className="text-xs text-gray-400 hover:text-gray-600">{program.code}</Link>
            <span className="text-xs text-gray-300">/</span>
            <span className="text-xs text-gray-600">Resources</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">{program.title}</h1>
          <p className="mt-0.5 text-sm text-gray-500">Files shared with enrolled trainees</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/programs/${programId}/assignments`} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
            ← Assignments
          </Link>
          <UploadResourceForm programId={programId} />
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">No resources uploaded yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 pl-5 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Title</th>
                <th className="hidden sm:table-cell py-3 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Uploaded</th>
                <th className="hidden sm:table-cell py-3 pr-2 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400">Size</th>
                <th className="py-3 pr-5 text-right text-[10px] font-semibold uppercase tracking-widest text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r, i) => (
                <tr key={r.id} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="py-3 pl-5 pr-2">
                    <p className="text-xs font-medium text-gray-900">{r.title}</p>
                    {r.description && <p className="text-[10px] text-gray-400 mt-0.5">{r.description}</p>}
                    <p className="text-[10px] text-gray-300 mt-0.5 font-mono">{r.fileName}</p>
                  </td>
                  <td className="hidden sm:table-cell py-3 pr-2 text-xs text-gray-500">
                    {fmtDate(r.createdAt)}
                  </td>
                  <td className="hidden sm:table-cell py-3 pr-2 text-xs text-gray-400">{fmtSize(r.fileSizeBytes)}</td>
                  <td className="py-3 pr-5">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/api/uploads/${r.fileStorageKey}`} target="_blank" rel="noreferrer" className="text-teal-600 hover:text-teal-800" title="Download">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <DeleteResourceButton id={r.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
