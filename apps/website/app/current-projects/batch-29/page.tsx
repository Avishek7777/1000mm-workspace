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
  Rocket,
  ChevronLeft,
  Phone,
  Mail,
  Target,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";
import Batch29Slider from "./_components/Batch29Slider";

const warmBg = {
  background: "linear-gradient(160deg, #fdf6ec 0%, #fef3e2 50%, #fdf0d5 100%)",
};
const warmBgDeep = {
  background: "linear-gradient(160deg, #fef3e2 0%, #fde8c8 60%, #fdf6ec 100%)",
};

const purposes = [
  {
    icon: BookOpen,
    title: "Biblical & Doctrinal Training",
    body: "Intensive instruction in Bible doctrines, Adventist beliefs, personal and public evangelism, and church planting.",
  },
  {
    icon: Heart,
    title: "Health & Community Ministry",
    body: "Practical training in health education, lifestyle ministry, community service, and humanitarian outreach.",
  },
  {
    icon: Rocket,
    title: "Media & Digital Evangelism",
    body: "Equipping missionaries with modern media tools and digital communication skills for twenty-first century outreach.",
  },
  {
    icon: Users,
    title: "Leadership Development",
    body: "Mentoring the next generation of pastors, evangelists, church administrators, and dedicated lay leaders.",
  },
];

const budgetRows = [
  { label: "Training Program Budget (A)", bdt: "796,700" },
  { label: "Essential Supplies (B)", bdt: "181,700" },
  { label: "Media & Equipment", bdt: "912,982" },
];

const outcomes = [
  "60–100 young missionaries equipped and commissioned for mission service.",
  "New evangelistic initiatives launched across multiple regions of Bangladesh.",
  "Local churches strengthened with trained workers and volunteers.",
  "Communities reached through health, educational, and humanitarian outreach.",
  "Future pastors, teachers, and church leaders developed for lifelong ministry.",
];

const prayerPoints = [
  "God's blessing and anointing over every trainer, speaker, and participant.",
  "Full financial provision for all program costs before October 2026.",
  "Safety and health of all trainees throughout the residential program.",
  "Spiritual transformation and deep commitment in every missionary trained.",
  "Fruitful outreach and souls won to Christ through the trainees' ministry.",
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: "easeOut" },
  }),
};

