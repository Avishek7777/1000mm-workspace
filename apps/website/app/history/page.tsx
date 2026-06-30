"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";
import { ArrowRight } from "lucide-react";

const SERIF = { fontFamily: "Georgia, serif" };

const warmBg = "linear-gradient(160deg, #fafaf9 0%, #fff7ed 100%)";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

const milestones = [
  {
    year: "1997",
    title: "The Vision is Born",
    body: "The 1000 Missionary Movement Bangladesh is founded, inspired by the global call to finish the work of the Gospel. A small but faithful group of young Adventists answer the call to serve as full-time missionaries across Bangladesh.",
    accent: "#007f98",
  },
  {
    year: "2000s",
    title: "Roots Take Hold",
    body: "Early batches of missionaries are trained and deployed across rural and underserved communities. Churches are planted, evangelistic meetings are held, and the movement begins to establish a lasting presence in Bangladesh's mission fields.",
    accent: "#16a34a",
  },
  {
    year: "2010s",
    title: "Growing in Strength",
    body: "The movement expands across four sections of the Seventh-day Adventist Church in Bangladesh. Hundreds of young believers are trained and sent out, planting congregations, building churches, and transforming communities through health outreach and gospel ministry.",
    accent: "#f97316",
  },
  {
    year: "2020",
    title: "Persevering Through Adversity",
    body: "Despite the challenges of the global pandemic, the movement presses forward. Training adapts, vision remains clear, and missionaries continue serving wherever God opens doors — demonstrating that no circumstance can stop the Gospel.",
    accent: "#9333ea",
  },
  {
    year: "2024–25",
    title: "Building for Generations",
    body: "Groundbreaking is held on December 10, 2025, for the 1000MM Bangladesh Training Center at BASC Campus — a permanent facility that will equip generations of missionaries for Bangladesh and beyond. The movement also launches the Bicycles for Missionaries and Medical Kits initiatives, equipping workers for more effective outreach.",
    accent: "#007f98",
  },
  {
    year: "2026",
    title: "The 29th Batch & Beyond",
    body: "The 29th Batch Missionary Training Program launches at BANC Campus, Gazipur — 60–100 young missionaries prepared for one year of dedicated full-time mission service. With over 1,084 missionaries trained, 4,962+ decisions for Christ, 29+ congregations established, and 60+ churches built, the harvest continues.",
    accent: "#f97316",
  },
];

const pillars = [
  {
    title: "Training",
    body: "Intensive biblical, doctrinal, and practical training equips each missionary for effective gospel ministry.",
    gradient: "linear-gradient(135deg, #007f98, #4ade80)",
  },
  {
    title: "Sending",
    body: "Trained missionaries are commissioned and deployed to local mission fields, rural communities, and beyond Bangladesh's borders.",
    gradient: "linear-gradient(135deg, #f97316, #ea580c)",
  },
  {
    title: "Supporting",
    body: "Missionaries are supported spiritually, practically, and financially throughout their full one-year commitment.",
    gradient: "linear-gradient(135deg, #9333ea, #007f98)",
  },
  {
    title: "Multiplying",
    body: "Every missionary trained becomes a multiplier — planting churches, discipling new believers, and inspiring others to answer the call.",
    gradient: "linear-gradient(135deg, #16a34a, #f97316)",
  },
];

const stats = [
  { value: "1997", label: "Year Founded" },
  { value: "1,084+", label: "Missionaries Trained & Sent" },
  { value: "4,962+", label: "Decisions for Christ" },
  { value: "29+", label: "Congregations Established" },
  { value: "60+", label: "Churches Built" },
  { value: "29", label: "Batches Completed" },
];

