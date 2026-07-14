"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProjectAction, togglePublishAction } from "@/actions/projects";
import { EditProjectButton } from "./EditProjectButton";

type Project = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  location: string;
  date: string;
  images: string[];
  tags: string[];
  status: string;
  goal?: string | null;
  participants?: number | null;
  highlight?: string | null;
  body?: string | null;
  budget?: string | null;
  objectives?: string[];
  order: number;
  isPublished: boolean;
};

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-teal-100 text-teal-700",
  Completed: "bg-gray-100 text-gray-600",
  Upcoming: "bg-blue-100 text-blue-700",
};

export function ProjectCard({
  project,
  siteUrl,
}: {
  project: Project;
  siteUrl?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  function handleTogglePublish() {
    startTransition(async () => {
      await togglePublishAction(project.id, project.isPublished);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    startTransition(async () => {
      await deleteProjectAction(project.id);
      router.refresh();
    });
  }

  return (
    <div className={`relative rounded-xl border bg-white shadow-sm transition-opacity ${!project.isPublished ? "opacity-60" : ""}`}>
      {/* Image — website-static paths (/images/…) live on the public site,
          portal uploads (/api/uploads/…) are served locally */}
      {project.images[0] && (
        <div className="h-36 overflow-hidden rounded-t-xl bg-gray-100">
          <img
            src={
              project.images[0].startsWith("/api/uploads") ||
              project.images[0].startsWith("http")
                ? project.images[0]
                : `${siteUrl ?? ""}${project.images[0]}`
            }
            alt={project.title}
            className="h-full w-full object-cover"
            onError={(e) => { e.currentTarget.parentElement!.style.display = "none"; }}
          />
          {project.images.length > 1 && (
            <span className="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
              {project.images.length} photos
            </span>
          )}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{project.title}</p>
            <p className="mt-0.5 truncate text-xs text-gray-400 font-mono">/{project.slug}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[project.status] ?? "bg-gray-100 text-gray-600"}`}>
              {project.status}
            </span>
            {!project.isPublished && (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
                Draft
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 text-xs text-gray-600 space-y-1.5">
        <p className="line-clamp-2 text-gray-500">{project.subtitle}</p>
        {project.goal && (
          <p className="text-teal-700 font-medium line-clamp-1">Goal: {project.goal}</p>
        )}
        {project.highlight && (
          <p className="text-gray-700 line-clamp-1 italic">{project.highlight}</p>
        )}
        <div className="flex items-center gap-2 text-gray-400">
          <span>{project.location}</span>
          <span>·</span>
          <span>{project.date}</span>
          {project.participants != null && (
            <>
              <span>·</span>
              <span className="text-violet-600 font-medium">{project.participants.toLocaleString()} participants</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
              {tag}
            </span>
          ))}
        </div>

        {/* Content completeness indicators */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { label: "Story", ok: !!project.body },
            { label: `Objectives ${project.objectives?.length ?? 0}`, ok: (project.objectives?.length ?? 0) > 0 },
            { label: `Photos ${project.images.length}/5`, ok: project.images.length > 1 },
            { label: "Highlight", ok: !!project.highlight },
            { label: "Budget", ok: !!project.budget },
          ].map((c) => (
            <span
              key={c.label}
              title={c.ok ? "Set" : "Missing — the website section for this stays hidden"}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${c.ok ? "bg-teal-50 text-teal-700" : "bg-gray-50 text-gray-400 line-through decoration-gray-300"}`}
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-4 py-2.5">
        {siteUrl && project.isPublished ? (
          <a
            href={`${siteUrl}/current-projects/${project.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-teal-600 hover:underline"
          >
            View on site ↗
          </a>
        ) : (
          <span className="text-[10px] text-gray-300">
            {project.isPublished ? "" : "Not visible on website"}
          </span>
        )}
        <div className="flex items-center gap-2">
        <button
          onClick={handleTogglePublish}
          disabled={isPending}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors"
        >
          {project.isPublished ? "Unpublish" : "Publish"}
        </button>
        <EditProjectButton project={project} />
        <button
          onClick={handleDelete}
          disabled={isPending}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
            confirmDelete
              ? "bg-red-600 text-white hover:bg-red-700"
              : "border border-red-200 text-red-600 hover:bg-red-50"
          }`}
        >
          {confirmDelete ? "Confirm delete" : "Delete"}
        </button>
        </div>
      </div>
    </div>
  );
}
