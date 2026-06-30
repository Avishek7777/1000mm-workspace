"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  createProgramTopicAction,
  deleteProgramTopicAction,
  assignTrainerToTopicAction,
  unassignTrainerFromTopicAction,
  updateProgramTopicAction,
} from "@/actions/programTopics";
import { Pencil, Trash2, UserPlus, UserMinus, Plus, Check, X } from "lucide-react";

type Trainer = { id: string; fullName: string; homeMission: { code: string } };
type Topic = {
  id: string;
  title: string;
  order: number;
  trainer: { id: string; fullName: string } | null;
};

// ── Add Topic Form ────────────────────────────────────────────────────────────

function AddTopicForm({ programId }: { programId: string }) {
  const [state, formAction, pending] = useActionState(createProgramTopicAction, { ok: false });
  const ref = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" /> Add Topic
      </button>
    );
  }

  return (
    <form ref={ref} action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="programId" value={programId} />
      <input
        name="title"
        placeholder="Topic title (e.g. Bible Study Methods)"
        autoFocus
        className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-teal-500"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
      >
        {pending ? "…" : "Add"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
      >
        Cancel
      </button>
      {!state.ok && state.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
    </form>
  );
}

// ── Assign Trainer Inline ─────────────────────────────────────────────────────

function AssignTrainerForm({
  topic,
  trainers,
}: {
  topic: Topic;
  trainers: Trainer[];
}) {
  const [assignState, assignAction, assignPending] = useActionState(assignTrainerToTopicAction, { ok: false });
  const [unassignState, unassignAction, unassignPending] = useActionState(unassignTrainerFromTopicAction, { ok: false });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (assignState.ok || unassignState.ok) setOpen(false);
  }, [assignState, unassignState]);

  if (topic.trainer) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-700">{topic.trainer.fullName}</span>
        <form action={unassignAction}>
          <input type="hidden" name="topicId" value={topic.id} />
          <button
            type="submit"
            disabled={unassignPending}
            title="Remove trainer"
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
          >
            <UserMinus className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg border border-dashed border-gray-200 px-2 py-1 text-[10px] font-medium text-gray-400 hover:border-teal-300 hover:text-teal-600 transition-colors"
      >
        <UserPlus className="h-3 w-3" /> Assign Trainer
      </button>
    );
  }

  return (
    <form action={assignAction} className="flex items-center gap-2">
      <input type="hidden" name="topicId" value={topic.id} />
      <select
        name="trainerId"
        autoFocus
        className="rounded-lg border border-gray-300 px-2 py-1 text-xs outline-none focus:border-teal-500"
        defaultValue=""
      >
        <option value="" disabled>Select trainer…</option>
        {trainers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.fullName} ({t.homeMission.code})
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={assignPending}
        className="rounded-lg bg-teal-700 px-2 py-1 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {assignPending ? "…" : <Check className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {!assignState.ok && assignState.error && (
        <p className="text-xs text-red-600">{assignState.error}</p>
      )}
    </form>
  );
}

// ── Topic Row ─────────────────────────────────────────────────────────────────

function TopicRow({ topic, trainers }: { topic: Topic; trainers: Trainer[] }) {
  const [deleteState, deleteAction, deletePending] = useActionState(deleteProgramTopicAction, { ok: false });
  const [editState, editAction, editPending] = useActionState(updateProgramTopicAction, { ok: false });
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editState.ok) setEditing(false);
  }, [editState]);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3">
      <span className="w-5 text-center text-xs font-medium text-gray-400">{topic.order}</span>

      {/* Title */}
      <div className="min-w-0 flex-1">
        {editing ? (
          <form action={editAction} className="flex items-center gap-2">
            <input type="hidden" name="topicId" value={topic.id} />
            <input
              ref={inputRef}
              name="title"
              defaultValue={topic.title}
              autoFocus
              className="rounded border border-gray-300 px-2 py-0.5 text-sm outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={editPending}
              className="rounded bg-teal-700 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {editPending ? "…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded border border-gray-200 px-2 py-0.5 text-[10px] text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </button>
            {!editState.ok && editState.error && (
              <p className="text-xs text-red-600">{editState.error}</p>
            )}
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800">{topic.title}</span>
            <button
              onClick={() => setEditing(true)}
              className="rounded p-0.5 text-gray-300 hover:text-gray-500 transition-colors"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Trainer assignment */}
      <div className="shrink-0">
        <AssignTrainerForm topic={topic} trainers={trainers} />
      </div>

      {/* Delete */}
      <form action={deleteAction}>
        <input type="hidden" name="topicId" value={topic.id} />
        <button
          type="submit"
          disabled={deletePending || !!topic.trainer}
          title={topic.trainer ? "Remove trainer first" : "Delete topic"}
          className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </form>
      {!deleteState.ok && deleteState.error && (
        <p className="text-xs text-red-600">{deleteState.error}</p>
      )}
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function TopicsPanel({
  programId,
  topics,
  trainers,
}: {
  programId: string;
  topics: Topic[];
  trainers: Trainer[];
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Topics & Trainers</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {topics.length} topic{topics.length !== 1 ? "s" : ""} ·{" "}
            {topics.filter((t) => t.trainer).length} assigned
          </p>
        </div>
      </div>

      {topics.length === 0 ? (
        <div className="mb-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 py-8 text-center">
          <p className="text-xs text-gray-400">No topics yet. Add one below.</p>
        </div>
      ) : (
        <div className="mb-4 space-y-2">
          {topics.map((topic) => (
            <TopicRow key={topic.id} topic={topic} trainers={trainers} />
          ))}
        </div>
      )}

      <AddTopicForm programId={programId} />
    </div>
  );
}
