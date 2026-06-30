"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProjectImageSlider({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = images.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = () => setCurrent((c) => (c - 1 + total) % total);

  useEffect(() => {
    if (paused || total <= 1) return;
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [paused, next, total]);

  return (
    <div
      className="relative h-[60vh] min-h-[420px] w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <Image
            src={images[current]}
            alt={`${title} — image ${current + 1}`}
            fill
            className="object-cover object-center"
            priority={current === 0}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%)",
        }}
      />

      {/* Prev / Next */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full text-white transition-all hover:scale-110"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full text-white transition-all hover:scale-110"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots + counter */}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setPaused(true); setTimeout(() => setPaused(false), 6000); }}
              aria-label={`Image ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? "22px" : "7px",
                height: "7px",
                background: i === current
                  ? "linear-gradient(90deg,#007f98,#f97316)"
                  : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
          <span className="ml-1 text-[10px] font-semibold text-white/60">
            {current + 1}/{total}
          </span>
        </div>
      )}
    </div>
  );
}
