"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  MapPin,
  Calendar,
  Users,
  Target,
  Banknote,
  Star,
} from "lucide-react";
import type { Project } from "@/components/sections/CurrentProjectsSection";
import { ShareButtons } from "@/components/ShareButtons";

const STATUSES = ["All", "Active", "Upcoming", "Completed"] as const;

// How many editorial rows are shown initially / added per "More projects" click.
const PAGE_SIZE = 4;

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-teal-700",
  Upcoming: "bg-violet-600",
  Completed: "bg-stone-500",
};

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-teal-700">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-stone-700">{value}</p>
      </div>
    </div>
  );
}

export default function ProjectsEditorial({ projects }: { projects: Project[] }) {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");
  const [tag, setTag] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const allTags = useMemo(
    () => [...new Set(projects.flatMap((p) => p.tags))].sort(),
    [projects],
  );

  const matching = projects.filter(
    (p) =>
      (status === "All" || p.status === status) &&
      (!tag || p.tags.includes(tag)),
  );
  const visible = matching.slice(0, limit);
  const hiddenCount = matching.length - visible.length;

  const pickStatus = (s: (typeof STATUSES)[number]) => {
    setStatus(s);
    setLimit(PAGE_SIZE);
  };
  const pickTag = (t: string | null) => {
    setTag(t);
    setLimit(PAGE_SIZE);
  };

  return (
    <div>
      {/* ── Filters ── */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="flex flex-wrap justify-center gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => pickStatus(s)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                status === s
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => pickTag(tag === t ? null : t)}
                className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                  tag === t
                    ? "border-orange-400 bg-orange-50 text-orange-700"
                    : "border-stone-100 bg-stone-50 text-stone-400 hover:text-stone-600"
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Editorial rows ── */}
      {matching.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-stone-200 py-20 text-center">
          <p className="text-sm text-stone-400">
            No projects match this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-16 md:space-y-20">
          {visible.map((project, i) => {
            const reversed = i % 2 === 1;
            return (
              <motion.article
                key={project.slug}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className={`flex flex-col gap-8 md:items-center ${
                  reversed ? "md:flex-row-reverse" : "md:flex-row"
                }`}
              >
                {/* Photo */}
                <Link
                  href={`/current-projects/${project.slug}`}
                  className="group relative block aspect-[4/3] w-full shrink-0 overflow-hidden rounded-3xl shadow-md md:w-[46%]"
                >
                  <Image
                    src={project.images[0]}
                    alt={project.title}
                    fill
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    sizes="(min-width: 768px) 46vw, 100vw"
                  />
                  <span
                    className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white ${STATUS_STYLES[project.status] ?? "bg-teal-700"}`}
                  >
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    {project.status}
                  </span>
                  {project.images.length > 1 && (
                    <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                      {project.images.length} photos
                    </span>
                  )}
                </Link>

                {/* Story */}
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
                      {project.subtitle}
                    </p>
                  </div>
                  <h2 className="font-heading text-2xl font-bold leading-snug text-stone-800 md:text-3xl">
                    <Link
                      href={`/current-projects/${project.slug}`}
                      className="transition-colors hover:text-teal-800"
                    >
                      {project.title}
                    </Link>
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-stone-500 md:text-base line-clamp-3">
                    {project.description}
                  </p>

                  {/* Impact stat chips */}
                  <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                    <StatChip
                      icon={<MapPin className="h-3.5 w-3.5" />}
                      label="Location"
                      value={project.location}
                    />
                    <StatChip
                      icon={<Calendar className="h-3.5 w-3.5" />}
                      label="Period"
                      value={project.date}
                    />
                    {project.participants != null && (
                      <StatChip
                        icon={<Users className="h-3.5 w-3.5" />}
                        label="Participants"
                        value={project.participants.toLocaleString()}
                      />
                    )}
                    {(project.budget || project.goal) && (
                      <StatChip
                        icon={
                          project.budget ? (
                            <Banknote className="h-3.5 w-3.5" />
                          ) : (
                            <Target className="h-3.5 w-3.5" />
                          )
                        }
                        label={project.budget ? "Budget" : "Goal"}
                        value={(project.budget ?? project.goal)!}
                      />
                    )}
                  </div>

                  {/* Highlight */}
                  {project.highlight && (
                    <p className="mt-4 flex items-start gap-2 rounded-xl bg-orange-50 px-4 py-2.5 text-xs leading-relaxed text-orange-800">
                      <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
                      {project.highlight}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/current-projects/${project.slug}`}
                      className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-teal-800"
                    >
                      Read Full Story <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href="/donate-now"
                      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90"
                      style={{
                        background:
                          "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                      }}
                    >
                      Donate
                    </Link>
                    <ShareButtons
                      path={`/current-projects/${project.slug}`}
                      title={project.title}
                      size="sm"
                    />
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* ── More projects ── */}
      {hiddenCount > 0 && (
        <div className="mt-14 text-center">
          <button
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
            className="inline-flex items-center gap-2 rounded-full border-2 border-teal-700 px-7 py-3 text-sm font-bold text-teal-700 transition-colors hover:bg-teal-700 hover:text-white"
          >
            More Projects
            <span className="rounded-full bg-teal-700/10 px-2 py-0.5 text-xs font-semibold">
              {hiddenCount}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
