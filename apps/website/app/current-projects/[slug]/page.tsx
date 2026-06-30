import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin, Calendar, Users, Star, Target, CheckCircle, Banknote } from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";
import { PROJECTS as FALLBACK_PROJECTS } from "@/lib/projects";
import ProjectImageSlider from "../_components/ProjectImageSlider";

const SERIF = { fontFamily: "Georgia, serif" };

type Project = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  location: string;
  date: string;
  images: string[];
  tags: string[];
  status: string;
  goal?: string | null;
  participants?: number | null;
  highlight?: string | null;
  body?: string | null;
  budget?: string | null;
  objectives?: string[];
};

const STATUS_GRADIENT: Record<string, string> = {
  Active: "linear-gradient(90deg, #007f98, #f97316)",
  Upcoming: "linear-gradient(90deg, #7c3aed, #f97316)",
  Completed: "linear-gradient(90deg, #15803d, #007f98)",
};

async function fetchProject(slug: string): Promise<Project | null> {
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${portalUrl}/api/public/projects/${slug}`, {
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("fetch failed");
    return res.json();
  } catch {
    const fallback = FALLBACK_PROJECTS.find((p) => p.slug === slug);
    return fallback ? { ...fallback, id: fallback.slug, images: fallback.images } : null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await fetchProject(slug);
  if (!project) return { title: "Project Not Found" };
  return {
    title: `${project.title} — 1000MM Bangladesh`,
    description: project.description.slice(0, 160),
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await fetchProject(slug);
  if (!project) notFound();

  const gradient = STATUS_GRADIENT[project.status] ?? STATUS_GRADIENT.Active;

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-white">
        {/* ── Hero ──────────────────────────────────────── */}
        <div className="relative">
          <ProjectImageSlider images={project.images} title={project.title} />

          {/* Back link */}
          <Link
            href="/current-projects"
            className="absolute left-6 top-28 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
            style={SERIF}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Projects
          </Link>

          {/* Hero content */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 md:px-12 md:pb-12">
            <div className="mx-auto max-w-4xl">
              {/* Badges */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white"
                  style={{ background: gradient }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  {project.status}
                </span>
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs font-medium text-white/80"
                    style={SERIF}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300" style={SERIF}>
                {project.subtitle}
              </p>
              <h1 className="text-3xl font-bold leading-tight text-white md:text-5xl" style={SERIF}>
                {project.title}
              </h1>

              {/* Meta */}
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                <span className="flex items-center gap-1.5 text-xs text-white/60" style={SERIF}>
                  <MapPin className="h-3.5 w-3.5" /> {project.location}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-white/60" style={SERIF}>
                  <Calendar className="h-3.5 w-3.5" /> {project.date}
                </span>
                {project.participants != null && (
                  <span className="flex items-center gap-1.5 text-xs text-white/60" style={SERIF}>
                    <Users className="h-3.5 w-3.5" /> {project.participants.toLocaleString()} participants
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────── */}
        <div className="mx-auto max-w-4xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-3">

            {/* Left — main content */}
            <div className="md:col-span-2 space-y-10">

              {/* About */}
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-px w-8" style={{ background: "linear-gradient(90deg,#007f98,#f97316)" }} />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500" style={SERIF}>
                    About This Project
                  </span>
                </div>
                <p className="text-base leading-relaxed text-stone-600" style={SERIF}>
                  {project.description}
                </p>
              </section>

              {/* Full story / body — multi-paragraph */}
              {project.body && (
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="h-px w-8" style={{ background: "linear-gradient(90deg,#007f98,#f97316)" }} />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500" style={SERIF}>
                      The Full Story
                    </span>
                  </div>
                  <div className="space-y-4">
                    {project.body.split(/\n\n+/).map((para, i) => (
                      <p key={i} className="text-base leading-relaxed text-stone-600" style={SERIF}>
                        {para}
                      </p>
                    ))}
                  </div>
                </section>
              )}

              {/* Objectives */}
              {project.objectives && project.objectives.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="h-px w-8" style={{ background: "linear-gradient(90deg,#16a34a,#007f98)" }} />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600" style={SERIF}>
                      Key Objectives
                    </span>
                  </div>
                  <ul className="space-y-2.5">
                    {project.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                        <span className="text-sm leading-relaxed text-stone-600" style={SERIF}>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Highlight callout */}
              {project.highlight && (
                <section
                  className="rounded-2xl p-6"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,127,152,0.06) 0%, rgba(249,115,22,0.06) 100%)",
                    border: "1px solid rgba(0,127,152,0.12)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Star className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-orange-500" style={SERIF}>
                        Key Highlight
                      </p>
                      <p className="text-sm leading-relaxed text-stone-700" style={SERIF}>
                        {project.highlight}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* Goal */}
              {project.goal && (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-teal-600" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600" style={SERIF}>
                      Our Goal
                    </span>
                  </div>
                  <p className="text-base leading-relaxed text-stone-600" style={SERIF}>
                    {project.goal}
                  </p>
                </section>
              )}
            </div>

            {/* Right — sidebar */}
            <div className="space-y-5">

              {/* Project details card */}
              <div className="overflow-hidden rounded-2xl border border-stone-100 bg-stone-50 shadow-sm">
                <div className="h-0.5 w-full" style={{ background: gradient }} />
                <div className="divide-y divide-stone-100 px-5 py-4">
                  <div className="py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400" style={SERIF}>Status</p>
                    <p className="mt-0.5 text-sm font-semibold text-stone-700" style={SERIF}>{project.status}</p>
                  </div>
                  <div className="py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400" style={SERIF}>Location</p>
                    <p className="mt-0.5 text-sm text-stone-700" style={SERIF}>{project.location}</p>
                  </div>
                  <div className="py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400" style={SERIF}>Period</p>
                    <p className="mt-0.5 text-sm text-stone-700" style={SERIF}>{project.date}</p>
                  </div>
                  {project.participants != null && (
                    <div className="py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400" style={SERIF}>Participants</p>
                      <p className="mt-0.5 text-sm font-semibold text-teal-700" style={SERIF}>
                        {project.participants.toLocaleString()}
                      </p>
                    </div>
                  )}
                  <div className="py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-2" style={SERIF}>Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ background: "rgba(0,127,152,0.08)", color: "#007f98" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget card */}
              {project.budget && (
                <div className="overflow-hidden rounded-2xl border border-teal-100 bg-teal-50 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote className="h-4 w-4 text-teal-600" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-teal-700" style={SERIF}>
                      Project Budget
                    </p>
                  </div>
                  <p className="text-sm font-bold text-teal-800" style={SERIF}>{project.budget}</p>
                </div>
              )}

              {/* Donate CTA */}
              <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
                <p className="mb-1 text-sm font-bold text-stone-800" style={SERIF}>Support This Project</p>
                <p className="mb-4 text-xs text-stone-500 leading-relaxed" style={SERIF}>
                  Your gift helps fund this mission directly.
                </p>
                <Link
                  href="/donate-now"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:opacity-90 hover:scale-105"
                  style={{ background: "linear-gradient(90deg,#007f98,#f97316)", ...SERIF }}
                >
                  Donate Now <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* ── Bottom nav ──────────────────────────────── */}
          <div className="mt-16 flex items-center justify-between border-t border-stone-100 pt-8">
            <Link
              href="/current-projects"
              className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition-colors hover:text-teal-700"
              style={SERIF}
            >
              <ArrowLeft className="h-4 w-4" /> Back to All Projects
            </Link>
            <Link
              href="/donate-now"
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:opacity-90"
              style={{ background: "linear-gradient(90deg,#007f98,#f97316)", ...SERIF }}
            >
              Donate Now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
