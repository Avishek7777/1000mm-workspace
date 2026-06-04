"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: 83583, label: "Baptisms", prefix: "", suffix: "+" },
  { value: 1501, label: "Congregations Established", prefix: "", suffix: "+" },
  { value: 863, label: "Churches Built", prefix: "", suffix: "+" },
  { value: 66, label: "Countries Involved", prefix: "", suffix: "" },
  {
    value: 47,
    label: "Countries Receiving Missionaries",
    prefix: "",
    suffix: "",
  },
  {
    value: 12287,
    label: "Missionaries Trained & Sent",
    prefix: "",
    suffix: "+",
  },
];

function useCountUp(target: number, duration: number, active: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = 0;
    const stepTime = 16;
    const steps = Math.ceil(duration / stepTime);
    const increment = target / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [active, target, duration]);

  return count;
}

function StatCard({
  stat,
  index,
  active,
}: {
  stat: (typeof stats)[0];
  index: number;
  active: boolean;
}) {
  const count = useCountUp(stat.value, 2000, active);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.1 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative group flex flex-col items-center justify-center text-center p-8 rounded-3xl overflow-hidden"
      style={{
        background:
          index % 2 === 0
            ? "linear-gradient(135deg, rgba(22,163,74,0.12) 0%, rgba(249,115,22,0.08) 100%)"
            : "linear-gradient(135deg, rgba(249,115,22,0.10) 0%, rgba(22,163,74,0.08) 100%)",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Glow orb */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500"
        style={{
          background:
            index % 2 === 0
              ? "radial-gradient(circle, #4ade80, transparent)"
              : "radial-gradient(circle, #f97316, transparent)",
        }}
      />

      {/* Number */}
      <div
        className="text-5xl md:text-6xl font-bold mb-2 tabular-nums"
        style={{
          fontFamily: "Georgia, serif",
          background:
            index % 2 === 0
              ? "linear-gradient(135deg, #4ade80, #16a34a)"
              : "linear-gradient(135deg, #f97316, #ea580c)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {stat.prefix}
        {count.toLocaleString()}
        {stat.suffix}
      </div>

      {/* Label */}
      <p
        className="text-white/70 text-sm font-medium tracking-wide leading-snug max-w-[140px]"
        style={{ fontFamily: "Georgia, serif" }}
      >
        {stat.label}
      </p>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-12 rounded-full opacity-60 group-hover:w-20 transition-all duration-500"
        style={{
          background:
            index % 2 === 0
              ? "linear-gradient(90deg, #4ade80, #f97316)"
              : "linear-gradient(90deg, #f97316, #4ade80)",
        }}
      />
    </motion.div>
  );
}

export default function StatisticsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="relative py-28 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0a1a0f 0%, #1a0f05 50%, #0d1a0a 100%)",
      }}
    >
      {/* Background cross pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0v40M0 20h40' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial glow centre */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(22,163,74,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
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
              By the Numbers
            </span>
            <span
              className="h-px w-12"
              style={{
                background: "linear-gradient(90deg, #f97316, transparent)",
              }}
            />
          </div>

          <h2
            className="text-4xl md:text-5xl font-bold text-white leading-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            34 Years of{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #4ade80 0%, #f97316 100%)",
              }}
            >
              Faithful Service
            </span>
          </h2>
          <p
            className="text-white/50 mt-3 text-base max-w-md mx-auto"
            style={{ fontFamily: "Georgia, serif" }}
          >
            From 1992 to 2026 — God&apos;s faithfulness in numbers.
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {stats.map((stat, i) => (
            <StatCard
              key={stat.label}
              stat={stat}
              index={i}
              active={isInView}
            />
          ))}
        </div>

        {/* Bottom Scripture */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center text-white/30 text-sm italic mt-14"
          style={{ fontFamily: "Georgia, serif" }}
        >
          &ldquo;The harvest is plentiful, but the laborers are few.&rdquo; —
          Matthew 9:37
        </motion.p>
      </div>
    </section>
  );
}
