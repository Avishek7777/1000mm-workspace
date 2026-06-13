"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  MapPin,
  Calendar,
  Heart,
  Users,
  BookOpen,
  Home,
  Rocket,
  ChevronLeft,
  Phone,
  Mail,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";
import GroundbreakingSlider from "./_components/GroundbreakingSlider";

const warmBg = {
  background: "linear-gradient(160deg, #fdf6ec 0%, #fef3e2 50%, #fdf0d5 100%)",
};
const warmBgDeep = {
  background: "linear-gradient(160deg, #fef3e2 0%, #fde8c8 60%, #fdf6ec 100%)",
};

const purposes = [
  {
    icon: BookOpen,
    title: "Training Hub",
    body: "A training hub for future missionaries and church leaders.",
  },
  {
    icon: Heart,
    title: "Spiritual Formation",
    body: "A spiritual formation center where young people can deepen their relationship with Christ.",
  },
  {
    icon: Rocket,
    title: "Launching Point",
    body: "A launching point for evangelistic outreach throughout Bangladesh and beyond.",
  },
  {
    icon: Users,
    title: "Kingdom Workers",
    body: "A place where generations of workers will be prepared to serve God's kingdom with dedication and excellence.",
  },
];

const prayerPoints = [
  "God's wisdom and guidance for project leaders.",
  "Financial provision to complete every phase of construction.",
  "Safety for all workers and volunteers involved.",
  "Future students who will be trained and sent into mission fields.",
  "A powerful spiritual influence that will reach thousands through this ministry.",
];

