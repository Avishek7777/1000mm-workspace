import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@1000mm/db";
import Link from "next/link";

const INFO_EMAIL = "info@1000mm.org.bd";
const DONATE_EMAIL = "donate@1000mm.org.bd";

export default async function CommunicationHubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const isSA = user.role === "SYSTEM_ADMIN";

  type Card = {
    title: string;
    description: string;
    href: string;
    label: string;
    adminOnly: boolean;
    disabled?: boolean;
    color: "teal" | "blue" | "violet" | "orange" | "rose";
    iconPath: string;
  };

  const cards: Card[] = [
    {
      title: "Announcements",
      description:
        "Create and publish organization-wide, mission, or district announcements visible to all portal users.",
      href: isSA ? "/dashboard/news/announcements" : "/dashboard/news",
      label: "Open Announcements",
      adminOnly: false,
      color: "teal",
      iconPath: "M3 11l19-9-9 19-2-8-8-2z",
    },
    {
      title: "Bulk Email",
      description: `Compose and send bulk emails to all users, trainees, trainers, or directors. Sends from ${INFO_EMAIL} for general messages or ${DONATE_EMAIL} for donation outreach.`,
      href: "/dashboard/communication/bulk-email",
      label: "Open Email",
      adminOnly: true,
      color: "blue",
      iconPath:
        "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22,6 12,13 2,6",
    },
    {
      title: "In-App Notifications",
      description:
        "View and manage in-app notifications. SA can broadcast alerts to all active members.",
      href: "/dashboard/notifications",
      label: "Open Notifications",
      adminOnly: false,
      color: "violet",
      iconPath:
        "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
    },
    {
      title: "SMS Notifications",
      description:
        "Send targeted SMS alerts for urgent notices, training schedules, and field updates.",
      href: "#",
      label: "Coming Soon",
      adminOnly: true,
      disabled: true,
      color: "orange",
      iconPath:
        "M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z M12 18h.01",
    },
    {
      title: "Complaints & Feedback",
      description:
        "View and respond to submitted complaints and member feedback from across the mission field.",
      href: "/dashboard/complaints",
      label: "Open Complaints",
      adminOnly: false,
      color: "rose",
      iconPath:
        "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    },
  ];

  const COLOR = {
    teal:   { icon: "bg-teal-50 text-teal-600",     btn: "bg-teal-700 hover:bg-teal-800" },
    blue:   { icon: "bg-blue-50 text-blue-600",     btn: "bg-blue-700 hover:bg-blue-800" },
    violet: { icon: "bg-violet-50 text-violet-600", btn: "bg-violet-700 hover:bg-violet-800" },
    orange: { icon: "bg-orange-50 text-orange-400", btn: "bg-gray-200 cursor-not-allowed text-gray-400" },
    rose:   { icon: "bg-rose-50 text-rose-500",     btn: "bg-rose-700 hover:bg-rose-800" },
  } as const;

  const visible = cards.filter((c) => !c.adminOnly || isSA);

  return (
    <div className="mx-auto max-w-5xl space-y-8">

      {/* ── Banner ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900 px-8 py-10 text-white">
        {/* Wave rings decoration */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='250' cy='150' r='120' stroke='white' stroke-width='1.5' fill='none'/%3E%3Ccircle cx='250' cy='150' r='85' stroke='white' stroke-width='1.5' fill='none'/%3E%3Ccircle cx='250' cy='150' r='50' stroke='white' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right -40px center",
            backgroundSize: "420px",
          }}
        />

        <div className="relative z-10">
          <h1 className="text-2xl font-bold">Communication System</h1>
          <p className="mt-1 max-w-xl text-sm text-white/70">
            Organization-wide communication tools — announcements, bulk email, in-app notifications, and member feedback.
          </p>

          {/* Email addresses */}
          <div className="mt-5 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              <span className="text-white/60">General</span>
              <span className="font-mono font-semibold text-white">{INFO_EMAIL}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              <span className="text-white/60">Donations</span>
              <span className="font-mono font-semibold text-white">{DONATE_EMAIL}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cards ───────────────────────────────────────────────────── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((card) => {
          const c = COLOR[card.color];
          return (
            <div
              key={card.title}
              className={`flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md ${card.disabled ? "opacity-60" : ""}`}
            >
              {/* Icon row */}
              <div className="mb-4 flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.icon}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {card.iconPath.split(" M").map((d, i) => (
                      <path key={i} d={i === 0 ? d : "M" + d} />
                    ))}
                  </svg>
                </div>
                {card.adminOnly && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                    Admin only
                  </span>
                )}
              </div>

              <h2 className="mb-1.5 text-sm font-bold text-gray-900">{card.title}</h2>
              <p className="mb-5 flex-1 text-xs leading-relaxed text-gray-500">{card.description}</p>

              {card.disabled ? (
                <button disabled className={`w-full rounded-xl px-4 py-2.5 text-xs font-semibold ${c.btn}`}>
                  {card.label}
                </button>
              ) : (
                <Link
                  href={card.href}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition-colors ${c.btn}`}
                >
                  {card.label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
