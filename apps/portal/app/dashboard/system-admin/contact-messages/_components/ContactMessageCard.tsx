"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteContactMessageAction,
  replyToContactMessageAction,
  toggleContactMessageHandledAction,
  toggleContactMessageSpamAction,
} from "@/actions/contactMessages";

type ContactMessage = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  ipAddress: string | null;
  isSpam: boolean;
  isHandled: boolean;
  handledAt: string | null;
  handledByName: string | null;
  replyBody: string | null;
  repliedAt: string | null;
  repliedByName: string | null;
  createdAt: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ipLabel(ip: string | null): string {
  if (!ip) return "";
  if (ip === "::1" || ip === "127.0.0.1") return "IP: localhost (dev)";
  return `IP: ${ip}`;
}

function ReplyForm({
  messageId,
  onSent,
}: {
  messageId: string;
  onSent: () => void;
}) {
  const [reply, setReply] = useState("");
  const boundAction = replyToContactMessageAction.bind(null, messageId);
  const [state, action, pending] = useActionState(boundAction, { ok: false });

  useEffect(() => {
    if (state.ok) onSent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok]);

  return (
    <form action={action} className="border-t border-gray-100 px-4 py-3">
      {state.error && (
        <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.error}
        </div>
      )}
      <textarea
        name="reply"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={4}
        placeholder="Write your reply… It will be emailed from info@1000mm.org.bd."
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
      />
      {state.fieldErrors?.reply && (
        <p className="mt-0.5 text-xs text-red-500">{state.fieldErrors.reply}</p>
      )}
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={pending || !reply.trim()}
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
        >
          {pending ? "Sending…" : "Send Reply"}
        </button>
      </div>
    </form>
  );
}

export function ContactMessageCard({
  message,
  canDelete,
}: {
  message: ContactMessage;
  canDelete: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Something went wrong.");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    run(() => deleteContactMessageAction(message.id));
  }

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm ${
        message.isHandled ? "border-gray-200 opacity-75" : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">
              {message.fullName}
            </p>
            {message.isSpam && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                Spam
              </span>
            )}
            {message.replyBody ? (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                Replied
              </span>
            ) : (
              message.isHandled && (
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                  Handled
                </span>
              )
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            <a
              href={`mailto:${message.email}`}
              className="text-teal-700 hover:underline"
            >
              {message.email}
            </a>
            {message.phone && <> · {message.phone}</>}
          </p>
        </div>
        <p className="shrink-0 text-xs text-gray-400">
          {formatDate(message.createdAt)}
        </p>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {message.subject && (
          <p className="mb-1 text-sm font-medium text-gray-800">
            {message.subject}
          </p>
        )}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
          {message.message}
        </p>
        {message.isHandled && message.handledByName && !message.replyBody && (
          <p className="mt-3 text-xs text-gray-400">
            Handled by {message.handledByName}
            {message.handledAt && <> on {formatDate(message.handledAt)}</>}
          </p>
        )}
      </div>

      {/* Sent reply */}
      {message.replyBody && (
        <div className="mx-4 mb-3 rounded-lg border-l-2 border-teal-600 bg-teal-50/60 px-3 py-2">
          <p className="text-[11px] font-medium text-teal-800">
            Reply sent
            {message.repliedByName && <> by {message.repliedByName}</>}
            {message.repliedAt && <> on {formatDate(message.repliedAt)}</>} from
            info@1000mm.org.bd
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {message.replyBody}
          </p>
        </div>
      )}

      {error && (
        <div className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-2.5">
        <p className="text-[10px] text-gray-300">{ipLabel(message.ipAddress)}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setReplyOpen((o) => !o)}
            className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 transition-colors"
          >
            {replyOpen
              ? "Cancel Reply"
              : message.replyBody
                ? "Send Another Reply"
                : "Reply via Email"}
          </button>
          <button
            onClick={() =>
              run(() =>
                toggleContactMessageHandledAction(
                  message.id,
                  !message.isHandled,
                ),
              )
            }
            disabled={isPending}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            {message.isHandled ? "Mark as Unhandled" : "Mark as Handled"}
          </button>
          <button
            onClick={() =>
              run(() =>
                toggleContactMessageSpamAction(message.id, !message.isSpam),
              )
            }
            disabled={isPending}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            {message.isSpam ? "Not Spam" : "Mark as Spam"}
          </button>
          {canDelete && (
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
          )}
        </div>
      </div>

      {/* Reply form */}
      {replyOpen && (
        <ReplyForm
          messageId={message.id}
          onSent={() => {
            setReplyOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
