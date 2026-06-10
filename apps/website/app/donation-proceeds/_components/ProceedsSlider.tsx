"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const proceeds = [
  {
    icon: "📖",
    title: "Training Expenses",
    body: "Your contribution helps provide essential training for our missionaries, equipping them to serve effectively and fulfill God's calling. We are deeply grateful for your partnership in this mission.",
    image: "/images/proceeds/training.jpg", // replace with real image
  },
  {
    icon: "🍽️",
    title: "Cafeteria Food",
    body: "Our missionaries are called by God, and it is our privilege to serve those who serve Him. Throughout their training, the campus cafeteria provides breakfast, lunch, and dinner — made possible through the generous support of donors and sending missionaries.",
    image: "/images/proceeds/cafeteria.jpg",
  },
  {
    icon: "🌍",
    title: "Missionaries' Stipends & Fares",
    body: "Your contribution helps provide missionaries with their stipends and travel expenses, enabling them to continue serving faithfully in the mission field. We are deeply grateful for your partnership in advancing God's work.",
    image: "/images/proceeds/stipends.jpg",
  },
  {
    icon: "🏗️",
    title: "Campus Facilities Repair",
    body: "Your contribution helps repair and improve essential campus facilities, including dormitories, toilets, and ceilings, creating a safer and more comfortable environment for our missionaries in training.",
    image: "/images/proceeds/facilities.jpg",
  },
];

const AUTOPLAY_MS = 5000;

export default function ProceedsSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = proceeds.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = () => setCurrent((c) => (c - 1 + total) % total);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, next]);

  return (
    <section className="bg-white py-20 border-y border-amber-100">
      <div className="max-w-5xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2
            className="text-2xl md:text-3xl font-bold"
            style={{ fontFamily: "Georgia, serif", color: "#3b1f08" }}
          >
            Where Every Taka Goes
          </h2>
        </motion.div>

        {/* Slider */}
        <div
          className="relative rounded-3xl overflow-hidden shadow-xl"
          style={{ aspectRatio: "16/7" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Slides */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              {/* Background image */}
              <Image
                src={proceeds[current].image}
                alt={proceeds[current].title}
                fill
                className="object-cover object-center"
                priority={current === 0}
              />

              {/* Dark gradient overlay — bottom-heavy for text legibility */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.15) 100%)",
                }}
              />

              {/* Text content */}
              <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
                {/* Icon + title row */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="flex items-center gap-3 mb-3"
                >
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    {proceeds[current].icon}
                  </span>
                  <h3
                    className="text-xl md:text-2xl font-bold text-white uppercase tracking-wide"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    {proceeds[current].title}
                  </h3>
                </motion.div>

                {/* Body text */}
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.28 }}
                  className="text-white/80 text-sm md:text-base leading-relaxed max-w-2xl"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {proceeds[current].body}
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Prev button */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 z-10"
            style={{
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(6px)",
            }}
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Next button */}
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 z-10"
            style={{
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(6px)",
            }}
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Progress bar */}
          {!paused && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-10">
              <motion.div
                key={`bar-${current}`}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                className="h-full"
                style={{
                  background: "linear-gradient(90deg, #007f98, #f97316)",
                }}
              />
            </div>
          )}
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2.5 mt-6">
          {proceeds.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrent(i);
                setPaused(true);
                setTimeout(() => setPaused(false), 8000);
              }}
              className="transition-all duration-300"
              aria-label={`Go to slide ${i + 1}`}
            >
              <span
                className="block rounded-full transition-all duration-300"
                style={{
                  width: i === current ? "28px" : "8px",
                  height: "8px",
                  background:
                    i === current
                      ? "linear-gradient(90deg, #007f98, #f97316)"
                      : "#fcd9a8",
                }}
              />
            </button>
          ))}
        </div>

        {/* Slide counter */}
        <p
          className="text-center text-xs text-amber-400 mt-3"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {current + 1} / {total}
        </p>
      </div>
    </section>
  );
}