export default function HistoryPage() {
  return (
    <>
      <NavBar />

      <main style={{ background: warmBg }} className="relative min-h-screen overflow-hidden">
        {/* Watermark */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-2rem] top-[4%] select-none text-[18vw] font-bold leading-none opacity-[0.03]"
          style={{ ...SERIF, color: "#f97316" }}
        >
          1997
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6 pb-28 pt-28">

          {/* ── Header ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-16 text-center"
          >
            <div className="mb-4 flex items-center justify-center gap-3">
              <span className="h-px w-12" style={{ background: "linear-gradient(90deg,#16a34a,#f97316)" }} />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500" style={SERIF}>
                Since 1997
              </span>
              <span className="h-px w-12" style={{ background: "linear-gradient(90deg,#f97316,#16a34a)" }} />
            </div>
            <h1 className="text-5xl font-bold leading-tight text-stone-800 md:text-6xl" style={SERIF}>
              Our{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg,#007f98 0%,#f97316 100%)" }}
              >
                History
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-stone-500" style={SERIF}>
              Nearly three decades of faithful service — training young Bangladeshi believers and sending them
              into the harvest. This is the story of ordinary people answering an extraordinary call.
            </p>
          </motion.div>

          {/* ── Founding Story ───────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="mb-20 overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm"
          >
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#007f98,#f97316)" }} />
            <div className="p-8 md:p-12">
              <div className="mb-3 inline-flex items-center gap-2">
                <span className="h-px w-8" style={{ background: "linear-gradient(90deg,#16a34a,#f97316)" }} />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500" style={SERIF}>
                  The Beginning
                </span>
              </div>
              <h2 className="mb-5 text-3xl font-bold text-stone-800 md:text-4xl" style={SERIF}>
                A God-Inspired{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(90deg,#007f98,#f97316)" }}
                >
                  Vision
                </span>
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-stone-600" style={SERIF}>
                <p>
                  The 1000 Missionary Movement Bangladesh was born in 1997 out of a deep conviction
                  that the Gospel must reach every corner of this nation. Inspired by the global 1000
                  Missionary Movement, a group of passionate Seventh-day Adventist believers in Bangladesh
                  felt God calling them to raise up an army of young missionaries — not just for a season,
                  but for a generation.
                </p>
                <p>
                  From the very beginning, the vision was clear: train, equip, and send young Bangladeshi
                  believers as full-time missionaries for one year — reaching the unreached, planting
                  churches, and demonstrating the love of Christ in communities across the country.
                </p>
                <p>
                  What started as a small, faith-driven initiative has grown into one of Bangladesh&apos;s
                  most impactful youth missionary programs. Through 29 batches spanning nearly three
                  decades, God has been faithful — and the work continues.
                </p>
              </div>
              <blockquote
                className="mt-8 border-l-4 pl-6 italic text-stone-500"
                style={{ borderColor: "#f97316", ...SERIF }}
              >
                &ldquo;Here am I, Lord, send me.&rdquo;
                <span className="mt-1 block text-xs not-italic text-stone-400">— Isaiah 6:8</span>
              </blockquote>
            </div>
          </motion.div>

          {/* ── Timeline ─────────────────────────────── */}
          <div className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="mb-10 text-center"
            >
              <div className="mb-3 flex items-center justify-center gap-3">
                <span className="h-px w-12" style={{ background: "linear-gradient(90deg,#007f98,#f97316)" }} />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500" style={SERIF}>
                  Milestones
                </span>
                <span className="h-px w-12" style={{ background: "linear-gradient(90deg,#f97316,#007f98)" }} />
              </div>
              <h2 className="text-3xl font-bold text-stone-800 md:text-4xl" style={SERIF}>
                29 Years of{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(90deg,#007f98,#f97316)" }}
                >
                  Faithful Service
                </span>
              </h2>
            </motion.div>

            <div className="relative">
              {/* Vertical line */}
              <div
                className="absolute left-[22px] top-0 hidden h-full w-px md:block md:left-1/2"
                style={{ background: "linear-gradient(180deg,#007f98,#f97316,#16a34a)" }}
              />

              <div className="space-y-10">
                {milestones.map((m, i) => (
                  <motion.div
                    key={m.year}
                    custom={i}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={fadeUp}
                    className={`relative flex flex-col gap-4 md:flex-row md:items-start ${
                      i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                  >
                    {/* Year bubble */}
                    <div className="z-10 flex md:absolute md:left-1/2 md:-translate-x-1/2 md:top-1">
                      <div
                        className="flex h-11 min-w-[80px] items-center justify-center rounded-full px-4 text-sm font-bold text-white shadow-md"
                        style={{ background: `linear-gradient(90deg,${m.accent},${m.accent}cc)` }}
                      >
                        {m.year}
                      </div>
                    </div>

                    {/* Card — alternates left/right on desktop */}
                    <div className={`md:w-[calc(50%-60px)] ${i % 2 === 0 ? "md:mr-auto md:pr-8" : "md:ml-auto md:pl-8"}`}>
                      <div className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
                        <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg,${m.accent},${m.accent}66)` }} />
                        <div className="p-5">
                          <h3 className="mb-2 text-lg font-bold text-stone-800" style={SERIF}>
                            {m.title}
                          </h3>
                          <p className="text-sm leading-relaxed text-stone-500" style={SERIF}>
                            {m.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Four Pillars ─────────────────────────── */}
          <div className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="mb-10 text-center"
            >
              <div className="mb-3 flex items-center justify-center gap-3">
                <span className="h-px w-12" style={{ background: "linear-gradient(90deg,#007f98,#f97316)" }} />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500" style={SERIF}>
                  How We Work
                </span>
                <span className="h-px w-12" style={{ background: "linear-gradient(90deg,#f97316,#007f98)" }} />
              </div>
              <h2 className="text-3xl font-bold text-stone-800 md:text-4xl" style={SERIF}>
                Built on Four{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(90deg,#007f98,#f97316)" }}
                >
                  Pillars
                </span>
              </h2>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2">
              {pillars.map((p, i) => (
                <motion.div
                  key={p.title}
                  custom={i}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={fadeUp}
                  className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm"
                >
                  <div className="h-1 w-full" style={{ background: p.gradient }} />
                  <div className="p-6">
                    <div
                      className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
                      style={{ background: p.gradient }}
                    >
                      {i + 1}
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-stone-800" style={SERIF}>
                      {p.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-stone-500" style={SERIF}>
                      {p.body}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Stats ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="mb-20 overflow-hidden rounded-3xl"
            style={{ background: "linear-gradient(135deg, #0a1a0f 0%, #1a0f05 50%, #0d1a0a 100%)" }}
          >
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#007f98,#f97316)" }} />
            <div className="p-8 md:p-12">
              <div className="mb-8 text-center">
                <div className="mb-3 flex items-center justify-center gap-3">
                  <span className="h-px w-10" style={{ background: "linear-gradient(90deg,transparent,#4ade80)" }} />
                  <span className="text-xs font-semibold uppercase tracking-[0.25em] text-green-400" style={SERIF}>
                    By the Numbers
                  </span>
                  <span className="h-px w-10" style={{ background: "linear-gradient(90deg,#f97316,transparent)" }} />
                </div>
                <h2 className="text-3xl font-bold text-white" style={SERIF}>
                  God&apos;s Faithfulness in Numbers
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {stats.map((s, i) => (
                  <div
                    key={s.label}
                    className="rounded-2xl p-5 text-center"
                    style={{
                      background:
                        i % 2 === 0
                          ? "rgba(22,163,74,0.08)"
                          : "rgba(249,115,22,0.08)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="mb-1 text-3xl font-bold md:text-4xl"
                      style={{
                        ...SERIF,
                        background:
                          i % 2 === 0
                            ? "linear-gradient(135deg,#4ade80,#007f98)"
                            : "linear-gradient(135deg,#f97316,#ea580c)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        color: "transparent",
                        display: "inline-block",
                      }}
                    >
                      {s.value}
                    </div>
                    <p className="text-xs leading-snug text-white/60" style={SERIF}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Scripture + CTA ───────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="rounded-3xl border border-amber-200 bg-white/70 px-8 py-12 text-center"
          >
            <div className="mx-auto mb-6 h-px max-w-xs" style={{ background: "linear-gradient(90deg,transparent,#f97316,transparent)" }} />
            <p className="mx-auto mb-2 max-w-2xl text-xl font-semibold italic text-stone-700 md:text-2xl" style={SERIF}>
              &ldquo;The harvest is plentiful, but the laborers are few. Ask the Lord of the harvest,
              therefore, to send out workers into his harvest field.&rdquo;
            </p>
            <p className="mb-8 text-sm text-stone-400" style={SERIF}>— Matthew 9:37–38</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/training-schedule"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:scale-105 hover:opacity-90"
                style={{ background: "linear-gradient(90deg,#007f98 0%,#f97316 100%)", ...SERIF }}
              >
                View Training Programs
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/#how-to-join"
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-7 py-3.5 text-sm font-semibold text-stone-700 transition-all duration-200 hover:border-teal-400 hover:text-teal-700"
                style={SERIF}
              >
                Become a Missionary
              </Link>
            </div>
          </motion.div>

        </div>
      </main>

      <Footer />
    </>
  );
}
