"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    src: "/images/projects/groundbreaking-1.jpg",
    caption:
      "Groundbreaking ceremony, December 10, 2025 — BASC Campus, Bangladesh",
  },
  {
    src: "/images/projects/groundbreaking-2.jpg",
    caption:
      "Church leaders and mission partners gathered for the historic ceremony",
  },
  {
    src: "/images/projects/groundbreaking-3.jpg",
    caption: "Pastor Choon Ho Cho (Moses) leads the groundbreaking service",
  },
  {
    src: "/images/projects/groundbreaking-4.jpg",
    caption: "BAUM leadership and Korean partners join in the celebration",
  },
];

const AUTOPLAY_MS = 2500;

export default function GroundbreakingSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = slides.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = () => setCurrent((c) => (c - 1 + total) % total);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, next]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="rounded-3xl overflow-hidden shadow-lg border border-amber-100 relative"
      style={{ aspectRatio: "4/3" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={slides[current].src}
            alt={slides[current].caption}
            fill
            className="object-cover object-center"
          />
        </motion.div>
      </AnimatePresence>

      {/* Prev button */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all duration-200"
        style={{ background: "rgba(0,0,0,0.38)", backdropFilter: "blur(6px)" }}
        aria-label="Previous photo"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Next button */}
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all duration-200"
        style={{ background: "rgba(0,0,0,0.38)", backdropFilter: "blur(6px)" }}
        aria-label="Next photo"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Caption + dots row */}
      <div
        className="absolute bottom-0 left-0 right-0 px-5 py-3 z-10 flex items-end justify-between gap-3"
        style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(4px)" }}
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={current}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="text-white/85 text-xs italic flex-1"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {slides[current].caption}
          </motion.p>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5 shrink-0">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrent(i);
                setPaused(true);
                setTimeout(() => setPaused(false), 8000);
              }}
              aria-label={`Go to photo ${i + 1}`}
            >
              <span
                className="block rounded-full transition-all duration-300"
                style={{
                  width: i === current ? "18px" : "6px",
                  height: "6px",
                  background:
                    i === current
                      ? "linear-gradient(90deg, #007f98, #f97316)"
                      : "rgba(255,255,255,0.4)",
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      {!paused && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 z-10">
          <motion.div
            key={`bar-${current}`}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
            className="h-full"
            style={{ background: "linear-gradient(90deg, #007f98, #f97316)" }}
          />
        </div>
      )}
    </motion.div>
  );
}