export default function Batch29Page() {
  return (
    <>
      <NavBar />

      {/* ── Full-bleed hero ───────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden">
        <Image
          src="/images/projects/batch-29/batch-29-1.jpg"
          alt="29th Batch Missionary Training Program 2026"
          fill
          className="object-cover object-center"
          priority
        />
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
              <Calendar className="w-3.5 h-3.5" /> Oct 04–31, 2026
            </span>
            <span
              className="flex items-center gap-1.5 text-white/50 text-xs"
              style={{ fontFamily: "Georgia, serif" }}
            >
              <MapPin className="w-3.5 h-3.5" /> BANC Campus, Gazipur,
              Bangladesh
            </span>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-orange-300 text-sm font-semibold tracking-[0.2em] uppercase mb-3"
            style={{ fontFamily: "Georgia, serif" }}
          >
            29 Years of Faithful Mission
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-4xl md:text-6xl font-bold text-white leading-tight mb-5"
            style={{ fontFamily: "Georgia, serif" }}
          >
            29th Batch
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
              }}
            >
              Missionary Training 2026
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
              Support This Program
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

      {/* ── History & intro — warm cream ─────────────────────────────────── */}
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
                29 Years of Mission
              </span>
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold mb-5 leading-snug"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              A Movement Built on
              <br />
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(90deg, #007f98, #f97316)",
                }}
              >
                Faithfulness Since 1997.
              </span>
            </h2>
            <div
              className="space-y-4 text-sm leading-relaxed"
              style={{ fontFamily: "Georgia, serif", color: "#78350f" }}
            >
              <p>
                Since its founding in{" "}
                <strong style={{ color: "#3b1f08" }}>1997</strong>, 1000
                Missionary Movement Bangladesh has trained and mobilized
                hundreds of young Seventh-day Adventists for mission service
                across Bangladesh and beyond. What began as a small initiative
                has grown into one of the most influential youth missionary
                training platforms in the country.
              </p>
              <p>
                Graduates now serve as pastors, teachers, healthcare
                professionals, church administrators, Bible workers, and
                dedicated lay leaders — their impact multiplying through every
                community they touch.
              </p>
              <p>
                Now, in{" "}
                <strong style={{ color: "#3b1f08" }}>October 2026</strong>, the
                movement reaches its{" "}
                <strong style={{ color: "#3b1f08" }}>29th Batch</strong> — a
                milestone that calls for a new generation of missionaries ready
                to carry the gospel to every corner of Bangladesh.
              </p>
            </div>

            {/* Quick stats */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { n: "29", label: "Training Batches" },
                { n: "1997", label: "Founded" },
                { n: "60–100", label: "Trainees Per Batch" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-amber-200 bg-white/70 px-4 py-4 text-center"
                >
                  <p
                    className="text-2xl font-bold text-transparent bg-clip-text"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, #007f98, #f97316)",
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    {s.n}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ fontFamily: "Georgia, serif", color: "#b45309" }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Slider */}
          <Batch29Slider />
        </div>
      </section>

      {/* ── What trainees receive — white ─────────────────────────────────── */}
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
                The Training
              </span>
              <span className="h-px w-8 bg-orange-400" />
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              Four Weeks That Change a Lifetime
            </h2>
            <p
              className="mt-3 text-sm text-amber-800/70 max-w-xl mx-auto leading-relaxed"
              style={{ fontFamily: "Georgia, serif" }}
            >
              An intensive residential program combining classroom learning,
              practical ministry, field practicum, health education, daily
              worship, and spiritual retreats.
            </p>
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

      {/* ── Budget — warm deep ────────────────────────────────────────────── */}
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
                Financial Need
              </span>
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold mb-4 leading-snug"
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
                a Sender of Missionaries
              </span>
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ fontFamily: "Georgia, serif", color: "#78350f" }}
            >
              Many participants come from economically disadvantaged backgrounds
              and are unable to afford the full cost of training. Your gift
              ensures no qualified missionary candidate is turned away because
              of financial limitations.
            </p>
          </motion.div>

          {/* Budget table */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl border border-amber-200 bg-white/70 overflow-hidden mb-8"
          >
            <div
              className="h-1"
              style={{ background: "linear-gradient(90deg, #007f98, #f97316)" }}
            />
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-100">
                  <th
                    className="px-5 py-3 text-left font-semibold"
                    style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
                  >
                    Budget Category
                  </th>
                  <th
                    className="px-5 py-3 text-right font-semibold"
                    style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
                  >
                    Amount (BDT)
                  </th>
                </tr>
              </thead>
              <tbody>
                {budgetRows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={
                      i < budgetRows.length - 1
                        ? "border-b border-amber-50"
                        : ""
                    }
                  >
                    <td
                      className="px-5 py-3"
                      style={{ fontFamily: "Georgia, serif", color: "#78350f" }}
                    >
                      {row.label}
                    </td>
                    <td
                      className="px-5 py-3 text-right"
                      style={{ fontFamily: "Georgia, serif", color: "#78350f" }}
                    >
                      {row.bdt}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-amber-200 bg-amber-50/60">
                  <td
                    className="px-5 py-3 font-bold"
                    style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
                  >
                    Grand Total
                  </td>
                  <td
                    className="px-5 py-3 text-right font-bold"
                    style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
                  >
                    1,891,382 BDT
                    <span
                      className="block text-xs font-normal"
                      style={{ color: "#b45309" }}
                    >
                      ≈ USD 15,503
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </motion.div>

          {/* Pull quote */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="rounded-2xl border border-amber-200 bg-white/70 px-7 py-6 mb-8"
          >
            <p
              className="text-base md:text-lg italic font-semibold leading-relaxed text-center"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              "The harvest truly is plentiful, but the laborers are few." —
              Matthew 9:37
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
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
              Support the 29th Batch
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Expected outcomes — white ─────────────────────────────────────── */}
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
                Expected Outcomes
              </span>
              <span className="h-px w-8 bg-orange-400" />
            </div>
            <h2
              className="text-2xl md:text-3xl font-bold"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              What Your Support Will Accomplish
            </h2>
          </motion.div>

          <div className="space-y-3">
            {outcomes.map((point, i) => (
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

      {/* ── Prayer points — warm cream ────────────────────────────────────── */}
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
                className="flex items-start gap-4 rounded-2xl border border-amber-100 bg-white/70 px-5 py-4"
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

      {/* ── Contact + CTA — white ─────────────────────────────────────────── */}
      <section className="bg-white py-20 border-t border-amber-100">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Target className="w-7 h-7 mx-auto mb-4 text-orange-400" />
            <h2
              className="text-2xl md:text-3xl font-bold mb-3"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              Partner With Us Today
            </h2>
            <p
              className="text-gray-500 text-sm leading-relaxed mb-8 max-w-lg mx-auto"
              style={{ fontFamily: "Georgia, serif" }}
            >
              For more information on how to support the 29th Batch Training
              Program, contact us directly.
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
