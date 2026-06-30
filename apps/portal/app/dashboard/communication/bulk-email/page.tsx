import { requireDbUser } from "@/lib/auth/helpers";
import { prisma, Prisma } from "@1000mm/db";
import Link from "next/link";
import { BulkEmailForm } from "./_components/BulkEmailForm";

const VERIFIED: Prisma.UserWhereInput = { emailVerified: { not: null } };

async function getAudienceCounts() {
  const [total, missionaries, trainees, trainers, directors, admins] =
    await Promise.all([
      prisma.user.count({ where: { ...VERIFIED } }),
      prisma.user.count({ where: { role: "TRAINEE", isMissionary: true, ...VERIFIED } }),
      prisma.user.count({ where: { role: "TRAINEE", ...VERIFIED } }),
      prisma.user.count({ where: { role: "TRAINER", ...VERIFIED } }),
      prisma.user.count({ where: { role: { in: ["MAIN_DIRECTOR", "ASSOCIATE_DIRECTOR", "LOCAL_DIRECTOR", "SECRETARY"] }, ...VERIFIED } }),
      prisma.user.count({ where: { role: "SYSTEM_ADMIN", ...VERIFIED } }),
    ]);

  return {
    all_users: total,
    missionaries,
    trainees,
    trainers,
    directors,
    admins,
  };
}

export default async function BulkEmailPage() {
  await requireDbUser(["SYSTEM_ADMIN"]);
  const counts = await getAudienceCounts();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/communication"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Bulk Email</h1>
          <p className="text-xs text-gray-500">Send an email campaign to your portal members</p>
        </div>
      </div>

      {/* Audience summary cards */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {[
          { label: "All Users",     count: counts.all_users,    color: "teal" },
          { label: "Missionaries",  count: counts.missionaries, color: "blue" },
          { label: "Trainees",      count: counts.trainees,     color: "violet" },
          { label: "Trainers",      count: counts.trainers,     color: "amber" },
          { label: "Directors",     count: counts.directors,    color: "rose" },
          { label: "Admins",        count: counts.admins,       color: "gray" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
            <p className="text-lg font-bold text-gray-900">{item.count}</p>
            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
        <strong>Note:</strong> Emails are sent via Resend in batches of 100. Only users with verified email addresses receive the email.
        Counts above reflect verified accounts only.
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-bold text-gray-900">Compose Email</h2>
        <BulkEmailForm counts={counts} />
      </div>
    </div>
  );
}
