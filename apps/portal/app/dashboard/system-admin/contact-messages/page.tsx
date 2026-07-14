import Link from "next/link";
import { requireRole } from "@/lib/auth/helpers";
import { prisma } from "@1000mm/db";
import { ContactMessageCard } from "./_components/ContactMessageCard";

type Tab = "inbox" | "handled" | "spam";

const TAB_LABELS: Record<Tab, string> = {
  inbox: "Inbox",
  handled: "Handled",
  spam: "Spam",
};

function whereForTab(tab: Tab) {
  switch (tab) {
    case "inbox":
      return { deletedAt: null, isSpam: false, isHandled: false };
    case "handled":
      return { deletedAt: null, isSpam: false, isHandled: true };
    case "spam":
      return { deletedAt: null, isSpam: true };
  }
}

export default async function ContactMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireRole([
    "SYSTEM_ADMIN",
    "MAIN_DIRECTOR",
    "SECRETARY",
    "ASSOCIATE_DIRECTOR",
  ]);

  const { tab: rawTab } = await searchParams;
  const tab: Tab =
    rawTab === "handled" || rawTab === "spam" ? rawTab : "inbox";

  const [messages, inboxCount, handledCount, spamCount] = await Promise.all([
    prisma.contactMessage.findMany({
      where: whereForTab(tab),
      orderBy: { createdAt: "desc" },
    }),
    prisma.contactMessage.count({ where: whereForTab("inbox") }),
    prisma.contactMessage.count({ where: whereForTab("handled") }),
    prisma.contactMessage.count({ where: whereForTab("spam") }),
  ]);

  // handledById/repliedById have no Prisma relation — resolve names in one query.
  const staffIds = [
    ...new Set(
      messages
        .flatMap((m) => [m.handledById, m.repliedById])
        .filter(Boolean) as string[],
    ),
  ];
  const staff = staffIds.length
    ? await prisma.user.findMany({
        where: { id: { in: staffIds } },
        select: { id: true, fullName: true },
      })
    : [];
  const staffNames = Object.fromEntries(staff.map((h) => [h.id, h.fullName]));

  const counts: Record<Tab, number> = {
    inbox: inboxCount,
    handled: handledCount,
    spam: spamCount,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          Contact Messages
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Messages submitted through the public website contact form
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <Link
            key={t}
            href={t === "inbox" ? "?" : `?tab=${t}`}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {TAB_LABELS[t]}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                tab === t
                  ? "bg-teal-100 text-teal-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {counts[t]}
            </span>
          </Link>
        ))}
      </div>

      {messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm text-gray-400">
            {tab === "inbox"
              ? "No new messages. All caught up!"
              : `No ${tab} messages.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <ContactMessageCard
              key={m.id}
              message={{
                id: m.id,
                fullName: m.fullName,
                email: m.email,
                phone: m.phone,
                subject: m.subject,
                message: m.message,
                ipAddress: m.ipAddress,
                isSpam: m.isSpam,
                isHandled: m.isHandled,
                handledAt: m.handledAt?.toISOString() ?? null,
                handledByName: m.handledById
                  ? (staffNames[m.handledById] ?? "Unknown")
                  : null,
                replyBody: m.replyBody,
                repliedAt: m.repliedAt?.toISOString() ?? null,
                repliedByName: m.repliedById
                  ? (staffNames[m.repliedById] ?? "Unknown")
                  : null,
                createdAt: m.createdAt.toISOString(),
              }}
              canDelete={user.role === "SYSTEM_ADMIN"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
