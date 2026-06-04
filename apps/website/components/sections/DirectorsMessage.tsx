"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function DirectorsMessage() {
  return (
    <section className="relative py-24 overflow-hidden bg-stone-50">
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M40 0v80M0 40h80' stroke='%23000' stroke-width='0.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-12"
        >
          <span
            className="h-px w-12"
            style={{
              background: "linear-gradient(90deg, #16a34a, #f97316)",
            }}
          />
          <span
            className="text-xs font-semibold tracking-[0.25em] uppercase text-orange-500"
            style={{ fontFamily: "Georgia, serif" }}
          >
            A Word from Leadership
          </span>
        </motion.div>

        {/* 5-column grid: text (3 cols) + 2 images (1 col each) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-8 items-start">
          {/* Text — spans 3 columns */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-3 flex flex-col justify-center"
          >
            <h2
              className="text-4xl md:text-5xl font-bold text-stone-800 leading-tight mb-8"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Message from
              <br />
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #16a34a 0%, #f97316 100%)",
                }}
              >
                the Director
              </span>
            </h2>

            {/* Opening quote mark */}
            <div
              className="text-7xl leading-none text-green-200 font-serif mb-2 select-none"
              aria-hidden="true"
            >
              &ldquo;
            </div>

            <div
              className="text-stone-600 text-base md:text-lg leading-relaxed space-y-4"
              style={{ fontFamily: "Georgia, serif" }}
            >
              <p>
                Dear young people of Bangladesh, it is a great privilege to
                serve as the Director of the 1000 Missionary Movement in
                Bangladesh. We are witnessing a mighty move of the Holy Spirit
                among our youth today. Many are rising up with passion and
                courage to answer God&apos;s call for mission.
              </p>
              <p>
                The 1000 Missionary Movement is more than just a program — it is
                a divine opportunity for you to dedicate one year of your life
                completely to Jesus. Whether you serve in the villages of
                Bangladesh, in the cities, or are sent to other nations, your
                life can make an eternal difference.
              </p>
              <p>
                If you feel a stirring in your heart, do not hesitate. Step
                forward in faith. The harvest is ripe, and the Lord is looking
                for willing workers. We are praying for you and believe God will
                do amazing things through this generation.
              </p>
            </div>

            {/* Signature area */}
            <div className="mt-8 flex items-center gap-4">
              <div
                className="h-px flex-1 max-w-[60px]"
                style={{
                  background: "linear-gradient(90deg, #16a34a, #f97316)",
                }}
              />
              <div>
                <p
                  className="font-bold text-stone-800 text-sm"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Director, 1000 Missionary Movement
                </p>
                <p className="text-stone-400 text-xs tracking-wide">
                  Bangladesh Division
                </p>
              </div>
            </div>
          </motion.div>

          {/* Current Director Image — 1 column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="lg:col-span-1 flex flex-col items-center gap-3"
          >
            <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-green-100 to-orange-100">
              <Image
                src="/images/director-current.jpg"
                alt="Current Director"
                fill
                className="object-cover object-top"
              />
              {/* Fallback gradient shown if image missing */}
              <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/50 to-transparent">
                <div>
                  <p
                    className="text-white font-bold text-sm"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    Current Director
                  </p>
                  <p className="text-white/70 text-xs">1000MM Bangladesh</p>
                </div>
              </div>
            </div>
            <span className="text-xs text-stone-400 tracking-widest uppercase">
              Current Director
            </span>
          </motion.div>

          {/* Former Director Image — 1 column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="lg:col-span-1 flex flex-col items-center gap-3 lg:mt-16"
          >
            <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-orange-100 to-green-100">
              <Image
                src="/images/director-former.jpg"
                alt="Former Director"
                fill
                className="object-cover object-top"
              />
              <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/50 to-transparent">
                <div>
                  <p
                    className="text-white font-bold text-sm"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    Former Director
                  </p>
                  <p className="text-white/70 text-xs">1000MM Bangladesh</p>
                </div>
              </div>
            </div>
            <span className="text-xs text-stone-400 tracking-widest uppercase">
              Former Director
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
