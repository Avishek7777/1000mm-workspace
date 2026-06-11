// apps/website/app/training-schedule/[id]/page.tsx
// Server component — individual training program detail page.

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  BookOpen,
  Target,
  Info,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";

type Window = {
  id: string;
  state: string;
  advertisingStartDate: string;
  applicationOpenDate: string;
  applicationCloseDate: string;
  trainingStartDate: string;
  targetIntake: number;
};

type Program = {
  id: string;
  code: string;
  title: string;
  titleBangla: string | null;
  category: string;
  summary: string | null;
  summaryBangla: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
  locationBangla: string | null;
  targetIntake: number;
  maxIntake: number | null;
  isMain: boolean;
  enrollments: { id: string }[];
  applicationWindows: Window[];
};

const CATEGORY_LABELS: Record<string, string> = {
  SPIRITUAL: "Spiritual",
  PHYSICAL: "Physical",
  MENTAL: "Mental",
  SOCIAL: "Social",
};

const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  SPIRITUAL: { bg: "#f0fafa", text: "#007f98", border: "#b2e0e8" },
  PHYSICAL: { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
  MENTAL: { bg: "#fdf4ff", text: "#9333ea", border: "#e9d5ff" },
  SOCIAL: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
};

function formatDate(d: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(d).toLocaleDateString(
    "en-GB",
    opts ?? {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
}

function durationDays(start: string, end: string) {
  return Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

function programStatus(start: string, end: string) {
  const now = new Date();
  if (new Date(end) < now) return "Completed";
  if (new Date(start) <= now) return "Active";
  return "Upcoming";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const portalUrl =
    process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${portalUrl}/api/public/programs/${id}`, {
      next: { revalidate: 120 },
    });
    if (res.ok) {
      const p: Program = await res.json();
      return { title: `${p.title} — 1000MM Bangladesh` };
    }
  } catch {}
  return { title: "Training Program — 1000MM Bangladesh" };
}

export default async function TrainingScheduleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const portalUrl =
    process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001";

  let program: Program | null = null;
  try {
    const res = await fetch(`${portalUrl}/api/public/programs/${id}`, {
      next: { revalidate: 120 },
    });
    if (res.ok) program = await res.json();
  } catch {}

  if (!program) notFound();

  const status = programStatus(program.startDate, program.endDate);
  const cat = CATEGORY_COLORS[program.category] ?? CATEGORY_COLORS.SPIRITUAL;
  const enrolled = program.enrollments?.length ?? 0;
  const capacity = program.maxIntake ?? program.targetIntake;
  const spotsLeft = capacity - enrolled;
  const fillPct = Math.min(100, Math.round((enrolled / capacity) * 100));
  const days = durationDays(program.startDate, program.endDate);
  const openWindow = program.applicationWindows?.[0];

  const warmBg = "linear-gradient(160deg, #fafaf9 0%, #fff7ed 100%)";

  return (
    <>
      <NavBar />

      <main
        style={{ background: warmBg }}
        className="relative min-h-screen overflow-hidden"
      >
        {/* Watermark */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-2rem] top-[6%] select-none text-[16vw] font-bold leading-none opacity-[0.035]"
          style={{ fontFamily: "Georgia, serif", color: "#f97316" }}
        >
          PROG
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-28">
          {/* Back */}
          <Link
            href="/training-schedule"
            className="mb-10 inline-flex items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-stone-700"
            style={{ fontFamily: "Georgia, serif" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Programs
          </Link>

          {/* Badges */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {/* Status */}
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{
                background:
                  status === "Active"
                    ? "linear-gradient(90deg,#007f98,#16a34a)"
                    : status === "Upcoming"
                      ? "linear-gradient(90deg,#007f98,#f97316)"
                      : "#9ca3af",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
              {status}
            </span>

            {/* Category */}
            <span
              className="rounded-full border px-3 py-0.5 text-xs font-semibold"
              style={{
                background: cat.bg,
                color: cat.text,
                borderColor: cat.border,
              }}
            >
              {CATEGORY_LABELS[program.category] ?? program.category}
            </span>

            {program.isMain && (
              <span
                className="rounded-full px-3 py-0.5 text-xs font-semibold text-white"
                style={{ background: "linear-gradient(90deg,#007f98,#f97316)" }}
              >
                Main Program
              </span>
            )}

            {openWindow?.state === "OPEN" && (
              <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-700">
                Applications Open
              </span>
            )}
          </div>

          {/* Title */}
          <p className="mb-1 font-mono text-xs text-stone-400">
            {program.code}
          </p>
          <h1
            className="mb-2 text-4xl font-bold leading-tight text-stone-800 md:text-5xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {program.title}
          </h1>
          {program.titleBangla && (
            <p
              className="mb-6 text-xl text-stone-500"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {program.titleBangla}
            </p>
          )}

          {/* Summary */}
          {program.summary && (
            <p
              className="mb-10 text-base leading-relaxed text-stone-600"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {program.summary}
            </p>
          )}

          {/* Quick-stat cards */}
          <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                icon: Calendar,
                label: "Start Date",
                value: formatDate(program.startDate, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
              },
              {
                icon: Calendar,
                label: "End Date",
                value: formatDate(program.endDate, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
              },
              { icon: Clock, label: "Duration", value: `${days} days` },
              {
                icon: Users,
                label: "Spots Left",
                value: spotsLeft > 0 ? `${spotsLeft} / ${capacity}` : "Full",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-stone-100 bg-white px-4 py-4 shadow-sm"
              >
                <div
                  className="mb-2 flex items-center gap-1.5 text-xs text-stone-400"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  <s.icon className="h-3.5 w-3.5" />
                  {s.label}
                </div>
                <p
                  className="text-sm font-bold text-stone-800"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Enrollment progress */}
          <div className="mb-10 rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span
                className="text-sm font-semibold text-stone-700"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Enrollment
              </span>
              <span
                className="text-xs text-stone-400"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {enrolled} of {capacity} spots filled
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${fillPct}%`,
                  background:
                    fillPct >= 90
                      ? "linear-gradient(90deg,#ea580c,#f97316)"
                      : "linear-gradient(90deg,#007f98,#16a34a)",
                }}
              />
            </div>
            {spotsLeft <= 10 && spotsLeft > 0 && (
              <p
                className="mt-2 text-xs font-semibold text-orange-500"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Only {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} remaining!
              </p>
            )}
          </div>

          {/* Details section */}
          <div className="mb-10 space-y-4">
            {/* Location */}
            {program.location && (
              <DetailRow icon={MapPin} label="Location">
                <span>{program.location}</span>
                {program.locationBangla && (
                  <span className="ml-2 text-stone-400">
                    ({program.locationBangla})
                  </span>
                )}
              </DetailRow>
            )}

            {/* Dates */}
            <DetailRow icon={Calendar} label="Training Period">
              {formatDate(program.startDate)} — {formatDate(program.endDate)}
            </DetailRow>

            {/* Intake */}
            <DetailRow icon={Target} label="Target Intake">
              {program.targetIntake} trainees
              {program.maxIntake &&
                program.maxIntake !== program.targetIntake && (
                  <span className="ml-1 text-stone-400">
                    (max {program.maxIntake})
                  </span>
                )}
            </DetailRow>
          </div>

          {/* Application window */}
          {openWindow && (
            <div
              className="mb-10 overflow-hidden rounded-3xl border"
              style={{
                borderColor:
                  openWindow.state === "OPEN" ? "#bbf7d0" : "#bfdbfe",
              }}
            >
              <div
                className="h-1"
                style={{
                  background:
                    openWindow.state === "OPEN"
                      ? "linear-gradient(90deg,#16a34a,#007f98)"
                      : "linear-gradient(90deg,#3b82f6,#007f98)",
                }}
              />
              <div className="bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Info className="h-4 w-4 text-teal-600" />
                  <h2
                    className="text-sm font-bold text-stone-800"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {openWindow.state === "OPEN"
                      ? "Applications Are Open"
                      : "Applications Opening Soon"}
                  </h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: "Applications Open",
                      date: openWindow.applicationOpenDate,
                    },
                    {
                      label: "Applications Close",
                      date: openWindow.applicationCloseDate,
                    },
                    {
                      label: "Training Starts",
                      date: openWindow.trainingStartDate,
                    },
                    {
                      label: "Window Intake",
                      date: null,
                      text: `${openWindow.targetIntake} trainees`,
                    },
                  ].map((row) => (
                    <div key={row.label}>
                      <p
                        className="text-xs font-semibold uppercase tracking-wider text-stone-400"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {row.label}
                      </p>
                      <p
                        className="mt-0.5 text-sm font-semibold text-stone-700"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {row.text ?? formatDate(row.date!)}
                      </p>
                    </div>
                  ))}
                </div>

                {openWindow.state === "OPEN" && (
                  <Link
                    href={`${process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001"}/register`}
                    target="_blank"
                    className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:opacity-90 hover:scale-105"
                    style={{
                      background: "linear-gradient(90deg,#007f98,#f97316)",
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    Apply Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* No open window but upcoming */}
          {!openWindow && status !== "Completed" && (
            <div className="mb-10 rounded-3xl border border-amber-200 bg-amber-50/60 p-6">
              <p
                className="text-sm leading-relaxed text-amber-800"
                style={{ fontFamily: "Georgia, serif" }}
              >
                <span className="font-semibold">
                  Applications are not yet open
                </span>{" "}
                for this program. Create an account on the portal to be notified
                when the application window opens.
              </p>
              <Link
                href={`${process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001"}/register`}
                target="_blank"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 underline underline-offset-2 hover:text-orange-700"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Create an account <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* Requirements reminder */}
          <div className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <h2
                className="text-sm font-bold text-stone-800"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Before You Apply
              </h2>
            </div>
            <p
              className="mb-4 text-sm leading-relaxed text-stone-500"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Make sure you have all required documents ready — including your
              Letter of Intent, Parent's Consent, and Sworn Statement.
            </p>
            <Link
              href="/documents"
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: "#007f98", fontFamily: "Georgia, serif" }}
            >
              Download required documents
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-stone-100 bg-white px-5 py-4 shadow-sm">
      <div
        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: "rgba(0,127,152,0.08)" }}
      >
        <Icon className="h-4 w-4" style={{ color: "#007f98" }} />
      </div>
      <div>
        <p
          className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-stone-400"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {label}
        </p>
        <p
          className="text-sm font-medium text-stone-700"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {children}
        </p>
      </div>
    </div>
  );
}
