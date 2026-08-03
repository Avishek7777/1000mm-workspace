"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

export type Testimony = {
  id: string;
  name: string;
  location: string;
  quote: string;
  imageUrl?: string | null;
  color: string;
};

/**
 * Cards clamp the quote to 5 lines. Anything longer than this gets a
 * "Read full story" button — a character count rather than measuring the
 * rendered element, which would need a layout pass and a resize observer for
 * something readers never notice being slightly off.
 */
const QUOTE_PREVIEW_LIMIT = 300;

/** Avatar photo when one is set, gradient tile with initials when not. */
function TestimonyAvatar({
  testimony,
  size,
}: {
  testimony: Testimony;
  size: "card" | "overlay";
}) {
  const box = size === "card" ? "w-14 h-14 rounded-2xl" : "w-16 h-16 rounded-2xl";
  const initials = testimony.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <div
      className={`relative ${box} overflow-hidden bg-gradient-to-br ${testimony.color} shadow-md flex items-center justify-center`}
    >
      {testimony.imageUrl ? (
        <Image
          src={testimony.imageUrl}
          alt={testimony.name}
          fill
          sizes="64px"
          className="object-cover"
        />
      ) : (
        <span className="text-white font-bold text-lg z-10 select-none">
          {initials}
        </span>
      )}
    </div>
  );
}

function TestimonyOverlay({
  testimony,
  onClose,
}: {
  testimony: Testimony;
  onClose: () => void;
}) {
  // Escape to close, and lock the page behind the overlay so scrolling the
  // story doesn't scroll the list underneath it.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Testimony from ${testimony.name}`}
    >
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`absolute top-0 right-0 h-24 w-24 rounded-bl-[2rem] rounded-tr-3xl opacity-10 bg-gradient-to-br ${testimony.color}`}
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-stone-500 shadow-sm transition-colors hover:bg-stone-100 hover:text-stone-800"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="flex items-center gap-4 border-b border-stone-100 px-6 py-5 sm:px-8">
          <TestimonyAvatar testimony={testimony} size="overlay" />
          <div className="min-w-0">
            <p className="font-bold text-stone-800">{testimony.name}</p>
            <p className="text-xs font-medium tracking-wide text-stone-400">
              {testimony.location}
            </p>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-6 sm:px-8">
          <div
            className="font-heading mb-1 inline-block text-5xl leading-none select-none"
            style={{
              background: "linear-gradient(90deg, #16a34a, #f97316)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
            aria-hidden="true"
          >
            &ldquo;
          </div>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-stone-600">
            {testimony.quote}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

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
  const [active, setActive] = useState<Testimony | null>(null);

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
                <TestimonyAvatar testimony={t} size="card" />
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
                {t.quote.length > QUOTE_PREVIEW_LIMIT && (
                  <button
                    type="button"
                    onClick={() => setActive(t)}
                    className="mt-2 inline-flex w-fit items-center gap-1 text-xs font-semibold text-orange-500 transition-colors hover:text-orange-600"
                  >
                    Read full story
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                )}
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

      <AnimatePresence>
        {active && (
          <TestimonyOverlay
            key={active.id}
            testimony={active}
            onClose={() => setActive(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
