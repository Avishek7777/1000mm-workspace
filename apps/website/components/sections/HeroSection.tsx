"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with fallback pattern */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-bg.png"
          alt="Missionaries in Bangladesh"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Fallback geometric pattern — shows behind/over broken image */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(-135deg, #007f98 0%, #0099b8 30%, #c2410c 70%, #7c2d12 100%)",
            mixBlendMode: "multiply", // ← blends with the image instead of covering it
            opacity: 0.7,
          }}
        />
        {/* SVG cross-hatch pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Dark gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Eyebrow label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 mb-6"
        >
          <span className="h-px w-10 bg-orange-400" />
          <span
            className="text-orange-300 text-sm font-semibold tracking-[0.2em] uppercase"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Bangladesh · 1992 – 2026
          </span>
          <span className="h-px w-10 bg-orange-400" />
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-6"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Answer the Call,
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #4ade80 0%, #f97316 100%)",
            }}
          >
            Join the Movement.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
          style={{ fontFamily: "Georgia, serif" }}
        >
          The 1000 Missionary Movement is a bold initiative of the{" "}
          <span className="text-orange-300 font-semibold">
            Seventh-day Adventist Church
          </span>{" "}
          raising up committed young believers to carry the Gospel across
          Bangladesh and beyond. We are looking for passionate, dedicated
          individuals ready to serve.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            href="#how-to-join"
            className="px-8 py-4 rounded-full font-bold text-white text-base shadow-xl hover:shadow-orange-500/30 hover:scale-105 transition-all duration-300"
            style={{
              background: "linear-gradient(90deg, #16a34a 0%, #f97316 100%)",
            }}
          >
            Apply Now
          </Link>
          <Link
            href="#about-us"
            className="px-8 py-4 rounded-full font-semibold text-white text-base border border-white/40 hover:bg-white/10 hover:border-white/70 transition-all duration-300 backdrop-blur-sm"
          >
            Learn More
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/40 text-xs tracking-widest uppercase">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent"
          />
        </motion.div>
      </div>
    </section>
  );
}
