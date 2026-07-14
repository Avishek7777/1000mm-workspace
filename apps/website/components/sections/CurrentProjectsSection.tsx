"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  MapPin,
  Calendar,
} from "lucide-react";

export type Project = {
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

const AUTOPLAY_MS = 5500;
const IMG_INTERVAL = 3000;

export default function CurrentProjectsSection({
  projects,
}: {
  projects: Project[];
}) {
  const [current, setCurrent] = useState(0);
  const [currentImg, setCurrentImg] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = projects.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = () => setCurrent((c) => (c - 1 + total) % total);

  useEffect(() => {
    if (paused || total <= 1) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, next, total]);

  const project = projects[current];
  const imgCount = project?.images?.length ?? 1;

  // Reset image index when project changes
  useEffect(() => { setCurrentImg(0); }, [current]);

  // Cycle through images within the current project
  useEffect(() => {
    if (paused || imgCount <= 1) return;
    const t = setInterval(() => setCurrentImg((i) => (i + 1) % imgCount), IMG_INTERVAL);
    return () => clearInterval(t);
  }, [paused, imgCount, current]);

  if (!project) return null;

  return (
    <section className="bg-white py-20 border-y border-amber-100">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10"
        >
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="h-px w-8 bg-orange-400" />
              <span
                className="text-orange-500 text-xs font-semibold tracking-[0.2em] uppercase"
              >
                Active Initiatives
              </span>
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold leading-tight"
              style={{ color: "#3b1f08" }}
            >
              Current{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                }}
              >
                Projects
              </span>
            </h2>
          </div>
          <Link
            href="/current-projects"
            className="inline-flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all duration-200 w-fit"
            style={{ color: "#c2410c" }}
          >
            View All Projects <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Slider */}
        <div
          className="relative rounded-3xl overflow-hidden shadow-xl border border-amber-100"
          style={{ aspectRatio: "21/9" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.65, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <AnimatePresence mode="sync">
                <motion.div
                  key={`${current}-${currentImg}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={project.images[currentImg] ?? project.images[0]}
                    alt={project.title}
                    fill
                    className="object-cover object-center"
                    priority={current === 0 && currentImg === 0}
                  />
                </motion.div>
              </AnimatePresence>
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to right, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.50) 45%, rgba(0,0,0,0.15) 100%)",
                }}
              />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-center px-10 md:px-16 max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.1 }}
                  className="flex flex-wrap items-center gap-2 mb-4"
                >
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{
                      background: "linear-gradient(90deg, #007f98, #f97316)",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {project.status}
                  </span>
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white/80 border border-white/20"
                    >
                      {tag}
                    </span>
                  ))}
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.18 }}
                  className="text-orange-300 text-xs font-semibold tracking-[0.2em] uppercase mb-2"
                >
                  {project.subtitle}
                </motion.p>

                <motion.h3
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="text-2xl md:text-4xl font-bold text-white leading-tight mb-3"
                >
                  {project.title}
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.33 }}
                  className="text-white/70 text-sm leading-relaxed mb-5 hidden md:block"
                >
                  {project.description}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.38 }}
                  className="flex flex-wrap gap-4 mb-6"
                >
                  <span
                    className="flex items-center gap-1.5 text-white/50 text-xs"
                  >
                    <MapPin className="w-3.5 h-3.5" /> {project.location}
                  </span>
                  <span
                    className="flex items-center gap-1.5 text-white/50 text-xs"
                  >
                    <Calendar className="w-3.5 h-3.5" /> {project.date}
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.44 }}
                  className="flex flex-wrap gap-3"
                >
                  <Link
                    href={`/current-projects/${project.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-white text-xs hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg"
                    style={{
                      background:
                        "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                    }}
                  >
                    Read Full Story <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/donate-now"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white text-xs border border-white/30 hover:bg-white/10 transition-all duration-300"
                  >
                    Donate Now
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Image dots — shown when current project has multiple images */}
          {imgCount > 1 && (
            <div className="absolute bottom-6 right-6 z-10 flex items-center gap-1.5">
              {project.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImg(i)}
                  aria-label={`Image ${i + 1}`}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === currentImg ? "18px" : "6px",
                    height: "6px",
                    background: i === currentImg ? "#f97316" : "rgba(255,255,255,0.4)",
                  }}
                />
              ))}
            </div>
          )}

          {/* Prev / Next */}
          {total > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all duration-200"
                style={{
                  background: "rgba(0,0,0,0.35)",
                  backdropFilter: "blur(6px)",
                }}
                aria-label="Previous project"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all duration-200"
                style={{
                  background: "rgba(0,0,0,0.35)",
                  backdropFilter: "blur(6px)",
                }}
                aria-label="Next project"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Progress bar */}
          {!paused && total > 1 && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-10">
              <motion.div
                key={`bar-${current}`}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                className="h-full"
                style={{
                  background: "linear-gradient(90deg, #007f98, #f97316)",
                }}
              />
            </div>
          )}
        </div>

        {/* Dots */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-2.5 mt-5">
            {projects.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrent(i);
                  setPaused(true);
                  setTimeout(() => setPaused(false), 8000);
                }}
                aria-label={`Go to project ${i + 1}`}
              >
                <span
                  className="block rounded-full transition-all duration-300"
                  style={{
                    width: i === current ? "24px" : "8px",
                    height: "8px",
                    background:
                      i === current
                        ? "linear-gradient(90deg, #007f98, #f97316)"
                        : "#fcd9a8",
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
