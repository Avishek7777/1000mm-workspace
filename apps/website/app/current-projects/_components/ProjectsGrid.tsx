// apps/website/app/current-projects/_components/ProjectsGrid.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Calendar } from "lucide-react";
import type { Project } from "@/lib/projects";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: "easeOut" as const },
  }),
};

const STATUS_COLORS: Record<string, string> = {
  Active: "linear-gradient(90deg, #007f98, #f97316)",
  Upcoming: "linear-gradient(90deg, #7c3aed, #f97316)",
  Completed: "linear-gradient(90deg, #15803d, #007f98)",
};

export default function ProjectsGrid({ projects }: { projects: Project[] }) {
  // Pad to even number so grid looks clean — show "coming soon" only when odd count
  const showPlaceholder = projects.length % 2 !== 0;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {projects.map((project, i) => (
        <motion.div
          key={project.slug}
          custom={i}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <Link
            href={`/current-projects/${project.slug}`}
            className="group block rounded-3xl border border-amber-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
          >
            {/* Image */}
            <div className="relative h-56 overflow-hidden">
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)",
                }}
              />
              {/* Status badge */}
              <div className="absolute top-4 left-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{
                    background:
                      STATUS_COLORS[project.status] ?? STATUS_COLORS.Active,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {project.status}
                </span>
              </div>
            </div>

            {/* Card body */}
            <div className="p-7" style={{ background: "#fffdf8" }}>
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: "rgba(0,127,152,0.08)",
                      color: "#007f98",
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p
                className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-1"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {project.subtitle}
              </p>
              <h2
                className="text-xl font-bold mb-3 leading-snug group-hover:text-transparent group-hover:bg-clip-text transition-all duration-300"
                style={{
                  fontFamily: "Georgia, serif",
                  color: "#3b1f08",
                  backgroundImage: "linear-gradient(90deg, #007f98, #f97316)",
                }}
              >
                {project.title}
              </h2>
              <p
                className="text-sm leading-relaxed mb-5"
                style={{ fontFamily: "Georgia, serif", color: "#78350f" }}
              >
                {project.description}
              </p>

              {/* Meta */}
              <div className="flex flex-col gap-1.5 mb-5">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span style={{ fontFamily: "Georgia, serif" }}>
                    {project.location}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span style={{ fontFamily: "Georgia, serif" }}>
                    {project.date}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div
                className="inline-flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all duration-200"
                style={{ color: "#c2410c", fontFamily: "Georgia, serif" }}
              >
                Read More & Support
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </motion.div>
      ))}

      {/* Coming soon — only shown when odd number of projects */}
      {showPlaceholder && (
        <motion.div
          custom={projects.length}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="rounded-3xl border-2 border-dashed border-amber-200 flex flex-col items-center justify-center p-12 text-center"
          style={{ background: "#fffdf8" }}
        >
          <div className="text-4xl mb-4">🔜</div>
          <p
            className="font-bold text-lg mb-2"
            style={{ fontFamily: "Georgia, serif", color: "#b45309" }}
          >
            More Projects Coming
          </p>
          <p
            className="text-sm text-amber-700/60"
            style={{ fontFamily: "Georgia, serif" }}
          >
            New initiatives will be listed here as they are launched.
          </p>
        </motion.div>
      )}
    </div>
  );
}
