"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  FileDown,
  ClipboardCheck,
  UserCheck,
  Send,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileDown,
    title: "Download Requirements",
    description:
      "Download all the required documents. Review the qualifications and prepare everything you need before proceeding.",
  },
  {
    number: "02",
    icon: ClipboardCheck,
    title: "Check & Prepare Documents",
    description:
      "Go through each document carefully. Make sure all photocopies, IDs, and certificates are complete and ready for submission.",
  },
  {
    number: "03",
    icon: UserCheck,
    title: "Fill Up the Bio Data Form",
    description:
      "Complete your Bio-Data Form online. Download it once filled and keep it ready alongside your other documents.",
  },
  {
    number: "04",
    icon: Send,
    title: "Submit Your Application",
    description:
      "Fill out and submit the Application Form online. This is your official step into the 1000 Missionary Movement.",
  },
];

const accordionItems = [
  {
    id: "qualifications",
    title: "Qualifications",
    icon: "✦",
    items: [
      "16–45 years old, single",
      "Active Adventist member for at least 1 year",
      "Mission-driven with initiative",
      "Fit to work, no major health concerns",
      "Willing to work outside of comfort zone",
      "Team-player and able to work under pressure",
      "Able to communicate in vernacular, native, and basic English",
      "Motivated to work even without allowance",
    ],
  },
  {
    id: "documents",
    title: "Required Documents",
    icon: "✦",
    items: [
      "Photocopy of Authenticated Birth Certificate",
      "Photocopy (both sides) of two valid IDs: National ID, Parents NID, Educational certificate (SSC/HSC/Degree), or Baptism Certificate",
      "District Pastor Recommendation Letter with Character Certificate",
    ],
  },
  {
    id: "download",
    title: "Download, Accomplish & Submit",
    icon: "✦",
    items: [
      "Parents' Consent (candidates below 21 years old only)",
      "Mission/Conference Secretary Recommendation Letter (upload online)",
      "Bio-Data Form (fill out online and download)",
      "Application Form (fill out online and submit)",
      "Letter of Intent/Commitment",
      "Sworn Statement and Undertaking",
    ],
  },
  {
    id: "bring",
    title: "Things to Bring",
    icon: "✦",
    items: [
      "Required documents for verification purposes",
      "Bengali & English Bible (NKJV preferred)",
      "Sleeping bag / blanket",
      "Casual/Working dress & Sportswear with running shoes",
      "First-aid kit (if available)",
      "Musical instrument (if available)",
    ],
  },
];

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: (typeof accordionItems)[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`rounded-2xl overflow-hidden border transition-all duration-300 ${
        isOpen
          ? "border-green-200 shadow-md"
          : "border-stone-200 hover:border-stone-300"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-stone-50 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-bold"
            style={{
              background: "linear-gradient(90deg, #16a34a, #f97316)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {item.icon}
          </span>
          <span
            className="font-semibold text-stone-800 text-sm md:text-base"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {item.title}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-4 h-4 text-stone-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 pt-1 bg-white border-t border-stone-100">
              <ul className="space-y-2">
                {item.items.map((text, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span
                      className="text-stone-600 text-sm leading-relaxed"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HowToJoin() {
  const [openId, setOpenId] = useState<string | null>("qualifications");

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="how-to-join"
      className="relative py-28 overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0a1a0f 0%, #1c1008 100%)",
      }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0v60M0 30h60' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(249,115,22,0.25) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span
              className="h-px w-12"
              style={{
                background: "linear-gradient(90deg, transparent, #4ade80)",
              }}
            />
            <span
              className="text-xs font-semibold tracking-[0.25em] uppercase text-green-400"
              style={{ fontFamily: "Georgia, serif" }}
            >
              How to Join
            </span>
            <span
              className="h-px w-12"
              style={{
                background: "linear-gradient(90deg, #f97316, transparent)",
              }}
            />
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Be a Missionary.{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #4ade80 0%, #f97316 100%)",
              }}
            >
              Join the Movement.
            </span>
          </h2>
          <p
            className="text-white/50 text-base max-w-md mx-auto"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Four simple steps stand between you and one year that will change
            your life forever.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="relative rounded-3xl p-6 flex flex-col gap-4 overflow-hidden group"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {/* Step number watermark */}
              <div
                className="absolute -top-3 -right-2 text-7xl font-bold text-white/[0.04] select-none leading-none"
                style={{ fontFamily: "Georgia, serif" }}
                aria-hidden="true"
              >
                {step.number}
              </div>

              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background:
                    i % 2 === 0
                      ? "linear-gradient(135deg, #16a34a, #4ade80)"
                      : "linear-gradient(135deg, #f97316, #fb923c)",
                }}
              >
                <step.icon className="w-5 h-5 text-white" />
              </div>

              {/* Text */}
              <div>
                <p
                  className="text-white font-bold text-base mb-1"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {step.title}
                </p>
                <p
                  className="text-white/50 text-sm leading-relaxed"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {step.description}
                </p>
              </div>

              {/* Connector arrow — not on last */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white/30 text-xs"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    →
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-3"
        >
          <p
            className="text-white/40 text-xs tracking-[0.2em] uppercase text-center mb-6"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Everything you need to know
          </p>
          {accordionItems.map((item) => (
            <AccordionItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
