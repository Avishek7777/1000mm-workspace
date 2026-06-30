"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTestimonyAction, togglePublishTestimonyAction } from "@/actions/testimonials";
import { EditTestimonyButton } from "./EditTestimonyButton";

type Testimony = {
  id: string;
  name: string;
  location: string;
  quote: string;
  color: string;
  order: number;
  isPublished: boolean;
};

export function TestimonyCard({ testimony }: { testimony: Testimony }) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const router = useRouter();

  function handleTogglePublish() {
    startTransition(async () => {
      await togglePublishTestimonyAction(testimony.id, testimony.isPublished);
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
      await deleteTestimonyAction(testimony.id);
      router.refresh();
    });
  }

  return (
    <div className={`rounded-xl border bg-white shadow-sm transition-opacity ${!testimony.isPublished ? "opacity-60" : ""}`}>
      {/* Color strip */}
      <div className={`h-1.5 rounded-t-xl bg-gradient-to-r ${testimony.color}`} />

      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${testimony.color} text-xs font-bold text-white`}>
              {testimony.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{testimony.name}</p>
              <p className="text-xs text-gray-400">{testimony.location} · Order {testimony.order}</p>
            </div>
          </div>
          {!testimony.isPublished && (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
              Draft
            </span>
          )}
        </div>
      </div>

      {/* Quote */}
      <div className="px-4 py-3">
        <p className="line-clamp-3 text-xs text-gray-500 leading-relaxed italic">
          &ldquo;{testimony.quote}&rdquo;
        </p>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-4 py-2.5">
        <button
          onClick={handleTogglePublish}
          disabled={isPending}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors"
        >
          {testimony.isPublished ? "Unpublish" : "Publish"}
        </button>
        <EditTestimonyButton testimony={testimony} />
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
  );
}
