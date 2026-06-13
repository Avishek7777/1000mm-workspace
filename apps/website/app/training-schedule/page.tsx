// apps/website/app/training-schedule/page.tsx
// Server component — lists all published upcoming programs fetched from the portal API.

import Link from "next/link";
import { ArrowRight, MapPin, Calendar, Users, BookOpen } from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";

export const metadata = {
  title: "Training Schedule — 1000MM Bangladesh",
  description:
    "View upcoming missionary training programs offered by 1000 Missionary Movement Bangladesh.",
};

type Window = {
  state: string;
  applicationCloseDate: string;
};

type Program = {
  id: string;
  code: string;
  title: string;
  category: string;
  summary: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
  targetIntake: number;
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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function programStatus(start: string, end: string) {
  const now = new Date();
  if (new Date(end) < now) return "Completed";
  if (new Date(start) <= now) return "Active";
  return "Upcoming";
}

const STATUS_STYLE: Record<string, { bg: string; dot: string; text: string }> =
  {
    Active: {
      bg: "linear-gradient(90deg,#007f98,#16a34a)",
      dot: "#fff",
      text: "#fff",
    },
    Upcoming: {
      bg: "linear-gradient(90deg,#007f98,#f97316)",
      dot: "#fff",
      text: "#fff",
    },
    Completed: { bg: "#e5e7eb", dot: "#9ca3af", text: "#6b7280" },
  };

export default async function TrainingSchedulePage() {
  let programs: Program[] = [];

  try {
    const portalUrl =
      process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001";
    const res = await fetch(`${portalUrl}/api/public/programs`, {
      next: { revalidate: 300 },
    });
    if (res.ok) programs = await res.json();
  } catch {
    // degrade gracefully
  }

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
          TRAIN
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-28">
          {/* Header */}
          <div className="mb-14">
            <div className="mb-4 flex items-center gap-3">
              <span
                className="h-px w-12"
                style={{ background: "linear-gradient(90deg,#16a34a,#f97316)" }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Upcoming Programs
              </span>
            </div>
            <h1
              className="text-5xl font-bold leading-tight text-stone-800 md:text-6xl"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Training{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg,#007f98 0%,#f97316 100%)",
                }}
              >
                Schedule
              </span>
            </h1>
            <p
              className="mt-4 max-w-xl text-base leading-relaxed text-stone-500"
              style={{ fontFamily: "Georgia, serif" }}
            >
              All currently published training programs offered by 1000
              Missionary Movement Bangladesh. Click a program to see full
              details and apply.
            </p>
          </div>

          {/* Programs */}
          {programs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-amber-200 bg-white/60 py-20 text-center">
              <BookOpen className="mx-auto mb-4 h-10 w-10 text-stone-300" />
              <p
                className="text-base font-semibold text-stone-500"
                style={{ fontFamily: "Georgia, serif" }}
              >
                No programs currently scheduled.
              </p>
              <p
                className="mt-2 text-sm text-stone-400"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Check back soon — new batches are announced regularly.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {programs.map((program) => {
                const status = programStatus(
                  program.startDate,
                  program.endDate,
                );
                const statusStyle = STATUS_STYLE[status];
                const cat =
                  CATEGORY_COLORS[program.category] ??
                  CATEGORY_COLORS.SPIRITUAL;
                const enrolled = program.enrollments?.length ?? 0;
                const window = program.applicationWindows?.[0];
                const spotsLeft = program.targetIntake - enrolled;

                return (
                  <Link
                    key={program.id}
                    href={`/training-schedule/${program.id}`}
                    className="group block overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    {/* Top gradient bar */}
                    <div
                      className="h-1 w-full"
                      style={{
                        background: "linear-gradient(90deg,#007f98,#f97316)",
                      }}
                    />

                    <div className="p-7">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        {/* Left */}
                        <div className="min-w-0 flex-1">
                          {/* Badges row */}
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            {/* Status */}
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                              style={{
                                background: statusStyle.bg,
                                color: statusStyle.text,
                              }}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{
                                  background: statusStyle.dot,
                                  opacity: status === "Active" ? 1 : 0.7,
                                }}
                              />
                              {status}
                            </span>

                            {/* Category */}
                            <span
                              className="rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                              style={{
                                background: cat.bg,
                                color: cat.text,
                                borderColor: cat.border,
                              }}
                            >
                              {CATEGORY_LABELS[program.category] ??
                                program.category}
                            </span>

                            {/* Main program badge */}
                            {program.isMain && (
                              <span
                                className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                                style={{
                                  background:
                                    "linear-gradient(90deg,#007f98,#f97316)",
                                }}
                              >
                                Main Program
                              </span>
                            )}

                            {/* Open window badge */}
                            {window?.state === "OPEN" && (
                              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                                Applications Open
                              </span>
                            )}
                            {window?.state === "ADVERTISING" && (
                              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
                                Coming Soon
                              </span>
                            )}
                          </div>

                          {/* Code + title */}
                          <p
                            className="mb-1 text-xs font-mono text-stone-400"
                            style={{ fontFamily: "Georgia, serif" }}
                          >
                            {program.code}
                          </p>
                          <h2
                            className="text-xl font-bold leading-snug text-stone-800 transition-colors group-hover:text-teal-700"
                            style={{ fontFamily: "Georgia, serif" }}
                          >
                            {program.title}
                          </h2>

                          {/* Summary */}
                          {program.summary && (
                            <p
                              className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-500"
                              style={{ fontFamily: "Georgia, serif" }}
                            >
                              {program.summary}
                            </p>
                          )}

                          {/* Meta row */}
                          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                            <span
                              className="flex items-center gap-1.5 text-xs text-stone-400"
                              style={{ fontFamily: "Georgia, serif" }}
                            >
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(program.startDate)} —{" "}
                              {formatDate(program.endDate)}
                            </span>
                            {program.location && (
                              <span
                                className="flex items-center gap-1.5 text-xs text-stone-400"
                                style={{ fontFamily: "Georgia, serif" }}
                              >
                                <MapPin className="h-3.5 w-3.5" />
                                {program.location}
                              </span>
                            )}
                            <span
                              className="flex items-center gap-1.5 text-xs text-stone-400"
                              style={{ fontFamily: "Georgia, serif" }}
                            >
                              <Users className="h-3.5 w-3.5" />
                              {enrolled} enrolled ·{" "}
                              {spotsLeft > 0
                                ? `${spotsLeft} spots left`
                                : "Full"}
                            </span>
                          </div>

                          {/* Application deadline */}
                          {window?.state === "OPEN" && (
                            <p
                              className="mt-3 text-xs font-semibold text-orange-500"
                              style={{ fontFamily: "Georgia, serif" }}
                            >
                              Apply by {formatDate(window.applicationCloseDate)}
                            </p>
                          )}
                        </div>

                        {/* Arrow */}
                        <div className="mt-1 flex-shrink-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-100 bg-stone-50 transition-all duration-200 group-hover:border-teal-200 group-hover:bg-teal-50">
                            <ArrowRight className="h-4 w-4 text-stone-400 transition-colors group-hover:text-teal-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Apply CTA */}
          <div className="mt-14 rounded-3xl border border-amber-200 bg-white/70 px-8 py-8 text-center">
            <p
              className="mb-2 text-lg font-bold text-stone-800"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Ready to answer the call?
            </p>
            <p
              className="mb-6 text-sm text-stone-500"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Create your account on the portal to start your application.
            </p>
            <Link
              href={`${process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001"}/register`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:opacity-90 hover:scale-105"
              style={{
                background: "linear-gradient(90deg,#007f98 0%,#f97316 100%)",
                fontFamily: "Georgia, serif",
              }}
            >
              Start Your Application
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
