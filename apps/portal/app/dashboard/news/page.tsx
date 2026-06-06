import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import Link from "next/link";

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

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page ?? "1", 10));
  const PAGE_SIZE = 10;
  const now = new Date();

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where: {
        deletedAt: null,
        publishedAt: { not: null, lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { publishedAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { createdBy: { select: { fullName: true } } },
    }),
    prisma.announcement.count({
      where: {
        deletedAt: null,
        publishedAt: { not: null, lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          News &amp; Announcements
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Official updates from 1000 Missionary Movement Bangladesh
        </p>
      </div>

      {/* Empty state */}
      {announcements.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <svg
            className="mx-auto mb-3 h-8 w-8 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <p className="text-sm text-gray-400">No announcements yet.</p>
          <p className="mt-1 text-xs text-gray-300">
            Check back later for updates from the organization.
          </p>
        </div>
      )}

      {/* Announcement cards */}
      <div className="space-y-4">
        {announcements.map((a) => (
          <div
            key={a.id}
            className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-sm transition-shadow"
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <h2 className="text-sm font-semibold text-gray-900 leading-snug">
                {a.title}
              </h2>
              <span className="flex-shrink-0 text-[11px] text-gray-400">
                {timeAgo(a.publishedAt!)}
              </span>
            </div>

            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {a.body}
            </p>

            {a.attachmentUrl && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <a
                  href={a.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  View attachment
                </a>
              </div>
            )}

            <div className="mt-3 flex items-center gap-1 text-[11px] text-gray-400">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {a.createdBy.fullName}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {(pageNum - 1) * PAGE_SIZE + 1}–
            {Math.min(pageNum * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link
                href={`?page=${pageNum - 1}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                ← Prev
              </Link>
            )}
            {pageNum < totalPages && (
              <Link
                href={`?page=${pageNum + 1}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
