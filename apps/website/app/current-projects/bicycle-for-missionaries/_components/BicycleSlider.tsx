// apps/website/app/current-projects/bicycle-for-missionaries/_components/BicycleSlider.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = { src: string; alt: string };

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0.4 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0.4 }),
};

export default function BicycleSlider({ images }: { images: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = images.length;

  const go = useCallback(
    (to: number, d: number) => {
      setDir(d);
      setIndex(((to % count) + count) % count);
    },
    [count],
  );

  const prev = () => go(index - 1, -1);
  const next = () => go(index + 1, 1);

  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setInterval(() => go(index + 1, 1), 5000);
    return () => clearInterval(t);
  }, [index, paused, count, go]);

  if (count === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border border-amber-100 shadow-lg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Stage */}
      <div className="relative aspect-[16/10] w-full bg-[#1c1206]">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={index}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "tween", duration: 0.5, ease: "easeInOut" as const },
              opacity: { duration: 0.3 },
            }}
            className="absolute inset-0"
          >
            <Image
              src={images[index].src}
              alt={images[index].alt}
              fill
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, 960px"
              className="object-cover object-center"
            />
            {/* Bottom gradient for legibility */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 45%)",
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Counter */}
        <div
          className="absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold text-white backdrop-blur-sm"
          style={{
            background: "rgba(0,0,0,0.35)",
            fontFamily: "Georgia, serif",
          }}
        >
          {index + 1} / {count}
        </div>

        {/* Arrows */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#3b1f08] shadow-md transition hover:scale-110 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#3b1f08] shadow-md transition hover:scale-110 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {count > 1 && (
        <div
          className="flex items-center justify-center gap-2 py-4"
          style={{ background: "#fffdf8" }}
        >
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i, i > index ? 1 : -1)}
              aria-label={`Go to image ${i + 1}`}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === index ? 26 : 8,
                background:
                  i === index
                    ? "linear-gradient(90deg, #007f98, #f97316)"
                    : "rgba(0,127,152,0.25)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
