"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AUTOPLAY_MS = 5000;

export default function ProjectImageSlider({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const total = images.length;

  const go = useCallback(
    (index: number, dir: number) => {
      setDirection(dir);
      setCurrent(((index % total) + total) % total);
    },
    [total],
  );
  const next = useCallback(() => go(current + 1, 1), [current, go]);
  const prev = useCallback(() => go(current - 1, -1), [current, go]);

  // Autoplay
  useEffect(() => {
    if (paused || total <= 1) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, next, total]);

  // Keyboard arrows
  useEffect(() => {
    if (total <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, total]);

  return (
    <div
      className="relative h-[72vh] min-h-[520px] w-full overflow-hidden bg-stone-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        if (touchX.current != null) {
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (dx < -40) next();
          else if (dx > 40) prev();
        }
        touchX.current = null;
        setPaused(false);
      }}
    >
      {/* Slides — directional slide + fade, with a slow Ken Burns drift */}
      <AnimatePresence mode="sync" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          initial={{ opacity: 0, x: 60 * direction }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 * direction }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: 1.07 }}
            transition={{ duration: AUTOPLAY_MS / 1000 + 1.5, ease: "linear" }}
            className="absolute inset-0"
          >
            <Image
              src={images[current]}
              alt={`${title} — photo ${current + 1}`}
              fill
              className="object-cover object-center"
              priority={current === 0}
              sizes="100vw"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay for hero text legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%)",
        }}
      />

      {/* Autoplay progress — brand gradient, top edge */}
      {total > 1 && !paused && (
        <div className="absolute left-0 right-0 top-0 z-10 h-0.5 bg-white/10">
          <motion.div
            key={`bar-${current}`}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
            className="h-full"
            style={{ background: "linear-gradient(90deg,#007f98,#f97316)" }}
          />
        </div>
      )}

      {/* Prev / Next */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition-all hover:scale-110 hover:border-white/30"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition-all hover:scale-110 hover:border-white/30"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
            aria-label="Next photo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Thumbnail rail — all photos at a glance (desktop) */}
      {total > 1 && (
        <div className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-2 md:flex">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => {
                go(i, i > current ? 1 : -1);
                setPaused(true);
                setTimeout(() => setPaused(false), 6000);
              }}
              aria-label={`Show photo ${i + 1}`}
              className={`relative h-12 w-16 overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                i === current
                  ? "scale-105 border-orange-400 shadow-lg shadow-black/40"
                  : "border-white/20 opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                className="object-cover object-center"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Dots + counter (mobile) */}
      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 md:hidden">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                go(i, i > current ? 1 : -1);
                setPaused(true);
                setTimeout(() => setPaused(false), 6000);
              }}
              aria-label={`Photo ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? "22px" : "7px",
                height: "7px",
                background:
                  i === current
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

      {/* Photo counter (desktop, pairs with the thumbnail rail) */}
      {total > 1 && (
        <span className="absolute right-4 top-4 z-10 hidden rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-sm md:inline">
          {current + 1} / {total}
        </span>
      )}
    </div>
  );
}
