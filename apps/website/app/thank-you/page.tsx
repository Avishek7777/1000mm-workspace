"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, ArrowRight, Home } from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";

const warmBg = {
  background: "linear-gradient(160deg, #fdf6ec 0%, #fef3e2 50%, #fdf0d5 100%)",
};

const warmBgDeep = {
  background: "linear-gradient(160deg, #fef3e2 0%, #fde8c8 60%, #fdf6ec 100%)",
};

const whereItGoes = [
  { label: "Training Expenses", icon: "📖" },
  { label: "Cafeteria Food", icon: "🍽️" },
  { label: "Missionaries' Stipends & Fares", icon: "🌍" },
  { label: "Campus Facilities Repair", icon: "🏗️" },
];

export default function ThankYouPage() {
  return (
    <>
      <NavBar />

      {/* ── Hero — warm cream ─────────────────────────────────────────────── */}
      <section
        className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-24 pb-20"
        style={warmBg}
      >
        {/* Radial amber glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 65% 55% at 50% 0%, rgba(251,191,36,0.22) 0%, transparent 70%)",
          }}
        />
        {/* Cross pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0v60M0 30h60' stroke='%23a16207' stroke-width='0.5'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          {/* Animated heart */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-8 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #fef3e2 0%, #fde8c8 100%)",
              border: "2px solid rgba(251,191,36,0.4)",
            }}
          >
            <Heart className="w-9 h-9 text-orange-500" fill="currentColor" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-5"
          >
            <span className="h-px w-10 bg-orange-400" />
            <span
              className="text-orange-500 text-sm font-semibold tracking-[0.2em] uppercase"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Donation Received
            </span>
            <span className="h-px w-10 bg-orange-400" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-4xl md:text-6xl font-bold leading-tight mb-6"
            style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
          >
            Thank You for
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
              }}
            >
              Your Generosity.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="text-base md:text-lg leading-relaxed mb-10"
            style={{ fontFamily: "Georgia, serif", color: "#92400e" }}
          >
            Your generous donation is helping our missionaries bring hope, love,
            and positive change to those in need. We deeply appreciate your
            partnership in this mission. May God bless you abundantly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/donation-proceeds"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-white text-sm hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg"
              style={{
                background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                fontFamily: "Georgia, serif",
              }}
            >
              See How Your Gift Is Used
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold text-amber-800 text-sm border border-amber-300 hover:bg-amber-50 hover:border-amber-400 transition-all duration-300"
              style={{ fontFamily: "Georgia, serif" }}
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Where it goes snapshot — white ───────────────────────────────── */}
      <section className="bg-white py-16 border-y border-amber-100">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Your donation supports
            </p>
            <h2
              className="text-2xl md:text-3xl font-bold mb-8"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              Every Gift Goes Directly to the Field
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {whereItGoes.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 text-center"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <p
                  className="text-sm font-semibold leading-snug"
                  style={{ fontFamily: "Georgia, serif", color: "#78350f" }}
                >
                  {item.label}
                </p>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8"
          >
            <Link
              href="/donation-proceeds"
              className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4 hover:text-orange-600 transition-colors"
              style={{ color: "#c2410c", fontFamily: "Georgia, serif" }}
            >
              Read the full breakdown of donation proceeds →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Scripture — warm deep ─────────────────────────────────────────── */}
      <section className="py-16" style={warmBgDeep}>
        <div className="max-w-2xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl p-10 overflow-hidden shadow-sm"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,237,213,0.9) 0%, rgba(254,243,199,0.9) 100%)",
              border: "1px solid rgba(251,191,36,0.3)",
            }}
          >
            <div
              className="text-7xl leading-none select-none mb-2 block"
              style={{
                fontFamily: "Georgia, serif",
                background: "linear-gradient(90deg, #007f98, #f97316)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
              aria-hidden="true"
            >
              &ldquo;
            </div>
            <p
              className="text-xl md:text-2xl leading-relaxed italic mb-5"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              Well done, good and faithful servant! You have been faithful with
              a few things; I will put you in charge of many things.
            </p>
            <p
              className="text-sm"
              style={{ fontFamily: "Georgia, serif", color: "#b45309" }}
            >
              — Matthew 25:23
            </p>
            <div
              className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-25 blur-2xl pointer-events-none"
              style={{
                background: "radial-gradient(circle, #fbbf24, transparent 70%)",
              }}
            />
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}
