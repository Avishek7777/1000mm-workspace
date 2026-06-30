"use client";

import { useState, useTransition } from "react";
import {
  createTopicAction,
  assignTopicTrainerAction,
  deleteTopicAction,
} from "@/actions/topics";

type Trainer = { id: string; fullName: string; homeMission?: { code: string } | null };
type Topic = { id: string; title: string; order: number; trainer: { id: string; fullName: string } | null };

export function TopicsPanel({
  programId,
  topics,
  trainers,
}: {
  programId: string;
  topics: Topic[];
  trainers: Trainer[];
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Topics & Trainers</h2>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Topic
        </button>
      </div>

      {/* Add topic form */}
      {showAdd && (
        <form
          action={async (fd) => {
            fd.set("programId", programId);
            startTransition(async () => {
              await createTopicAction(fd);
              setShowAdd(false);
            });
          }}
          className="mb-4 rounded-lg border border-teal-200 bg-teal-50 p-3 space-y-2"
        >
          <div className="flex gap-2">
            <input
              name="title"
              required
              placeholder="Topic title"
              className="flex-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs outline-none focus:border-teal-500"
            />
            <input
              name="order"
              type="number"
              placeholder="Order"
              defaultValue={topics.length + 1}
              className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-md px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}

      {topics.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">No topics yet — add curriculum topics above.</p>
      ) : (
        <div className="space-y-2">
          {topics.map((topic) => (
            <TopicRow key={topic.id} topic={topic} trainers={trainers} />
          ))}
        </div>
      )}
    </div>
  );
}

function TopicRow({ topic, trainers }: { topic: Topic; trainers: Trainer[] }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
        {topic.order}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 truncate">{topic.title}</p>
        {!editing ? (
          <p className="text-[11px] text-gray-500 mt-0.5">
            {topic.trainer ? topic.trainer.fullName : <span className="text-amber-600">No trainer assigned</span>}
          </p>
        ) : (
          <form
            action={async (fd) => {
              fd.set("topicId", topic.id);
              startTransition(async () => {
                await assignTopicTrainerAction(fd);
                setEditing(false);
              });
            }}
            className="mt-1 flex items-center gap-1.5"
          >
            <select
              name="trainerId"
              defaultValue={topic.trainer?.id ?? ""}
              className="flex-1 rounded border border-gray-300 px-1.5 py-1 text-[11px] outline-none focus:border-teal-500"
            >
              <option value="">— Unassigned —</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}{t.homeMission ? ` (${t.homeMission.code})` : ""}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-teal-700 px-2 py-1 text-[11px] font-medium text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {isPending ? "…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded px-1.5 py-1 text-[11px] text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      <div className="flex-shrink-0 flex items-center gap-1">
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="rounded p-1.5 text-gray-400 hover:bg-white hover:text-teal-700 transition-colors"
            title="Assign trainer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </button>
        )}
        <form
          action={async (fd) => {
            fd.set("topicId", topic.id);
            startTransition(() => { void deleteTopicAction(fd); });
          }}
        >
          <button
            type="submit"
            disabled={isPending}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Delete topic"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" /><path d="M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
