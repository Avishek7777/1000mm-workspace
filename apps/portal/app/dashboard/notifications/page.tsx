import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import {
  MarkAllReadButton,
  MarkReadLink,
  ClearReadButton,
  ClearAllButton,
} from "./_components/NotificationActions";

// ─── Template rendering ───────────────────────────────────────────────────────

type TemplateData = Record<string, unknown>;

function renderNotification(
  templateKey: string,
  data: TemplateData,
): {
  title: string;
  body: string;
  icon: "announcement" | "application" | "complaint" | "response" | "urgent";
} {
  switch (templateKey) {
    case "announcement.published":
      return {
        icon: "announcement",
        title: "New Announcement",
        body: (data.title as string) ?? "A new announcement has been posted.",
      };
    case "application.status_changed":
      return {
        icon: "application",
        title: data.status === "REJECTED" ? "Application Not Approved" : "Application Status Updated",
        body:
          data.status === "REJECTED"
            ? (data.reason as string)
              ? `Your application was not approved. Reason: ${data.reason as string}`
              : "Your application was not approved this time. Contact your Local Mission Director for details."
            : `Your application status changed to ${(data.status as string)?.replace(/_/g, " ").toLowerCase() ?? "a new status"}.`,
      };
    case "application.submitted_to_lmd":
      return {
        icon: "application",
        title: "New Application Submitted",
        body: (data.applicantName as string)
          ? `${data.applicantName as string} submitted a new application${data.referenceNumber ? ` (${data.referenceNumber as string})` : ""}. It's waiting in your review queue.`
          : "A new application was submitted to your mission and is waiting for review.",
      };
    case "application.recommended_to_ud":
      return {
        icon: "application",
        title: "Application Awaiting Your Review",
        body: (data.applicantName as string)
          ? `${data.applicantName as string}'s application was recommended by the Local Mission Director and now needs your final review.`
          : "An application was recommended and now needs your final review.",
      };
    case "complaint.submitted":
      return {
        icon: "complaint",
        title: "New Complaint Received",
        body: data.isAnonymous
          ? `An anonymous ${(data.category as string)?.toLowerCase() ?? "complaint"} has been submitted.`
          : `${data.submitterName ?? "Someone"} submitted a ${(data.category as string)?.toLowerCase() ?? "complaint"}: "${data.subject}"`,
      };
    case "complaint.response":
      return {
        icon: "response",
        title: "Your Complaint Has Been Responded To",
        body: `${data.responderName ?? "Staff"} responded to your complaint: "${data.subject}"`,
      };
    case "urgent_report.issued":
      return {
        icon: "urgent",
        title: "Urgent Report Issued",
        body: (data.title as string)
          ? `Action required: "${data.title as string}"`
          : "A new urgent report has been issued. Please read and acknowledge.",
      };
    case "lmd_report.window_opened":
      return {
        icon: "announcement",
        title: "LMD Report Submission Open",
        body: (data.period as string)
          ? `The report window for ${data.period as string} is now open. Please submit your mission report.`
          : "A new LMD report submission window has opened. Please submit your report.",
      };
    case "certificate.issued":
      return {
        icon: "application",
        title: "Your Certificate Is Ready",
        body: (data.programTitle as string)
          ? `Your completion certificate for ${data.programTitle as string} has been issued. Download it from My Certificate.`
          : "Your completion certificate has been issued. Download it from your dashboard.",
      };
    case "salary.request_submitted":
      return {
        icon: "application",
        title: "Salary Request Submitted",
        body: (data.period as string)
          ? `Your Local Mission Director submitted your salary request for ${data.period as string}.`
          : "Your Local Mission Director submitted a salary request on your behalf.",
      };
    case "salary.request_reviewed":
      return {
        icon: "application",
        title: data.status === "APPROVED" ? "Salary Request Approved" : "Salary Request Rejected",
        body: (data.period as string)
          ? `Your salary request for ${data.period as string} was ${((data.status as string) ?? "").toLowerCase()}.`
          : `Your salary request was ${((data.status as string) ?? "").toLowerCase()}.`,
      };
    default:
      return {
        icon: "announcement",
        title: "Notification",
        body: "You have a new notification.",
      };
  }
}

const ICON_MAP = {
  urgent: (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </div>
  ),
  announcement: (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    </div>
  ),
  application: (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    </div>
  ),
  complaint: (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </div>
  ),
  response: (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      </svg>
    </div>
  ),
};

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const PERIOD_LABELS: Record<string, string> = {
  day: "Today",
  week: "This Week",
  month: "This Month",
  year: "This Year",
};

function periodToDate(period: string): Date | undefined {
  const now = new Date();
  switch (period) {
    case "day":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "year":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return undefined;
  }
}

const PAGE_SIZE = 20;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; period?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { page, period } = await searchParams;
  const pageNum = Math.max(1, parseInt(page ?? "1", 10));
  const since = period ? periodToDate(period) : undefined;

  const periodFilter = since ? { createdAt: { gte: since } } : {};

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id, channel: "IN_APP", ...periodFilter },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.notification.count({
      where: { userId: session.user.id, channel: "IN_APP", ...periodFilter },
    }),
    prisma.notification.count({
      where: { userId: session.user.id, channel: "IN_APP", readAt: null },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const paginationBase = period ? `?period=${period}` : "?";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && <MarkAllReadButton />}
          <ClearReadButton />
          <ClearAllButton />
        </div>
      </div>

      {/* Period filters */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/notifications"
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${!period ? "border-teal-400 bg-teal-50 text-teal-800" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
        >
          All
        </Link>
        {Object.entries(PERIOD_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={`?period=${key}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${period === key ? "border-teal-400 bg-teal-50 text-teal-800" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {notifications.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <svg className="mx-auto mb-3 h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <p className="text-sm text-gray-400">
            {period ? `No notifications for ${PERIOD_LABELS[period]?.toLowerCase()}.` : "No notifications yet."}
          </p>
        </div>
      )}

      {/* Notifications list */}
      <div className="space-y-2">
        {notifications.map((n) => {
          const data = (n.templateData as TemplateData) ?? {};
          const { title, body, icon } = renderNotification(n.templateKey, data);
          const isUnread = !n.readAt;

          const content = (
            <div className={`flex items-start gap-3 rounded-xl border bg-white p-4 transition-colors hover:shadow-sm ${isUnread ? "border-teal-200 bg-teal-50/30" : "border-gray-100"}`}>
              <div className="flex-shrink-0 mt-0.5">{ICON_MAP[icon]}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${isUnread ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                    {title}
                  </p>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {timeAgo(n.createdAt)}
                    </span>
                    {isUnread && <span className="h-2 w-2 rounded-full bg-teal-500 flex-shrink-0" />}
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">{body}</p>
              </div>
            </div>
          );

          return (
            <MarkReadLink
              key={n.id}
              notificationId={n.id}
              actionUrl={n.actionUrl}
              isUnread={isUnread}
            >
              {content}
            </MarkReadLink>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(pageNum - 1) * PAGE_SIZE + 1}–{Math.min(pageNum * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link href={`${paginationBase}&page=${pageNum - 1}`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                ← Prev
              </Link>
            )}
            {pageNum < totalPages && (
              <Link href={`${paginationBase}&page=${pageNum + 1}`} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
