"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export type Testimony = {
  id: string;
  name: string;
  location: string;
  quote: string;
  color: string;
};

const FALLBACK_TESTIMONIES: Testimony[] = [
  {
    id: "1",
    name: "Samuel Das",
    location: "Dhaka",
    color: "from-green-400 to-emerald-600",
    quote:
      "Joining the 1000 Missionary Movement was the best decision of my life. I was a shy university student with no experience in public speaking. During my one year of service in rural Sylhet, I conducted children's programs and health seminars. God gave me courage I never had before. I saw 27 people give their hearts to Jesus. Now I am no longer afraid — I am a missionary for life.",
  },
  {
    id: "2",
    name: "Rebecca Sarkar",
    location: "Barishal",
    color: "from-orange-400 to-red-500",
    quote:
      "Before joining 1000MM, I was struggling with my faith and purpose. The training in the Philippines and my mission assignment in northern Bangladesh completely changed me. I learned how to share the Gospel through health education. Many families who never heard about Jesus before opened their hearts. This one year gave me a new identity in Christ.",
  },
  {
    id: "3",
    name: "Timothy Gomes",
    location: "Chattogram",
    color: "from-emerald-500 to-teal-600",
    quote:
      "I left my job to serve as a missionary for one year. It was not easy, but it was worth it. My team and I planted a new church in a village near Bandarban. We faced many challenges, but God performed miracles. Today that small group has grown to more than 45 members. I discovered that when we step out in faith, God steps in with power.",
  },
  {
    id: "4",
    name: "Esther Akter",
    location: "Khulna",
    color: "from-amber-400 to-orange-500",
    quote:
      "As a young woman, I was nervous about going into mission work. But the 1000 Missionary Movement gave me confidence and purpose. I served in a remote area focusing on women and children's ministry. Seeing hopeless mothers find hope in Jesus was the most beautiful experience. I now understand that God can use anyone who is willing.",
  },
  {
    id: "5",
    name: "Immanuel Paul",
    location: "Rajshahi",
    color: "from-green-500 to-lime-600",
    quote:
      "The 1000MM experience taught me the real meaning of sacrifice. I left my comfortable city life and lived in a simple village for 10 months. Through literature distribution and Bible studies, we saw 18 precious souls make decisions for Christ. My own spiritual life grew deeper than ever. This movement is truly raising a new generation of committed youth for God.",
  },
  {
    id: "6",
    name: "Hannah D'Costa",
    location: "Sylhet",
    color: "from-rose-400 to-orange-400",
    quote:
      "God called me during a youth camp, and I answered. Serving as a 1000 missionary in a different culture taught me humility and dependence on God. I worked with media and digital evangelism, reaching hundreds of young people online. Many told me they found Christ through the videos we created. I came back changed — on fire for mission!",
  },
];

export default function Testimonies({ testimonies }: { testimonies?: Testimony[] }) {
  const items = testimonies && testimonies.length > 0 ? testimonies : FALLBACK_TESTIMONIES;

  return (
    <section
      className="relative py-15 overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #fafaf9 0%, #fff7ed 100%)",
      }}
    >
      {/* Background watermark */}
      <div
        className="font-heading absolute right-[-2rem] top-1/2 -translate-y-1/2 text-[18vw] font-bold select-none pointer-events-none leading-none opacity-[0.04] text-orange-400"
        aria-hidden="true"
      >
        STORIES
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <span
              className="h-px w-12"
              style={{
                background: "linear-gradient(90deg, #16a34a, #f97316)",
              }}
            />
            <span
              className="text-xs font-semibold tracking-[0.25em] uppercase text-orange-500"
            >
              Testimonies
            </span>
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold text-stone-800 leading-tight"
          >
            Lives{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
              }}
            >
              Transformed
            </span>
          </h2>
          <p
            className="text-stone-500 mt-3 text-base max-w-lg"
          >
            Hear from those whose lives were forever changed by one year of
            faithful service.
          </p>
        </motion.div>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.6, delay: (i % 2) * 0.15 }}
              className="relative flex gap-5 rounded-3xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 border border-stone-100"
            >
              {/* Accent corner */}
              <div
                className={`absolute top-0 right-0 w-16 h-16 rounded-bl-3xl rounded-tr-3xl opacity-10 bg-gradient-to-br ${t.color}`}
              />

              {/* Profile avatar */}
              <div className="shrink-0">
                <div
                  className={`relative w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br ${t.color} shadow-md flex items-center justify-center`}
                >
                  <Image
                    src={`/images/testimony-${i + 1}.jpg`}
                    alt={t.name}
                    fill
                    className="object-cover"
                    onError={() => {}}
                  />
                  {/* Fallback initials */}
                  <span
                    className="text-white font-bold text-lg z-10 select-none"
                  >
                    {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                </div>
                {/* Location pill */}
                <div className="mt-2 text-center">
                  <span className="text-[10px] text-stone-400 tracking-wide font-medium">
                    {t.location}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col justify-center min-w-0">
                {/* Quote mark */}
                <div
                  className="font-heading text-4xl leading-none mb-1 select-none"
                  style={{
                    background: "linear-gradient(90deg, #16a34a, #f97316)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                    display: "inline-block",
                  }}
                  aria-hidden="true"
                >
                  &ldquo;
                </div>
                <p
                  className="text-stone-600 text-sm leading-relaxed line-clamp-5"
                >
                  {t.quote}
                </p>
                <p
                  className="mt-3 font-bold text-stone-800 text-sm"
                >
                  {t.name}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
