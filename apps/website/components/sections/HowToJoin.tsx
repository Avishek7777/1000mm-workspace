"use client";

import { motion } from "framer-motion";
import { ClipboardCheck, UserCheck, Send, ExternalLink } from "lucide-react";

import Link from "next/link";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://portal.1000mm.org.bd";

const steps = [
  {
    number: "01",
    icon: ClipboardCheck,
    title: "Check & Prepare Documents",
    description:
      "Go through each required document carefully. Make sure all photocopies, IDs, and certificates are complete and ready for submission.",
    href: "/documents",
    ctaLabel: "View Requirements →",
    primary: false,
  },
  {
    number: "02",
    icon: UserCheck,
    title: "Fill Up the Bio Data Form",
    description:
      "Complete your Bio-Data Form online. Download it once filled and keep it ready alongside your other documents.",
    href: null,
    ctaLabel: null,
    primary: false,
  },
  {
    number: "03",
    icon: Send,
    title: "Submit Your Application",
    description:
      "Fill out and submit the Application Form online. This is your official step into the 1000 Missionary Movement.",
    href: null,
    ctaLabel: null,
    primary: true,
  },
];

export default function HowToJoin() {
  return (
    <section
      id="how-to-join"
      className="relative py-10 pt-20 overflow-hidden"
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
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span
              className="h-px w-12"
              style={{
                background: "linear-gradient(90deg, transparent, #007f98)",
              }}
            />
            <span className="text-xs font-semibold tracking-[0.25em] uppercase text-green-400">
              How to Join
            </span>
            <span
              className="h-px w-12"
              style={{
                background: "linear-gradient(90deg, #f97316, transparent)",
              }}
            />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
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
          <p className="text-white/50 text-base max-w-md mx-auto">
            Three simple steps stand between you and one year that will change
            your life forever.
          </p>
        </motion.div>

        {/* Steps — 3 col on desktop, centred */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="relative rounded-3xl p-6 flex flex-col gap-4 overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {/* Step number watermark */}
              <div
                className="font-heading absolute -top-3 -right-2 text-7xl font-bold text-white/[0.04] select-none leading-none"
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
              <div className="flex-1">
                <p className="font-heading text-white font-bold text-base mb-1">
                  {step.title}
                </p>
                <p className="text-white/50 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-2 mt-1">
                {step.href &&
                  step.ctaLabel &&
                  (step.primary ? (
                    <Link
                      href={step.href}
                      target={
                        step.href.startsWith("http") ? "_blank" : undefined
                      }
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-white text-sm shadow-lg hover:opacity-90 hover:scale-105 transition-all duration-300 w-fit"
                      style={{
                        background:
                          "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                      }}
                    >
                      {step.ctaLabel}
                      <span aria-hidden="true">→</span>
                    </Link>
                  ) : (
                    <Link
                      href={step.href}
                      target={
                        step.href.startsWith("http") ? "_blank" : undefined
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {step.ctaLabel}
                    </Link>
                  ))}
              </div>

              {/* Connector arrow — not on last */}
              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
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
      </div>
    </section>
  );
}
