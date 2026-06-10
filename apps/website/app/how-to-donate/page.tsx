"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Heart,
  Building2,
  Smartphone,
  Globe,
  ShieldCheck,
  Phone,
  Mail,
  Copy,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";

// ─── Data ─────────────────────────────────────────────────────────────────────

const tiers = [
  {
    amount: "৳1,000",
    usd: "~$10",
    label: "Seed a Week",
    description: "Covers a missionary's daily meals for one week in the field.",
    accent: "#007f98",
  },
  {
    amount: "৳3,000",
    usd: "~$30",
    label: "Equip a Month",
    description:
      "Provides training materials and field supplies for one missionary for a month.",
    accent: "#c2410c",
    featured: true,
  },
  {
    amount: "৳15,000",
    usd: "~$125",
    label: "Sponsor a Missionary",
    description:
      "Fully supports one missionary for an entire year — training, travel, and field costs.",
    accent: "#007f98",
  },
];

const paymentMethods = [
  {
    icon: Smartphone,
    name: "bKash",
    detail: "01XXX-XXXXXX",
    note: "Send Money · Reference: DONATE",
    color: "#E2136E",
    bg: "#fdf2f7",
  },
  {
    icon: Smartphone,
    name: "Nagad",
    detail: "01XXX-XXXXXX",
    note: "Send Money · Reference: DONATE",
    color: "#F7941D",
    bg: "#fff8f0",
  },
  {
    icon: Building2,
    name: "Bank Transfer",
    detail: "See details below",
    note: "Commercial Bank of Ceylon PLC",
    color: "#007f98",
    bg: "#f0f9fb",
  },
  {
    icon: Globe,
    name: "International",
    detail: "General Conference",
    note: "Check / Wire · BAUM 1000MM Project",
    color: "#6366f1",
    bg: "#f5f5ff",
  },
];

const impactStats = [
  { value: "83,583", label: "Baptisms" },
  { value: "12,287", label: "Missionaries Sent" },
  { value: "1,501", label: "Churches Established" },
  { value: "66", label: "Countries Involved" },
];

const whereItGoes = [
  "Missionary training & spiritual formation",
  "Field travel & deployment costs",
  "Monthly missionary support",
  "Evangelism & outreach materials",
];

const bankDetails = [
  { label: "Bank Name", value: "Commercial Bank of Ceylon PLC" },
  {
    label: "Bank Address",
    value:
      "Genusys Heights, 623 & 624 Begum Rokeya Sharani, Kazipara, Mirpur, P.O. Box-3490, Dhaka, Bangladesh",
  },
  { label: "Bank Phone", value: "[+88] (02) 8035808" },
  {
    label: "Account Name",
    value: "Seventh-Day Adventist Church of Bangladesh",
  },
  {
    label: "Account Address",
    value: "149, Shah Ali Bagh, Mirpur-1, Dhaka-1216, Bangladesh",
  },
  { label: "Account Phone", value: "(+880) (2) 48032014 / (+88) 01712-661928" },
  { label: "Account No.", value: "1812004353" },
  { label: "Account Type", value: "Current" },
  { label: "Swift Code", value: "CCEYBDDH" },
  { label: "Routing No.", value: "080262989" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: "easeOut" },
  }),
};

const warmBg = {
  background: "linear-gradient(160deg, #fdf6ec 0%, #fef3e2 50%, #fdf0d5 100%)",
};

const warmBgDeep = {
  background: "linear-gradient(160deg, #fef3e2 0%, #fde8c8 60%, #fdf6ec 100%)",
};

