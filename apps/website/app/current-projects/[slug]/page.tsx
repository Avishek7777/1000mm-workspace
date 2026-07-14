import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin, Calendar, Users, Star, Target, CheckCircle, Banknote } from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";
import { PROJECTS as FALLBACK_PROJECTS } from "@/lib/projects";
import { resolveProjectImages } from "@/lib/portal";
import ProjectImageSlider from "../_components/ProjectImageSlider";
import { ShareButtons } from "@/components/ShareButtons";

const SERIF = {}; // typography now inherits the site fonts (Fraunces headings, Noto Sans body)

// ── Lightweight markdown for the story body ─────────────────────────────────
// SA writes the body as plain text; support just what the office needs:
//   "## Heading"          → section heading
//   "* item" lines        → bulleted list
//   "**bold**"            → bold inline
//   blank line            → paragraph break

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-stone-800">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function StoryTable({ block }: { block: string }) {
  const rows = block
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"))
    .map((l) =>
      l
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim()),
    )
    // drop the |---|---| separator row
    .filter((cells) => !cells.every((c) => /^:?-{2,}:?$/.test(c)));

  if (rows.length === 0) return null;
  const [head, ...body] = rows;

  return (
    <div className="overflow-x-auto rounded-2xl border border-teal-100 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "linear-gradient(90deg,#007f98,#0a95ae)" }}>
            {head.map((c, i) => (
              <th
                key={i}
                className={`px-5 py-3 text-xs font-bold uppercase tracking-wider text-white ${i === 0 ? "text-left" : "text-right"}`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((cells, r) => {
            const isTotal = cells.some((c) => c.startsWith("**"));
            return (
              <tr
                key={r}
                className={
                  isTotal
                    ? "bg-orange-50 font-bold text-stone-900"
                    : r % 2 === 0
                      ? "bg-white text-stone-600"
                      : "bg-stone-50/60 text-stone-600"
                }
              >
                {cells.map((c, i) => (
                  <td
                    key={i}
                    className={`px-5 py-3 ${i === 0 ? "text-left" : "text-right tabular-nums"} ${isTotal && i > 0 ? "text-orange-700" : ""}`}
                  >
                    {renderInline(c)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StoryBody({ body }: { body: string }) {
  // Normalize Windows line endings so block/line splitting is reliable
  // regardless of how the text was pasted into the admin form.
  const blocks = body
    .replace(/\r\n/g, "\n")
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean);
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        // ### sub-heading
        if (block.startsWith("### ")) {
          return (
            <h3
              key={i}
              className="font-heading pt-2 text-lg font-bold leading-snug text-teal-800"
            >
              {block.replace(/^### /, "")}
            </h3>
          );
        }
        // ## / # section heading with gradient mark
        if (block.startsWith("## ") || block.startsWith("# ")) {
          const large = block.startsWith("# ");
          return (
            <div key={i} className="flex items-start gap-3 pt-4">
              <span
                className="mt-1.5 h-6 w-1 shrink-0 rounded-full"
                style={{ background: "linear-gradient(180deg,#007f98,#f97316)" }}
                aria-hidden="true"
              />
              <h2
                className={`font-heading font-bold leading-snug text-stone-800 ${large ? "text-2xl" : "text-xl"}`}
              >
                {block.replace(/^#+ /, "")}
              </h2>
            </div>
          );
        }
        // > blockquote — scripture / pull-quote treatment
        if (block.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="rounded-r-2xl border-l-4 py-4 pl-6 pr-4"
              style={{
                borderImage: "linear-gradient(180deg,#007f98,#f97316) 1",
                background:
                  "linear-gradient(135deg, rgba(0,127,152,0.05) 0%, rgba(249,115,22,0.06) 100%)",
              }}
            >
              <p className="font-heading text-lg font-semibold italic leading-relaxed text-stone-800">
                {renderInline(
                  block
                    .split("\n")
                    .map((l) => l.replace(/^>\s?/, ""))
                    .join(" "),
                )}
              </p>
            </blockquote>
          );
        }
        // | table |
        if (block.startsWith("|")) {
          return <StoryTable key={i} block={block} />;
        }
        const lines = block.split("\n");
        if (lines.every((l) => l.trim().startsWith("* "))) {
          const items = lines.map((l) => l.trim().replace(/^\* /, ""));

          // Donation tiers — every item leads with a bold money amount
          // ("**$250** sponsors one kit.") → render as giving-tier cards.
          const tierRe = /^\*\*([$৳][\d,.]+)\*\*\s*(.*)$/;
          if (items.every((t) => tierRe.test(t))) {
            return (
              <div key={i} className="grid gap-3 sm:grid-cols-2">
                {items.map((t, j) => {
                  const [, amount, rest] = t.match(tierRe)!;
                  return (
                    <div
                      key={j}
                      className="group rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/60 to-white p-5 transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
                    >
                      <p className="font-heading text-2xl font-bold text-teal-800 transition-colors group-hover:text-orange-600">
                        {amount}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-stone-600">
                        {renderInline(rest)}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          }

          return (
            <ul key={i} className="space-y-2 pl-1">
              {items.map((t, j) => (
                <li key={j} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                  <span className="text-base leading-relaxed text-stone-600">
                    {renderInline(t)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-base leading-relaxed text-stone-600">
            {renderInline(block)}
          </p>
        );
      })}
    </div>
  );
}

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
    const project: Project = await res.json();
    return resolveProjectImages(project);
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

  // The cover (images[0]) belongs to the listing/cards; the detail hero
  // slides through the gallery shots so the two surfaces don't repeat.
  const galleryImages =
    project.images.length > 1 ? project.images.slice(1) : project.images;

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-white">
        {/* ── Hero ──────────────────────────────────────── */}
        <div className="relative">
          <ProjectImageSlider images={galleryImages} title={project.title} />

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

        {/* ── Impact band ───────────────────────────────── */}
        {(project.participants != null || project.goal || project.budget) && (
          <div className="border-b border-stone-100 bg-stone-50">
            <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-stone-100 px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {project.participants != null && (
                <div className="px-4 py-5 text-center">
                  <p className="font-heading text-2xl font-bold text-teal-800">
                    {project.participants.toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                    Participants
                  </p>
                </div>
              )}
              {project.goal && (
                <div className="px-4 py-5 text-center">
                  <p className="font-heading text-sm font-bold leading-snug text-stone-700">
                    {project.goal}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                    Goal
                  </p>
                </div>
              )}
              {project.budget && (
                <div className="px-4 py-5 text-center">
                  <p className="font-heading text-sm font-bold leading-snug text-teal-800">
                    {project.budget}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                    Budget
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Body ──────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid items-start gap-10 md:grid-cols-3">

            {/* Left — main content */}
            <div className="md:col-span-2 space-y-12">

              {/* About — editorial lede with drop cap */}
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-px w-8" style={{ background: "linear-gradient(90deg,#007f98,#f97316)" }} />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
                    About This Project
                  </span>
                </div>
                <p className="text-lg leading-8 text-stone-600 first-letter:float-left first-letter:mr-2.5 first-letter:font-heading first-letter:text-6xl first-letter:font-bold first-letter:leading-[0.85] first-letter:text-teal-800">
                  {project.description}
                </p>
              </section>

              {/* Full story / body — multi-paragraph */}
              {project.body && (
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="h-px w-8" style={{ background: "linear-gradient(90deg,#007f98,#f97316)" }} />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
                      The Full Story
                    </span>
                  </div>
                  <StoryBody body={project.body} />
                </section>
              )}

              {/* Objectives — card grid */}
              {project.objectives && project.objectives.length > 0 && (
                <section>
                  <div className="mb-5 flex items-center gap-2">
                    <span className="h-px w-8" style={{ background: "linear-gradient(90deg,#007f98,#f97316)" }} />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
                      Key Objectives
                    </span>
                  </div>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {project.objectives.map((obj, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 rounded-2xl border border-stone-100 bg-stone-50/60 p-4 transition-colors hover:border-teal-200 hover:bg-teal-50/40"
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700/10">
                          <CheckCircle className="h-3.5 w-3.5 text-teal-700" />
                        </span>
                        <span className="text-sm leading-relaxed text-stone-600">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Highlight — pull-quote treatment */}
              {project.highlight && (
                <section className="relative overflow-hidden rounded-2xl border-l-4 border-orange-400 bg-gradient-to-br from-orange-50/80 to-teal-50/40 py-6 pl-6 pr-8">
                  <Star
                    className="absolute -right-3 -top-3 h-16 w-16 text-orange-100"
                    aria-hidden="true"
                  />
                  <div className="relative">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-orange-500">
                      Key Highlight
                    </p>
                    <p className="font-heading text-lg font-semibold italic leading-relaxed text-stone-800">
                      {project.highlight}
                    </p>
                  </div>
                </section>
              )}

              {/* Goal — mission statement card */}
              {project.goal && (
                <section className="rounded-2xl border border-teal-100 bg-teal-50/50 p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-700 text-white">
                      <Target className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                      Our Goal
                    </span>
                  </div>
                  <p className="font-heading text-lg font-semibold leading-relaxed text-teal-900">
                    {project.goal}
                  </p>
                </section>
              )}
            </div>

            {/* Right — sidebar (follows the reader) */}
            <div className="space-y-5 md:sticky md:top-24">

              {/* Project details card */}
              <div className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
                <div className="h-1 w-full" style={{ background: gradient }} />
                <div className="divide-y divide-stone-100 px-5 py-2">
                  {[
                    { icon: <Star className="h-3.5 w-3.5" />, label: "Status", value: project.status, strong: true },
                    { icon: <MapPin className="h-3.5 w-3.5" />, label: "Location", value: project.location },
                    { icon: <Calendar className="h-3.5 w-3.5" />, label: "Period", value: project.date },
                    ...(project.participants != null
                      ? [{ icon: <Users className="h-3.5 w-3.5" />, label: "Participants", value: project.participants.toLocaleString(), strong: true }]
                      : []),
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-3 py-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-700/10 text-teal-700">
                        {row.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">{row.label}</p>
                        <p className={`mt-0.5 truncate text-sm text-stone-700 ${row.strong ? "font-semibold" : ""}`}>
                          {row.value}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-2">Tags</p>
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
                <div className="overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Banknote className="h-4 w-4 text-teal-600" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
                      Project Budget
                    </p>
                  </div>
                  <p className="font-heading text-base font-bold text-teal-800">{project.budget}</p>
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
                <div className="mt-4 flex flex-col items-center gap-1.5 border-t border-amber-100 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                    Share this project
                  </p>
                  <ShareButtons
                    path={`/current-projects/${project.slug}`}
                    title={project.title}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Contact for support ─────────────────────── */}
          <div
            className="mt-16 rounded-2xl px-6 py-8 text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,127,152,0.05) 0%, rgba(249,115,22,0.06) 100%)",
              border: "1px solid rgba(0,127,152,0.12)",
            }}
          >
            <p className="font-heading text-lg font-bold text-stone-800">
              Want to support this project?
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-stone-500">
              For more information on how to support the 1000 Missionary
              Movement, contact us:
            </p>
            <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-6">
              <a
                href="tel:+8801324333377"
                className="text-sm font-semibold text-teal-700 hover:underline"
              >
                +880 1324-333377
              </a>
              <span className="hidden text-stone-300 sm:inline">·</span>
              <a
                href="mailto:info@1000mm.org.bd"
                className="text-sm font-semibold text-teal-700 hover:underline"
              >
                info@1000mm.org.bd
              </a>
            </div>
          </div>

          {/* ── Bottom nav ──────────────────────────────── */}
          <div className="mt-10 flex items-center justify-between border-t border-stone-100 pt-8">
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
