"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Phone, Mail, Heart, ArrowRight } from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";
import ProceedsSlider from "./_components/ProceedsSlider";

const warmBg = {
  background: "linear-gradient(160deg, #fdf6ec 0%, #fef3e2 50%, #fdf0d5 100%)",
};

const warmBgDeep = {
  background: "linear-gradient(160deg, #fef3e2 0%, #fde8c8 60%, #fdf6ec 100%)",
};

const proceeds = [
  {
    icon: "📖",
    title: "Training Expenses",
    body: "Your contribution helps provide essential training for our missionaries, equipping them to serve effectively and fulfill God's calling. We are deeply grateful for your partnership in this mission.",
    color: "#007f98",
    bg: "#f0f9fb",
    border: "#b2e3ed",
  },
  {
    icon: "🍽️",
    title: "Cafeteria Food",
    body: "Our missionaries are called by God, and it is our privilege to serve those who serve Him. Throughout their training, the campus cafeteria provides breakfast, lunch, and dinner — made possible through the generous support of donors and sending missionaries.",
    color: "#c2410c",
    bg: "#fff7ed",
    border: "#fed7aa",
  },
  {
    icon: "🌍",
    title: "Missionaries' Stipends & Fares",
    body: "Your contribution helps provide missionaries with their stipends and travel expenses, enabling them to continue serving faithfully in the mission field. We are deeply grateful for your partnership in advancing God's work.",
    color: "#007f98",
    bg: "#f0f9fb",
    border: "#b2e3ed",
  },
  {
    icon: "🏗️",
    title: "Campus Facilities Repair",
    body: "Your contribution helps repair and improve essential campus facilities, including dormitories, toilets, and ceilings, creating a safer and more comfortable environment for our missionaries in training. We are grateful for your partnership in investing in the next generation of Christ's workers.",
    color: "#c2410c",
    bg: "#fff7ed",
    border: "#fed7aa",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: "easeOut" as const },
  }),
};

export default function DonationProceedsPage() {
  return (
    <>
      <NavBar />

      {/* ── Hero — warm cream ─────────────────────────────────────────────── */}
      <section
        className="relative min-h-[52vh] flex items-center justify-center overflow-hidden pt-28 pb-20"
        style={warmBg}
      >
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
              Transparency
            </span>
            <span className="h-px w-10 bg-orange-400" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-4xl md:text-6xl font-bold leading-tight mb-6"
            style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
          >
            How Your Donation
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
              }}
            >
              Is Put to Work.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-base md:text-lg leading-relaxed"
            style={{ fontFamily: "Georgia, serif", color: "#92400e" }}
          >
            Thank you for your generous donation. Your support is helping our
            missionaries bring hope, love, and positive change to those in need.
            We deeply appreciate your partnership in this mission. May God bless
            you abundantly.
          </motion.p>
        </div>
      </section>

      {/* ── Proceeds cards — white ────────────────────────────────────────── */}
      <ProceedsSlider />

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
              Whoever is generous to the poor lends to the Lord, and he will
              repay him for his deed.
            </p>
            <p
              className="text-sm"
              style={{ fontFamily: "Georgia, serif", color: "#b45309" }}
            >
              — Proverbs 19:17
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

      {/* ── Contact + CTA — white ─────────────────────────────────────────── */}
      <section className="bg-white py-20 border-t border-amber-100">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h2
              className="text-2xl md:text-3xl font-bold mb-3"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              Want to Know More?
            </h2>
            <p
              className="text-base text-gray-500 max-w-lg mx-auto"
              style={{ fontFamily: "Georgia, serif" }}
            >
              For more information on how to support the 1000 Missionary
              Movement, reach out to us directly.
            </p>
          </motion.div>

          {/* Contact cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid sm:grid-cols-2 gap-4 mb-10"
          >
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
              <div>
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
              <div>
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
          </motion.div>

          {/* Donate CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
          >
            <Heart
              className="w-6 h-6 mx-auto mb-4 text-orange-400"
              fill="currentColor"
            />
            <p
              className="text-gray-500 text-sm mb-6"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Ready to make a difference?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/donate"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-white text-sm hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg"
                style={{
                  background:
                    "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                  fontFamily: "Georgia, serif",
                }}
              >
                Donate Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/how-to-donate"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-amber-800 text-sm border border-amber-300 hover:bg-amber-50 hover:border-amber-400 transition-all duration-300"
                style={{ fontFamily: "Georgia, serif" }}
              >
                All Payment Options
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}
