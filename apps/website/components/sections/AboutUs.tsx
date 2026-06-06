"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen, Globe, Heart, Users } from "lucide-react";

const missions = [
  {
    icon: BookOpen,
    text: "Provide high-quality missionary training — spiritual, practical, and cultural.",
  },
  {
    icon: Globe,
    text: "Send trained missionaries to local and international mission fields.",
  },
  {
    icon: Heart,
    text: "Support them throughout their full one-year commitment.",
  },
  {
    icon: Users,
    text: "Inspire more young Adventists in Bangladesh to answer God's call for mission.",
  },
];

export default function AboutUs() {
  return (
    <section id="about-us" className="relative py-15 overflow-hidden bg-white">
      {/* Decorative side accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{
          background: "linear-gradient(180deg, #4ade80 0%, #f97316 100%)",
        }}
      />

      {/* Faint background text watermark */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 text-[20vw] font-bold text-stone-100 select-none pointer-events-none leading-none"
        style={{ fontFamily: "Georgia, serif" }}
        aria-hidden="true"
      >
        1000
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-10"
        >
          <span
            className="h-px w-12"
            style={{
              background: "linear-gradient(90deg, #007f98, #f97316)",
            }}
          />
          <span
            className="text-xs font-semibold tracking-[0.25em] uppercase text-orange-500"
            style={{ fontFamily: "Georgia, serif" }}
          >
            About Us
          </span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left column — Who We Are + What We Do */}
          <div className="space-y-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.7 }}
            >
              <h2
                className="text-4xl md:text-5xl font-bold text-stone-800 leading-tight mb-5"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Who{" "}
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                  }}
                >
                  We Are
                </span>
              </h2>
              <p
                className="text-stone-600 text-base md:text-lg leading-relaxed"
                style={{ fontFamily: "Georgia, serif" }}
              >
                The{" "}
                <span className="font-semibold text-stone-800">
                  1000 Missionary Movement Bangladesh
                </span>{" "}
                is a dynamic youth missionary program of the Seventh-day
                Adventist Church. We are committed to training, equipping, and
                sending young Bangladeshi believers to serve as full-time
                missionaries for one year.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              <p
                className="text-stone-600 text-base leading-relaxed"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Born out of a God-inspired vision to finish the work of the
                Gospel, we mobilize passionate young people willing to dedicate
                one year of their lives completely to Christ — reaching the
                unreached, planting churches, and sharing the love of Jesus
                across Bangladesh and to the ends of the earth.
              </p>
            </motion.div>

            {/* What We Do */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.7, delay: 0.25 }}
            >
              <h3
                className="text-xl font-bold text-stone-800 mb-4"
                style={{ fontFamily: "Georgia, serif" }}
              >
                What We Do in Bangladesh
              </h3>
              <p
                className="text-stone-600 text-base leading-relaxed mb-4"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Since our beginning, we have trained batches of young
                missionaries every year. Our missionaries conduct evangelistic
                meetings, health outreach, children&apos;s ministries, church
                planting, literature distribution, and community development —
                especially in rural and underserved areas.
              </p>
              <div
                className="inline-block px-5 py-3 rounded-xl text-sm font-semibold italic text-white shadow-md"
                style={{
                  background:
                    "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                }}
              >
                &ldquo;Once a Missionary, Always a Missionary.&rdquo;
              </div>
            </motion.div>
          </div>

          {/* Right column — Vision + Mission */}
          <div className="space-y-10">
            {/* Vision */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative rounded-3xl p-8 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #f0fdf4 0%, #fff7ed 100%)",
                border: "1px solid #d1fae5",
              }}
            >
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-20"
                style={{
                  background: "linear-gradient(135deg, #4ade80, #f97316)",
                }}
              />
              <h3
                className="text-xl font-bold text-stone-800 mb-3"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Our Vision
              </h3>
              <p
                className="text-stone-600 text-base leading-relaxed"
                style={{ fontFamily: "Georgia, serif" }}
              >
                To see thousands of young people from Bangladesh transformed
                into bold, Spirit-filled missionaries who hasten the soon return
                of our Lord Jesus Christ.
              </p>
            </motion.div>

            {/* Mission list */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <h3
                className="text-xl font-bold text-stone-800 mb-5"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Our Mission
              </h3>
              <div className="space-y-4">
                {missions.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ duration: 0.5, delay: 0.1 * i }}
                    className="flex items-start gap-4"
                  >
                    <div
                      className="mt-1 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{
                        background:
                          i % 2 === 0
                            ? "linear-gradient(135deg, #007f98, #4ade80)"
                            : "linear-gradient(135deg, #f97316, #fb923c)",
                      }}
                    >
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <p
                      className="text-stone-600 text-sm leading-relaxed pt-1"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {item.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-2"
            >
              <p
                className="text-stone-500 text-sm mb-4 italic"
                style={{ fontFamily: "Georgia, serif" }}
              >
                The harvest is great, but the laborers are few. Are you ready to
                answer the call?
              </p>
              <Link
                href="#how-to-join"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold text-white text-sm shadow-lg hover:scale-105 hover:shadow-orange-200 transition-all duration-300"
                style={{
                  background:
                    "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                }}
              >
                Apply Now
                <span aria-hidden="true">→</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
