// apps/website/app/_components/sections/ContactUsClient.tsx
"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

type Program = {
  id: string;
  title: string;
  category: string;
  startDate: string;
  endDate: string;
  location: string | null;
};

function formatDateRange(start: Date, end: Date): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${e.toLocaleDateString("en-GB", opts)}`;
  }
  return `${s.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("en-GB", opts)}`;
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    SPIRITUAL: "Spiritual",
    PHYSICAL: "Physical",
    MENTAL: "Mental",
    SOCIAL: "Social",
  };
  return map[cat] ?? cat;
}

function programStatus(
  start: Date,
  end: Date,
): "Upcoming" | "Active" | "Completed" {
  const now = new Date();
  if (new Date(end) < now) return "Completed";
  if (new Date(start) <= now) return "Active";
  return "Upcoming";
}

const STATUS_COLOR: Record<string, string> = {
  Active: "#16a34a",
  Upcoming: "#007f98",
  Completed: "#78716c",
};

const staticInfo = [
  {
    icon: MapPin,
    title: "Address",
    lines: [
      "1000 Missionary Movement",
      "Seventh-day Adventist Church of Bangladesh",
      "149 Shah Ali Bagh, Mirpur-1, Dhaka-1216",
      "GPO Box 80, Dhaka 1000",
    ],
    gradient: "linear-gradient(135deg, #16a34a, #4ade80)",
  },
  {
    icon: Phone,
    title: "Contact",
    lines: ["+880 1324-333377", "info@1000mm.org.bd", "www.1000mm.org.bd"],
    gradient: "linear-gradient(135deg, #f97316, #fb923c)",
  },
];

export default function ContactUsClient({ programs }: { programs: Program[] }) {
  const allInfo = [
    ...staticInfo,
    {
      icon: Calendar,
      title: "Training Schedules",
      gradient: "linear-gradient(135deg, #16a34a, #f97316)",
      programs,
    },
  ];

  return (
    <section
      id="contact"
      className="relative py-10 overflow-hidden bg-stone-50"
    >
      {/* Decorative top border */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: "linear-gradient(90deg, #4ade80 0%, #f97316 100%)",
        }}
      />

      {/* Background watermark */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-bold select-none pointer-events-none leading-none opacity-[0.03] text-stone-400"
        style={{ fontFamily: "Georgia, serif" }}
        aria-hidden="true"
      >
        CONTACT
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <span
              className="h-px w-12"
              style={{ background: "linear-gradient(90deg, #16a34a, #f97316)" }}
            />
            <span
              className="text-xs font-semibold tracking-[0.25em] uppercase text-orange-500"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Get in Touch
            </span>
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-stone-800 leading-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Contact{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
              }}
            >
              Us
            </span>
          </h2>
        </motion.div>

        {/* 3-column info grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {allInfo.map((info, i) => (
            <motion.div
              key={info.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="relative rounded-3xl p-7 bg-white border border-stone-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group"
            >
              <div
                className="absolute top-0 right-0 w-20 h-20 rounded-bl-3xl rounded-tr-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                style={{ background: info.gradient }}
              />
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 shadow-sm"
                style={{ background: info.gradient }}
              >
                <info.icon className="w-5 h-5 text-white" />
              </div>
              <h3
                className="font-bold text-stone-800 text-base mb-3"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {info.title}
              </h3>

              {"lines" in info && (
                <div className="space-y-1">
                  {info.lines.map((line, j) => (
                    <p
                      key={j}
                      className="text-stone-500 text-sm leading-relaxed"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              )}

              {"programs" in info && (
                <div className="h-25 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
                  {info.programs.length === 0 ? (
                    <p
                      className="text-stone-400 text-sm italic"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      No upcoming programs scheduled.
                    </p>
                  ) : (
                    info.programs.map((p) => {
                      const status = programStatus(
                        new Date(p.startDate),
                        new Date(p.endDate),
                      );
                      return (
                        <div
                          key={p.id}
                          className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2.5"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p
                              className="text-xs font-bold text-stone-700 leading-snug flex-1"
                              style={{ fontFamily: "Georgia, serif" }}
                            >
                              {p.title}
                            </p>
                            <span
                              className="mt-0.5 flex-shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                              style={{ background: STATUS_COLOR[status] }}
                            >
                              <span className="h-1 w-1 rounded-full bg-white/70" />
                              {status}
                            </span>
                          </div>
                          <p
                            className="text-xs text-stone-500 flex items-center gap-1"
                            style={{ fontFamily: "Georgia, serif" }}
                          >
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            {formatDateRange(
                              new Date(p.startDate),
                              new Date(p.endDate),
                            )}
                          </p>
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{
                                background: "rgba(0,127,152,0.08)",
                                color: "#007f98",
                                fontFamily: "Georgia, serif",
                              }}
                            >
                              {categoryLabel(p.category)}
                            </span>
                            {p.location && (
                              <span
                                className="text-[10px] text-stone-400 flex items-center gap-0.5"
                                style={{ fontFamily: "Georgia, serif" }}
                              >
                                <MapPin className="h-2.5 w-2.5" />
                                {p.location}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA — link to full contact page */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center"
        >
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-white text-sm hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-lg"
            style={{
              background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
              fontFamily: "Georgia, serif",
            }}
          >
            Send us a Message
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
