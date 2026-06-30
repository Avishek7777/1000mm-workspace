"use client";

/**
 * BackToTop — fixed bottom-right scroll-to-top button.
 * Drop at: apps/website/components/BackToTop.tsx
 *
 * Appears after the user scrolls down ~300px. Brand gradient (teal -> orange)
 * matching the navbar/footer. Accessible + respects prefers-reduced-motion.
 *
 * Rendered once in app/layout.tsx so it shows on every page.
 */

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    onScroll(); // set initial state (e.g. on refresh mid-page)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg outline-none transition-all duration-300 hover:scale-110 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#00404f] ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
      style={{
        background: "linear-gradient(135deg, #007f98 0%, #f97316 100%)",
      }}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}
