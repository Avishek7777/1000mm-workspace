"use client";

/**
 * FAQ page — /faq
 * Drop at: apps/website/app/faq/page.tsx
 *
 * Assumptions (adjust if your project differs):
 *  - NavBar at components/NavBar.tsx (default export)
 *  - Footer at components/sections/Footer.tsx (default export)
 *  - If your root layout already renders NavBar/Footer, delete those imports + the
 *    <NavBar /> / <Footer /> lines below.
 *  - framer-motion + lucide-react already installed (they are, per package.json).
 *
 * Palette + font match the site: teal (#007f98) -> orange (#f97316), inherited global font.
 * Content sourced from vault spec Pages/FAQ's.md, de-duplicated across both draft versions.
 */

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://portal.1000mm.org.bd";

type QA = { q: string; a: React.ReactNode };
type Category = { label: string; items: QA[] };

const linkCls =
  "font-medium text-[#007f98] underline decoration-[#f97316] underline-offset-2 hover:text-[#005f72]";

const CATEGORIES: Category[] = [
  {
    label: "About the Movement",
    items: [
      {
        q: "What is the 1000 Missionary Movement Bangladesh?",
        a: "The 1000 Missionary Movement Bangladesh is a mission-focused initiative dedicated to mobilizing, equipping, and sending missionaries to share the Gospel, serve communities, and support church planting and discipleship efforts throughout Bangladesh and beyond.",
      },
      {
        q: "What is the vision of the movement?",
        a: "Our vision is to raise and deploy 1,000 committed missionaries who will impact lives through evangelism, discipleship, community service, and spiritual leadership.",
      },
      {
        q: "What is the mission of the movement?",
        a: "Our mission is to equip and deploy missionaries who will faithfully serve communities through evangelism, discipleship, and church-based ministry.",
      },
      {
        q: "Where does the movement operate?",
        a: "The movement serves communities throughout Bangladesh and may also participate in cross-cultural and international mission initiatives.",
      },
    ],
  },
  {
    label: "Joining & Training",
    items: [
      {
        q: "Who can join the movement?",
        a: "Anyone with a passion for serving God and reaching people with the Gospel can apply. Opportunities may be available for students, professionals, church members, and individuals called to missionary service.",
      },
      {
        q: "What qualifications are required to become a missionary?",
        a: "Requirements vary by role. Generally, applicants should demonstrate spiritual maturity, a commitment to Christian values, a servant-hearted attitude, and a willingness to receive training.",
      },
      {
        q: "Is there an age requirement?",
        a: "Yes — applicants should be between 16 and 35 years old. Specific programs may set their own ranges, and applicants under 18 will need a parent or guardian's consent.",
      },
      {
        q: "Do missionaries receive training?",
        a: "Yes. Missionaries undergo training in biblical studies, evangelism, discipleship, leadership development, cultural understanding, and practical ministry skills.",
      },
      {
        q: "How do I apply to become a missionary?",
        a: (
          <>
            Start your application online, then complete the screening and
            training process. You can{" "}
            <a
              href={`${PORTAL_URL}/register`}
              target="_blank"
              rel="noopener noreferrer"
              className={linkCls}
            >
              apply now
            </a>{" "}
            to begin.
          </>
        ),
      },
    ],
  },
  {
    label: "Ministry Opportunities",
    items: [
      {
        q: "What types of ministry opportunities are available?",
        a: (
          <ul className="ml-5 list-disc space-y-1">
            <li>Evangelism and outreach</li>
            <li>Church planting</li>
            <li>Discipleship programs</li>
            <li>Children's and youth ministry</li>
            <li>Community development projects</li>
            <li>Leadership training</li>
            <li>Prayer and intercession ministries</li>
          </ul>
        ),
      },
      {
        q: "Can I serve part-time or as a volunteer?",
        a: "Yes. Depending on the ministry's structure, both full-time and part-time volunteer opportunities may be available.",
      },
    ],
  },
  {
    label: "Support & Partnership",
    items: [
      {
        q: "How are missionaries supported financially?",
        a: "Missionaries may be supported through personal fundraising, church partnerships, individual donors, and ministry sponsorship programs, in line with the movement's policies and available resources.",
      },
      {
        q: "How can churches partner with the movement?",
        a: (
          <ul className="ml-5 list-disc space-y-1">
            <li>Praying for missionaries</li>
            <li>Providing financial support</li>
            <li>Sending volunteers</li>
            <li>Hosting training events</li>
            <li>Sponsoring missionary candidates</li>
          </ul>
        ),
      },
      {
        q: "How can I support the mission if I cannot serve in the field?",
        a: (
          <>
            You can support the movement through prayer, financial
            contributions, advocacy, volunteering, and encouraging others to
            participate. Visit{" "}
            <Link href="/how-to-donate" className={linkCls}>
              How to Donate
            </Link>{" "}
            to learn more.
          </>
        ),
      },
    ],
  },
  {
    label: "Staying Connected",
    items: [
      {
        q: "How can I stay updated on ministry activities?",
        a: "You can stay informed through our official social media channels, newsletters, events, prayer updates, and ministry reports.",
      },
      {
        q: "How can I contact 1000 Missionary Movement Bangladesh?",
        a: "Reach us through our official website, social media platforms, email, or a local ministry representative for more information about programs and opportunities.",
      },
    ],
  },
];

function AccordionItem({ item, index }: { item: QA; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#007f98]/12 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-[15px] font-semibold text-[#0b3d49] sm:text-base">
          {item.q}
        </span>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-[#f97316] transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key={`answer-${index}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-5 pr-9 text-[15px] leading-relaxed text-[#44585d]">
              {item.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqPage() {
  let globalIndex = 0;

  return (
    <div className="min-h-screen bg-[#f4f9f9] text-[#0b3d49]">
      <NavBar />

      {/* Hero (pt clears the fixed navbar) */}
      <header
        className="relative overflow-hidden px-6 pt-32 pb-20 text-center"
        style={{
          background: "linear-gradient(135deg, #015d70 0%, #00404f 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #f97316 0, #f97316 1px, transparent 1px, transparent 22px)",
          }}
        />
        <div className="relative mx-auto max-w-3xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#fb923c]/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#fb923c]">
            <HelpCircle className="h-3.5 w-3.5" />
            Help Center
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/80">
            Everything you need to know about joining, supporting, and
            partnering with the 1000 Missionary Movement Bangladesh.
          </p>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="space-y-14">
          {CATEGORIES.map((cat) => (
            <section key={cat.label}>
              <div className="mb-2 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#007f98]/15" />
                <h2 className="text-xl font-bold tracking-tight text-[#007f98]">
                  {cat.label}
                </h2>
                <span className="h-px flex-1 bg-[#007f98]/15" />
              </div>
              <div className="rounded-2xl border border-[#007f98]/12 bg-white px-6 shadow-[0_1px_0_rgba(0,127,152,0.05)]">
                {cat.items.map((item) => (
                  <AccordionItem
                    key={item.q}
                    item={item}
                    index={globalIndex++}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div
          className="mt-16 overflow-hidden rounded-2xl px-8 py-12 text-center"
          style={{
            background: "linear-gradient(135deg, #015d70 0%, #00404f 100%)",
          }}
        >
          <h3 className="text-2xl font-bold tracking-tight text-white">
            Still have a question?
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/80">
            We'd love to hear from you. Reach out and our team will get back to
            you.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`${PORTAL_URL}/register`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#f97316] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ea6a0c]"
            >
              Apply Now
            </a>
            <Link
              href="/how-to-donate"
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Support the Mission
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
