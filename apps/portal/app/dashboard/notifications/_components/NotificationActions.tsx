"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
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