// ─── Copy helper ──────────────────────────────────────────────────────────────
function CopyButton({ value }: { value: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(value)}
      className="ml-2 p-1 rounded-md hover:bg-amber-100 transition-colors duration-150 text-amber-400 hover:text-amber-600"
      title="Copy"
    >
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HowToDonatePage() {
  return (
    <>
      <NavBar />

      {/* ── SECTION 1 · Hero — WARM CREAM ──────────────────────────────────── */}
      <section
        className="relative min-h-[62vh] flex items-center justify-center overflow-hidden pt-28 pb-20"
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

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
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
              Support the Mission
            </span>
            <span className="h-px w-10 bg-orange-400" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-5xl md:text-7xl font-bold leading-[1.07] tracking-tight mb-6"
            style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
          >
            Give One Life
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
              }}
            >
              a Year of Purpose.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
            style={{ fontFamily: "Georgia, serif", color: "#92400e" }}
          >
            Every taka you give sends a young Bangladeshi believer into the
            field — trained, equipped, and sustained for a full year of Gospel
            service.
          </motion.p>
        </div>
      </section>

      {/* ── SECTION 2 · Impact stats — WHITE ───────────────────────────────── */}
      <section className="bg-white py-16 border-y border-amber-100">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          {impactStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center"
            >
              <p
                className="text-4xl font-bold mb-1 text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(90deg, #007f98, #f97316)",
                  fontFamily: "Georgia, serif",
                }}
              >
                {stat.value}
              </p>
              <p
                className="text-amber-800/60 text-sm"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SECTION 3 · Donation tiers — WARM DEEP ─────────────────────────── */}
      <section className="py-20" style={warmBgDeep}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2
              className="text-3xl md:text-4xl font-bold mb-3"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              Choose Your Impact
            </h2>
            <p
              className="text-base max-w-md mx-auto"
              style={{ fontFamily: "Georgia, serif", color: "#92400e" }}
            >
              Every amount makes a real difference. Pick what you can give
              today.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.label}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className={`relative rounded-3xl p-7 flex flex-col gap-5 border bg-white/70 backdrop-blur-sm shadow-sm ${
                  tier.featured
                    ? "border-orange-300 ring-2 ring-orange-200"
                    : "border-amber-100"
                }`}
              >
                {tier.featured && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white shadow-md"
                    style={{
                      background:
                        "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    Most Popular
                  </div>
                )}
                <div>
                  <p
                    className="text-xs font-semibold tracking-widest uppercase mb-2"
                    style={{ color: tier.accent, fontFamily: "Georgia, serif" }}
                  >
                    {tier.label}
                  </p>
                  <p
                    className="text-4xl font-bold"
                    style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
                  >
                    {tier.amount}
                  </p>
                  <p
                    className="text-sm mt-0.5"
                    style={{ fontFamily: "Georgia, serif", color: "#b45309" }}
                  >
                    {tier.usd} USD
                  </p>
                </div>
                <p
                  className="text-sm leading-relaxed flex-1"
                  style={{ fontFamily: "Georgia, serif", color: "#78350f" }}
                >
                  {tier.description}
                </p>
                <button
                  className="w-full py-3 rounded-full font-bold text-white text-sm hover:opacity-90 hover:scale-[1.02] transition-all duration-300 shadow-md"
                  style={{
                    background:
                      "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  Give {tier.amount}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Custom amount */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-3xl border border-amber-200 bg-white/60 backdrop-blur-sm p-7 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm"
          >
            <div>
              <p
                className="font-bold text-lg mb-1"
                style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
              >
                Give a Custom Amount
              </p>
              <p
                className="text-sm"
                style={{ fontFamily: "Georgia, serif", color: "#92400e" }}
              >
                Any amount, however small, moves the mission forward.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-52">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-base"
                  style={{ fontFamily: "Georgia, serif", color: "#b45309" }}
                >
                  ৳
                </span>
                <input
                  type="number"
                  placeholder="Enter amount"
                  className="w-full pl-9 pr-4 py-3 rounded-full bg-amber-50 border border-amber-200 text-sm placeholder:text-amber-300 focus:outline-none focus:border-orange-400 transition-colors"
                  style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
                />
              </div>
              <button
                className="px-6 py-3 rounded-full font-bold text-white text-sm hover:opacity-90 hover:scale-[1.02] transition-all duration-300 whitespace-nowrap shadow-md"
                style={{
                  background:
                    "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                  fontFamily: "Georgia, serif",
                }}
              >
                Donate
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 4 · How to pay overview — WHITE ────────────────────────── */}
      <section className="bg-white py-20 border-y border-amber-100">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-px w-8 bg-orange-400" />
              <span
                className="text-orange-500 text-xs font-semibold tracking-[0.2em] uppercase"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Payment Methods
              </span>
              <span className="h-px w-8 bg-orange-400" />
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: "Georgia, serif" }}
            >
              How to Send Your Gift
            </h2>
            <p
              className="text-gray-500 text-base max-w-lg mx-auto"
              style={{ fontFamily: "Georgia, serif" }}
            >
              We accept donations through these channels. Full bank details are
              listed below.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {paymentMethods.map((method, i) => (
              <motion.div
                key={method.name}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-2xl border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow duration-300"
                style={{ background: method.bg }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${method.color}18` }}
                >
                  <method.icon
                    className="w-5 h-5"
                    style={{ color: method.color }}
                  />
                </div>
                <div>
                  <p
                    className="text-gray-900 font-bold text-base mb-0.5"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {method.name}
                  </p>
                  <p className="text-gray-700 text-sm font-mono">
                    {method.detail}
                  </p>
                  <p
                    className="text-gray-400 text-xs mt-1"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {method.note}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust note */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="rounded-2xl border border-teal-100 bg-teal-50 p-6 flex items-start gap-4"
          >
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <p
              className="text-gray-600 text-sm leading-relaxed"
              style={{ fontFamily: "Georgia, serif" }}
            >
              After making your transfer, please send a screenshot of your
              transaction along with your name and contact number to our{" "}
              <span className="text-teal-600 font-semibold">Facebook page</span>{" "}
              or email us at{" "}
              <span className="text-orange-500 font-semibold">
                donate@1000mm.org.bd
              </span>
              . We will send you a donation receipt within 24 hours. All
              donations go directly toward missionary training, deployment, and
              field support.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 5 · Bank transfer details — WARM DEEP ──────────────────── */}
      <section className="py-20" style={warmBgDeep}>
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-px w-8 bg-orange-400" />
              <span
                className="text-orange-500 text-xs font-semibold tracking-[0.2em] uppercase"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Direct Bank Transfer
              </span>
              <span className="h-px w-8 bg-orange-400" />
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold mb-3"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              Bangladesh Adventist Union Mission
            </h2>
            <p
              className="text-base max-w-lg mx-auto"
              style={{ fontFamily: "Georgia, serif", color: "#92400e" }}
            >
              Send money directly to the Bangladesh Adventist Union Mission via
              bank transfer using the details below.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-3xl border border-amber-200 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden"
          >
            {bankDetails.map((row, i) => (
              <div
                key={row.label}
                className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 px-7 py-4 ${
                  i % 2 === 0 ? "bg-amber-50/60" : "bg-white/60"
                } ${i < bankDetails.length - 1 ? "border-b border-amber-100" : ""}`}
              >
                <span
                  className="text-xs font-semibold tracking-wide uppercase w-36 shrink-0 pt-0.5"
                  style={{ fontFamily: "Georgia, serif", color: "#b45309" }}
                >
                  {row.label}
                </span>
                <div className="flex items-center gap-1 flex-1">
                  <span
                    className="text-sm font-mono font-medium"
                    style={{ color: "#3b1f08" }}
                  >
                    {row.value}
                  </span>
                  {["Account No.", "Swift Code", "Routing No."].includes(
                    row.label,
                  ) && <CopyButton value={row.value} />}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 6 · General Conference / Check — WHITE ─────────────────── */}
      <section className="bg-white py-20 border-y border-amber-100">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-px w-8 bg-orange-400" />
              <span
                className="text-orange-500 text-xs font-semibold tracking-[0.2em] uppercase"
                style={{ fontFamily: "Georgia, serif" }}
              >
                International Donors
              </span>
              <span className="h-px w-8 bg-orange-400" />
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-3"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Donate via General Conference
            </h2>
            <p
              className="text-gray-500 text-base max-w-lg mx-auto"
              style={{ fontFamily: "Georgia, serif" }}
            >
              If you are outside Bangladesh and prefer to donate by check
              through the Seventh-day Adventist General Conference, follow the
              instructions below.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Check instructions card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-3xl border border-gray-100 bg-indigo-50/50 p-8 flex flex-col gap-5"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "#6366f118" }}
              >
                <Globe className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p
                  className="font-bold text-lg text-gray-900 mb-4"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Write Your Check As Follows
                </p>
                <div className="space-y-3">
                  <div className="rounded-xl bg-white border border-indigo-100 px-5 py-3">
                    <p
                      className="text-xs font-semibold tracking-widest uppercase text-indigo-400 mb-1"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      Pay To
                    </p>
                    <p
                      className="text-gray-900 font-semibold text-sm"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      Seventh-Day Adventist General Conference
                    </p>
                  </div>
                  <div className="rounded-xl bg-white border border-indigo-100 px-5 py-3">
                    <p
                      className="text-xs font-semibold tracking-widest uppercase text-indigo-400 mb-1"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      Memo
                    </p>
                    <div className="flex items-center gap-1">
                      <p className="text-gray-900 font-semibold text-sm font-mono">
                        BAUM 1000MM Project
                      </p>
                      <CopyButton value="BAUM 1000MM Project" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-3xl border border-amber-100 bg-amber-50/50 p-8 flex flex-col gap-5 justify-between"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "#f9731618" }}
              >
                <Phone className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p
                  className="font-bold text-lg text-gray-900 mb-2"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Need Help? Contact Us
                </p>
                <p
                  className="text-gray-500 text-sm leading-relaxed mb-5"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  For more information about how to support the 1000 Missionary
                  Movement Bangladesh, reach out to us directly.
                </p>
                <div className="flex flex-col gap-3">
                  <a
                    href="tel:+8801324333377"
                    className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold text-white text-sm hover:scale-[1.02] hover:shadow-lg transition-all duration-300"
                    style={{
                      background:
                        "linear-gradient(90deg, #007f98 0%, #0099b8 100%)",
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </span>
                    <div className="flex flex-col leading-tight">
                      <span className="text-white/60 text-[10px] uppercase tracking-widest font-normal">
                        Call Us
                      </span>
                      <span>+880 1324-333377</span>
                    </div>
                  </a>

                  <a
                    href="mailto:donate@1000mm.org.bd"
                    className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold text-white text-sm hover:scale-[1.02] hover:shadow-lg transition-all duration-300"
                    style={{
                      background:
                        "linear-gradient(90deg, #f97316 0%, #ea580c 100%)",
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </span>
                    <div className="flex flex-col leading-tight">
                      <span className="text-white/60 text-[10px] uppercase tracking-widest font-normal">
                        Email Us
                      </span>
                      <span>donate@1000mm.org.bd</span>
                    </div>
                  </a>
                </div>
              </div>
              <p
                className="text-gray-400 text-xs"
                style={{ fontFamily: "Georgia, serif" }}
              >
                We are happy to walk you through any payment method and confirm
                your donation reaches the right project.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 7 · Why give — WARM CREAM ──────────────────────────────── */}
      <section className="py-20" style={warmBg}>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-14 items-center">
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
                Where Your Gift Goes
              </span>
            </div>
            <h2
              className="text-3xl md:text-4xl font-bold mb-5 leading-snug"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              Your Money Does
              <br />
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(90deg, #007f98, #f97316)",
                }}
              >
                Eternal Work.
              </span>
            </h2>
            <p
              className="text-base leading-relaxed mb-7"
              style={{ fontFamily: "Georgia, serif", color: "#92400e" }}
            >
              1000MM Bangladesh operates on faith and community generosity.
              There are no foreign salaries, no overhead offices, no
              administration mark-ups. Every donation goes directly toward
              training and sustaining missionaries throughout their year of
              service.
            </p>
            <ul className="space-y-3">
              {whereItGoes.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm"
                  style={{ fontFamily: "Georgia, serif", color: "#78350f" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      background: "linear-gradient(90deg, #007f98, #f97316)",
                    }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Scripture card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative rounded-3xl p-8 overflow-hidden shadow-sm"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,237,213,0.9) 0%, rgba(254,243,199,0.9) 100%)",
              border: "1px solid rgba(251,191,36,0.3)",
            }}
          >
            <div
              className="text-8xl leading-none select-none mb-2 block"
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
              className="text-xl leading-relaxed italic mb-6"
              style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
            >
              Each of you should give what you have decided in your heart to
              give, not reluctantly or under compulsion, for God loves a
              cheerful giver.
            </p>
            <p
              className="text-sm"
              style={{ fontFamily: "Georgia, serif", color: "#b45309" }}
            >
              — 2 Corinthians 9:7
            </p>
            <div
              className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-30 blur-2xl pointer-events-none"
              style={{
                background: "radial-gradient(circle, #fbbf24, transparent 70%)",
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 8 · Final CTA — WHITE ───────────────────────────────────── */}
      <section className="bg-white py-20 border-t border-amber-100">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Heart
              className="w-8 h-8 mx-auto mb-5 text-orange-500"
              fill="currentColor"
            />
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Ready to Make an Eternal Impact?
            </h2>
            <p
              className="text-gray-500 text-base leading-relaxed mb-8 max-w-xl mx-auto"
              style={{ fontFamily: "Georgia, serif" }}
            >
              The harvest is plentiful, but the workers are few — and every
              worker needs support. Join thousands of partners who believe in
              this generation of missionaries.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#donate"
                className="px-8 py-4 rounded-full font-bold text-white text-base hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg"
                style={{
                  background:
                    "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                  fontFamily: "Georgia, serif",
                }}
              >
                Give Now
              </a>
              <Link
                href="/"
                className="px-8 py-4 rounded-full font-semibold text-gray-700 text-base border border-gray-200 hover:bg-amber-50 hover:border-amber-200 transition-all duration-300"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Learn About the Movement
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}
