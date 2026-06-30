"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
  clearReadNotificationsAction,
  clearAllNotificationsAction,
} from "@/actions/notifications";

// ── Mark All Read button ──────────────────────────────────────────────────────

export function MarkAllReadButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handle() {
    await markAllNotificationsReadAction();
    startTransition(() => router.refresh());
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors"
    >
      {isPending ? "Marking…" : "Mark all read"}
    </button>
  );
}

// ── Clear Read button ─────────────────────────────────────────────────────────

export function ClearReadButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handle() {
    await clearReadNotificationsAction();
    startTransition(() => router.refresh());
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60 transition-colors"
    >
      {isPending ? "Clearing…" : "Clear read"}
    </button>
  );
}

// ── Clear All button ──────────────────────────────────────────────────────────

export function ClearAllButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handle() {
    if (!confirm("Delete all notifications? This cannot be undone.")) return;
    await clearAllNotificationsAction();
    startTransition(() => router.refresh());
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-60 transition-colors"
    >
      {isPending ? "Clearing…" : "Clear all"}
    </button>
  );
}

// ── Mark Read on click + optional redirect ────────────────────────────────────

export function MarkReadLink({
  notificationId,
  actionUrl,
  isUnread,
  children,
}: {
  notificationId: string;
  actionUrl: string | null;
  isUnread: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handle() {
    if (isUnread) {
      await markNotificationReadAction(notificationId);
    }
    if (actionUrl) {
      router.push(actionUrl);
    } else {
      startTransition(() => router.refresh());
    }
  }

  return (
    <div
      onClick={handle}
      className={`cursor-pointer ${isPending ? "opacity-70" : ""}`}
    >
      {children}
    </div>
  );
}
