"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Calendar } from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";

const warmBg = {
  background: "linear-gradient(160deg, #fdf6ec 0%, #fef3e2 50%, #fdf0d5 100%)",
};

const projects = [
  {
    slug: "training-center",
    status: "Active",
    title: "1000MM Bangladesh Training Center",
    subtitle: "A Legacy in the Making",
    description:
      "Groundbreaking held on December 10, 2025 at BASC Campus. Help complete a fully functioning missionary training center that will prepare generations of gospel workers for Bangladesh and beyond.",
    location: "BASC Campus, Bangladesh",
    date: "Dec 10, 2025 — Ongoing",
    image: "/images/projects/training-center.jpg", // replace with real image
    tags: ["Construction", "Training", "Mission"],
  },
  // Add more projects here as they come
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: "easeOut" },
  }),
};

export default function CurrentProjectsPage() {
  return (
    <>
      <NavBar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 overflow-hidden" style={warmBg}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 65% 55% at 50% 0%, rgba(251,191,36,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0v60M0 30h60' stroke='%23a16207' stroke-width='0.5'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 mb-5"
          >
            <span className="h-px w-10 bg-orange-400" />
            <span
              className="text-orange-500 text-sm font-semibold tracking-[0.2em] uppercase"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Active Initiatives
            </span>
            <span className="h-px w-10 bg-orange-400" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-4xl md:text-6xl font-bold leading-tight mb-5"
            style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
          >
            Current
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
              }}
            >
              Projects
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-base md:text-lg leading-relaxed"
            style={{ fontFamily: "Georgia, serif", color: "#92400e" }}
          >
            These are the active projects your donations are building right now.
            Every gift moves the mission forward.
          </motion.p>
        </div>
      </section>

      {/* ── Project cards — white ────────────────────────────────────────── */}
      <section className="bg-white py-20 border-y border-amber-100">
        <div className="max-w-5xl mx-auto px-6">
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
                    {/* Gradient overlay */}
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
                            "linear-gradient(90deg, #007f98, #f97316)",
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
                        backgroundImage:
                          "linear-gradient(90deg, #007f98, #f97316)",
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

            {/* Coming soon placeholder — remove when 2nd project is added */}
            {projects.length < 2 && (
              <motion.div
                custom={1}
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
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="py-16" style={warmBg}>
        <div className="max-w-2xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p
              className="text-base leading-relaxed mb-6"
              style={{ fontFamily: "Georgia, serif", color: "#92400e" }}
            >
              Want to support one of these projects directly?
            </p>
            <Link
              href="/donate-now"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white text-sm hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg"
              style={{
                background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                fontFamily: "Georgia, serif",
              }}
            >
              Donate Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}
