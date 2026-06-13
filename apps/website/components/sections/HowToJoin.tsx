"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  FileDown,
  ClipboardCheck,
  UserCheck,
  Send,
  CheckCircle2,
  Download,
  ExternalLink,
} from "lucide-react";

import Link from "next/link";

const steps = [
  {
    number: "01",
    icon: FileDown,
    title: "Download Requirements",
    description:
      "Download all the required documents. Review the qualifications and prepare everything you need before proceeding.",
    href: "/documents", // ← links to the documents page
  },
  {
    number: "02",
    icon: ClipboardCheck,
    title: "Check & Prepare Documents",
    description:
      "Go through each document carefully. Make sure all photocopies, IDs, and certificates are complete and ready for submission.",
    href: null,
  },
  {
    number: "03",
    icon: UserCheck,
    title: "Fill Up the Bio Data Form",
    description:
      "Complete your Bio-Data Form online. Download it once filled and keep it ready alongside your other documents.",
    href: null,
  },
  {
    number: "04",
    icon: Send,
    title: "Submit Your Application",
    description:
      "Fill out and submit the Application Form online. This is your official step into the 1000 Missionary Movement.",
    href: null,
  },
];

const downloadableFiles = [
  { label: "Letter of Intent", file: "letter-of-intent.pdf" },
  { label: "Parent's Consent", file: "parents-consent.pdf" },
  { label: "Sworn Statement", file: "sworn-statement.pdf" },
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
    hasDownloads: true, // ← triggers the download buttons
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

function RequirementCard({
  item,
  index,
}: {
  item: (typeof accordionItems)[0];
  index: number;
}) {
  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 bg-white shadow-sm">
      {/* Card header */}
      <div
        className="px-6 py-4 flex items-center gap-3 border-b border-stone-100"
        style={{
          background:
            index % 2 === 0
              ? "linear-gradient(135deg, rgba(22,163,74,0.06) 0%, rgba(249,115,22,0.04) 100%)"
              : "linear-gradient(135deg, rgba(249,115,22,0.06) 0%, rgba(22,163,74,0.04) 100%)",
        }}
      >
        <span
          className="text-sm font-bold"
          style={{
            background: "linear-gradient(90deg, #16a34a, #f97316)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
            display: "inline-block",
          }}
        >
          {item.icon}
        </span>
        <span
          className="font-bold text-stone-800 text-sm md:text-base"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {item.title}
        </span>
      </div>

      {/* Card body */}
      <div className="px-6 py-5">
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

        {/* Download buttons — only on the "Download, Accomplish & Submit" card */}
        {item.hasDownloads && (
          <div className="mt-5 space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Download forms directly
            </p>
            {downloadableFiles.map((doc) => (
              <a
                key={doc.file}
                href={`/downloads/${doc.file}`}
                download={doc.file}
                className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 px-4 py-2.5 text-sm transition-colors hover:border-teal-200 hover:bg-teal-50 group/dl"
              >
                <span
                  className="font-medium text-stone-700 group-hover/dl:text-teal-800"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {doc.label}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 group-hover/dl:text-teal-700">
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </span>
              </a>
            ))}

            {/* Link to full documents page */}
            <Link
              href="/documents"
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-700 transition-colors"
              style={{ fontFamily: "Georgia, serif" }}
            >
              <ExternalLink className="h-3 w-3" />
              View all documents
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HowToJoin() {
  return (
    <section
      id="how-to-join"
      className="relative py-15 overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0a1a0f 0%, #4e392a 100%)",
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
          className="text-center mb-15"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span
              className="h-px w-12"
              style={{
                background: "linear-gradient(90deg, transparent, #007f98)",
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
                  "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-15">
          {steps.map((step, i) => {
            const card = (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.1 }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className={`relative rounded-3xl p-6 flex flex-col gap-4 overflow-hidden group transition-all duration-300 ${
                  step.href ? "cursor-pointer hover:scale-[1.02]" : ""
                }`}
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                  border: step.href
                    ? "1px solid rgba(249,115,22,0.35)"
                    : "1px solid rgba(255,255,255,0.08)",
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

                {/* CTA hint on step 01 */}
                {step.href && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400 group-hover:text-orange-300 transition-colors"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    <Download className="w-3 h-3" />
                    Download forms →
                  </span>
                )}

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
            );

            return step.href ? (
              <Link key={step.number} href={step.href}>
                {card}
              </Link>
            ) : (
              card
            );
          })}
        </div>

        {/* Cards grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          <p
            className="text-white/40 text-xs tracking-[0.2em] uppercase text-center mb-6"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Everything you need to know
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accordionItems.map((item, index) => (
              <RequirementCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </motion.div>

        <div className="flex justify-center mt-10">
          <Link
            href="/become-a-trainer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-white text-sm hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg"
            style={{
              background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
              fontFamily: "Georgia, serif",
            }}
          >
            Become a Trainer
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
