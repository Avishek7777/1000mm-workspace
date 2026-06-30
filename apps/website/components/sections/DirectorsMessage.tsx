"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function DirectorsMessage() {
  return (
    <section className="relative py-10 overflow-hidden bg-stone-50">
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M40 0v80M0 40h80' stroke='%23000' stroke-width='0.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <span
            className="h-px w-12"
            style={{ background: "linear-gradient(90deg, #16a34a, #f97316)" }}
          />
          <span
            className="text-xs font-semibold tracking-[0.25em] uppercase text-orange-500"
            style={{ fontFamily: "Georgia, serif" }}
          >
            A Word from Leadership
          </span>
          <span
            className="h-px w-12"
            style={{ background: "linear-gradient(90deg, #16a34a, #f97316)" }}
          />
        </motion.div>

        {/* Text block — full width */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="flex flex-col items-center text-center"
        >
          <h2
            className="text-4xl md:text-5xl font-semibold text-stone-700 leading-tight mb-8"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Message from&nbsp;
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
              }}
            >
              the Director
            </span>
          </h2>

          <div
            className="text-stone-600 text-base md:text-lg leading-relaxed space-y-5 max-w-4xl text-justify"
            style={{ fontFamily: "Georgia, serif" }}
          >
            <p>
              Dear Brothers and Sisters in Christ, It is a great joy to serve
              through The 1000 Missionary Movement – Bangladesh. Our mission is
              to share the love, hope, and saving message of Christ across
              Bangladesh and beyond.
            </p>
            <p>
              The 1000 Missionary Movement is more than just a program — it is a
              divine opportunity for you. God is calling you to become a
              faithful missionary for His Kingdom. Though challenges may come,
              God will strengthen and guide us as we move forward in faith,
              prayer, and unity.
            </p>
            <p>
              I encourage everyone to continue supporting this mission through
              prayer and service. Together, we can bring spiritual
              transformation to many lives. <br />
              <span className="italic">
                &ldquo;Here am I, Lord, send me.&rdquo;
              </span>{" "}
              — Isaiah 6:8
            </p>
          </div>

          {/* Signature */}
          <div className="mt-10 flex flex-col items-center gap-2">
            <div
              className="h-px w-16"
              style={{
                background: "linear-gradient(90deg, #16a34a, #f97316)",
              }}
            />
            <p
              className="font-bold text-stone-700 text-sm tracking-wide"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Pr. Krysthyann Zeferino
            </p>
            <p className="text-stone-400 text-xs tracking-widest uppercase">
              1000 Missionary Movement · Bangladesh
            </p>
          </div>

          {/* History link */}
          <div className="mt-8">
            <Link
              href="/history"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border transition-all duration-200 hover:scale-105"
              style={{
                borderColor: "#007f98",
                color: "#007f98",
                fontFamily: "Georgia, serif",
              }}
            >
              Learn Our History →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