const leaders = [
  {
    name: "Dr. Choon Ho Cho (Moses)",
    role: "Director, 1000 Missionary Movement",
  },
  {
    name: "Pr. Won Sang Kim",
    role: "President, Bangladesh Adventist Union Mission",
  },
  { name: "Pr. Benjamin Mrong", role: "Executive Secretary, BAUM" },
  { name: "Mr. Amol Baroi", role: "Treasurer, BAUM" },
  { name: "Pr. Ann Chun Soo", role: "Lead Philanthropic Partner" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

export default function TrainingCenterPage() {
  return (
    <>
      <NavBar />

      {/* ── Full-bleed hero image ─────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden">
        <Image
          src="/images/projects/training-center.jpg"
          alt="1000MM Bangladesh Training Center Groundbreaking"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Dark gradient — text legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.15) 100%)",
          }}
        />

        {/* Back link */}
        <div className="absolute top-24 left-6 z-10">
          <Link
            href="/current-projects"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors duration-200"
            style={{ fontFamily: "Georgia, serif" }}
          >
            <ChevronLeft className="w-4 h-4" />
            All Projects
          </Link>
        </div>

        {/* Hero text */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-14">
          {/* Status + date */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(90deg, #007f98, #f97316)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Active Project
            </span>
            <span
              className="flex items-center gap-1.5 text-white/50 text-xs"
              style={{ fontFamily: "Georgia, serif" }}
            >
              <Calendar className="w-3.5 h-3.5" /> Groundbreaking: December 10,
              2025
            </span>
            <span
              className="flex items-center gap-1.5 text-white/50 text-xs"
              style={{ fontFamily: "Georgia, serif" }}
            >
              <MapPin className="w-3.5 h-3.5" /> BASC Campus, Bangladesh
            </span>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-orange-300 text-sm font-semibold tracking-[0.2em] uppercase mb-3"
            style={{ fontFamily: "Georgia, serif" }}
          >
            A Legacy in the Making
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-4xl md:text-6xl font-bold text-white leading-tight mb-5"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Help Complete the
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
              }}
            >
              1000MM Training Center
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/donate-now"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-white text-sm hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg w-fit"
              style={{
                background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                fontFamily: "Georgia, serif",
              }}
            >
              Donate to This Project
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#about"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold text-white text-sm border border-white/30 hover:bg-white/10 transition-all duration-300 w-fit"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Read the Full Story
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Historic milestone — warm cream ─────────────────────────────── */}
      <section id="about" className="py-20" style={warmBg}>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-14 items-start">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="h-px w-8 bg-orange-400" />
              <span
                className="text-orange-500 text-xs font-semibold tracking-[0.2em] uppercase"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Historic Groundbreaking
              </span>
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold mb-5 leading-snug"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              A Vision Years in
              <br />
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(90deg, #007f98, #f97316)",
                }}
              >
                the Making.
              </span>
            </h2>
            <div
              className="space-y-4 text-sm leading-relaxed"
              style={{ fontFamily: "Georgia, serif", color: "#78350f" }}
            >
              <p>
                On{" "}
                <strong style={{ color: "#3b1f08" }}>December 10, 2025</strong>,
                a long-awaited dream became reality as the groundbreaking
                ceremony for the 1000 Missionary Movement Bangladesh Training
                Center was officially held at the Bangladesh Adventist Seminary
                and College (BASC) Campus. This historic milestone stands as a
                powerful testimony to God's faithfulness and the unwavering
                prayers, dedication, and generosity of His people.
              </p>
              <p>
                For years, church leaders, missionaries, and supporters have
                envisioned a training center that would equip and empower young
                men and women to serve as missionaries across Bangladesh and
                beyond. Today, that vision has moved from prayer to action.
              </p>
              <p>
                Special appreciation is extended to{" "}
                <strong style={{ color: "#3b1f08" }}>
                  Pastor Ann Chun Soo
                </strong>
                , whose generous philanthropic support has played a vital role
                in launching this project, and to our faithful{" "}
                <strong style={{ color: "#3b1f08" }}>
                  Korean partners and friends
                </strong>{" "}
                whose prayers, encouragement, and financial contributions have
                been instrumental throughout this journey.
              </p>
            </div>
          </motion.div>

          {/* Groundbreaking image */}
          <GroundbreakingSlider />
        </div>
      </section>

      {/* ── What this center will be — white ────────────────────────────── */}
      <section className="bg-white py-20 border-y border-amber-100">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-px w-8 bg-orange-400" />
              <span
                className="text-orange-500 text-xs font-semibold tracking-[0.2em] uppercase"
                style={{ fontFamily: "Georgia, serif" }}
              >
                The Vision
              </span>
              <span className="h-px w-8 bg-orange-400" />
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              This Center Will Serve As
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-5">
            {purposes.map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-2xl border border-amber-100 bg-amber-50/50 p-6 flex gap-4 items-start"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(0,127,152,0.1)" }}
                >
                  <item.icon className="w-5 h-5" style={{ color: "#007f98" }} />
                </div>
                <div>
                  <p
                    className="font-bold text-sm mb-1"
                    style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
                  >
                    {item.title}
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ fontFamily: "Georgia, serif", color: "#78350f" }}
                  >
                    {item.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Full appeal text — warm deep ─────────────────────────────────── */}
      <section className="py-20" style={warmBgDeep}>
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="h-px w-8 bg-orange-400" />
              <span
                className="text-orange-500 text-xs font-semibold tracking-[0.2em] uppercase"
                style={{ fontFamily: "Georgia, serif" }}
              >
                An Urgent Need
              </span>
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold mb-6 leading-snug"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              An Invitation to Become
              <br />
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(90deg, #007f98, #f97316)",
                }}
              >
                a Builder of Mission
              </span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-5 text-sm leading-relaxed"
            style={{ fontFamily: "Georgia, serif", color: "#78350f" }}
          >
            <p>
              While we rejoice in this significant achievement, the journey is
              not yet complete. The Training Center now enters its most critical
              phase: construction and development. To transform this vision into
              a fully functioning missionary training facility, substantial
              financial support is still needed.
            </p>
            <p>
              Today, we humbly invite churches, organizations, families, and
              individuals to become partners in this sacred endeavor. Your
              contribution is not simply a donation to a building project — it
              is an{" "}
              <strong style={{ color: "#3b1f08" }}>
                investment in souls, in mission, and in eternity
              </strong>
              . Through your generosity, countless young missionaries will
              receive training that will enable them to carry the Gospel to
              unreached communities and transform lives through the power of
              Christ.
            </p>
            <p>
              No gift is too small, and no act of generosity goes unnoticed by
              God. Together, we can complete this training center and create a
              lasting impact that will extend far beyond our generation.
            </p>
          </motion.div>

          {/* Pull quote */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="my-10 rounded-2xl border border-amber-200 bg-white/70 px-7 py-6"
          >
            <p
              className="text-base md:text-lg italic font-semibold leading-relaxed text-center"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              "Donate. Pray. Partner. Build the future of mission in
              Bangladesh."
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center"
          >
            <Link
              href="/donate-now"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white text-sm hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg"
              style={{
                background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                fontFamily: "Georgia, serif",
              }}
            >
              Donate to This Project
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Prayer points — white ─────────────────────────────────────────── */}
      <section className="bg-white py-20 border-y border-amber-100">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-px w-8 bg-orange-400" />
              <span
                className="text-orange-500 text-xs font-semibold tracking-[0.2em] uppercase"
                style={{ fontFamily: "Georgia, serif" }}
              >
                We Need Your Prayers
              </span>
              <span className="h-px w-8 bg-orange-400" />
            </div>
            <h2
              className="text-2xl md:text-3xl font-bold"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              Please Pray With Us
            </h2>
          </motion.div>

          <div className="space-y-3">
            {prayerPoints.map((point, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex items-start gap-4 rounded-2xl border border-amber-100 bg-amber-50/50 px-5 py-4"
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                  style={{
                    background: "linear-gradient(90deg, #007f98, #f97316)",
                  }}
                >
                  {i + 1}
                </span>
                <p
                  className="text-sm leading-relaxed"
                  style={{ fontFamily: "Georgia, serif", color: "#78350f" }}
                >
                  {point}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Leadership — warm cream ───────────────────────────────────────── */}
      <section className="py-20" style={warmBg}>
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-px w-8 bg-orange-400" />
              <span
                className="text-orange-500 text-xs font-semibold tracking-[0.2em] uppercase"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Project Leadership
              </span>
              <span className="h-px w-8 bg-orange-400" />
            </div>
            <h2
              className="text-2xl md:text-3xl font-bold"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              The People Behind the Vision
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {leaders.map((leader, i) => (
              <motion.div
                key={leader.name}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-2xl border border-amber-200 bg-white/70 px-5 py-4 flex items-center gap-4"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #007f98, #f97316)",
                  }}
                >
                  {leader.name.charAt(0)}
                </div>
                <div>
                  <p
                    className="font-bold text-sm"
                    style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
                  >
                    {leader.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{ fontFamily: "Georgia, serif", color: "#b45309" }}
                  >
                    {leader.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact + CTA — white ─────────────────────────────────────────── */}
      <section className="bg-white py-20 border-t border-amber-100">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Home className="w-7 h-7 mx-auto mb-4 text-orange-400" />
            <h2
              className="text-2xl md:text-3xl font-bold mb-3"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              Ready to Build with Us?
            </h2>
            <p
              className="text-gray-500 text-sm leading-relaxed mb-8 max-w-lg mx-auto"
              style={{ fontFamily: "Georgia, serif" }}
            >
              For more information on how to support the 1000 Missionary
              Movement, contact us directly.
            </p>

            {/* Contact cards */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <a
                href="tel:+8801324333377"
                className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 px-6 py-4 hover:shadow-md hover:border-amber-300 transition-all duration-200"
              >
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(249,115,22,0.12)" }}
                >
                  <Phone className="w-5 h-5 text-orange-500" />
                </span>
                <div className="text-left">
                  <p
                    className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-0.5"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    Call Us
                  </p>
                  <p
                    className="font-bold text-sm"
                    style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
                  >
                    +880 1324-333377
                  </p>
                </div>
              </a>
              <a
                href="mailto:info@1000mm.org.bd"
                className="flex items-center gap-4 rounded-2xl border border-teal-200 bg-teal-50/60 px-6 py-4 hover:shadow-md hover:border-teal-300 transition-all duration-200"
              >
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(0,127,152,0.12)" }}
                >
                  <Mail className="w-5 h-5 text-teal-600" />
                </span>
                <div className="text-left">
                  <p
                    className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-0.5"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    Email Us
                  </p>
                  <p
                    className="font-bold text-sm"
                    style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
                  >
                    info@1000mm.org.bd
                  </p>
                </div>
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/donate-now"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-white text-sm hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg"
                style={{
                  background:
                    "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                  fontFamily: "Georgia, serif",
                }}
              >
                Donate Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/current-projects"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-amber-800 text-sm border border-amber-300 hover:bg-amber-50 hover:border-amber-400 transition-all duration-300"
                style={{ fontFamily: "Georgia, serif" }}
              >
                ← All Projects
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}
