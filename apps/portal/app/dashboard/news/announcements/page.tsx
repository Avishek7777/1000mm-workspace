import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import Link from "next/link";
import { AnnouncementActions } from "./_components/AnnouncementActions";

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AnnouncementsPage() {
  await requireRole(["SYSTEM_ADMIN"]);

  const announcements = await prisma.announcement.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { fullName: true } } },
  });

  const now = new Date();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Announcements</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {
              announcements.filter((a) => a.publishedAt && a.publishedAt <= now)
                .length
            }{" "}
            published · {announcements.filter((a) => !a.publishedAt).length}{" "}
            drafts
          </p>
        </div>
        <Link
          href="/dashboard/news/announcements/new"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Announcement
        </Link>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">No announcements yet.</p>
          <Link
            href="/dashboard/news/announcements/new"
            className="mt-2 inline-block text-xs text-teal-600 hover:underline"
          >
            Create your first announcement →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const isPublished = !!a.publishedAt && a.publishedAt <= now;
            const isExpired = !!a.expiresAt && a.expiresAt <= now;

            return (
              <div
                key={a.id}
                className={`rounded-xl border bg-white p-5 ${isPublished && !isExpired ? "border-teal-200" : "border-gray-200"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {isPublished && !isExpired && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />{" "}
                          Published
                        </span>
                      )}
                      {isExpired && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                          Expired
                        </span>
                      )}
                      {!isPublished && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          Draft
                        </span>
                      )}
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      {a.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {a.body}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-gray-400">
                      <span>Created {formatDate(a.createdAt)}</span>
                      {a.publishedAt && (
                        <span>Published {formatDate(a.publishedAt)}</span>
                      )}
                      {a.expiresAt && (
                        <span>Expires {formatDate(a.expiresAt)}</span>
                      )}
                    </div>
                  </div>
                  <AnnouncementActions id={a.id} isPublished={isPublished} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
