// apps/website/app/current-projects/page.tsx
// Server component — no "use client" needed.
// Reads from lib/projects.ts; adding a project there makes it appear here automatically.

import { motion } from "framer-motion"; // still works in RSC for static props
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Calendar } from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";
import { PROJECTS } from "@/lib/projects";
import ProjectsGrid from "./_components/ProjectsGrid";

const warmBg = {
  background: "linear-gradient(160deg, #fdf6ec 0%, #fef3e2 50%, #fdf0d5 100%)",
};

export const metadata = {
  title: "Current Projects — 1000MM Bangladesh",
  description:
    "Active initiatives your donations are building right now. Every gift moves the mission forward.",
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
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="h-px w-10 bg-orange-400" />
            <span
              className="text-orange-500 text-sm font-semibold tracking-[0.2em] uppercase"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Active Initiatives
            </span>
            <span className="h-px w-10 bg-orange-400" />
          </div>

          <h1
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
          </h1>

          <p
            className="text-base md:text-lg leading-relaxed"
            style={{ fontFamily: "Georgia, serif", color: "#92400e" }}
          >
            These are the active projects your donations are building right now.
            Every gift moves the mission forward.
          </p>

          {/* Live count */}
          <p
            className="mt-4 text-xs font-semibold tracking-widest uppercase text-amber-600/70"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {PROJECTS.length} active project{PROJECTS.length !== 1 ? "s" : ""}
          </p>
        </div>
      </section>

      {/* ── Project cards ────────────────────────────────────────────────── */}
      <section className="bg-white py-20 border-y border-amber-100">
        <div className="max-w-5xl mx-auto px-6">
          {/* Client component handles framer-motion animations */}
          <ProjectsGrid projects={PROJECTS} />
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="py-16" style={warmBg}>
        <div className="max-w-2xl mx-auto px-6 text-center">
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
        </div>
      </section>

      <Footer />
    </>
  );
}
