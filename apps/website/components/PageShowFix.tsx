// apps/website/components/PageShowFix.tsx
// Tiny client component — just the pageshow handler.
"use client";

import { useEffect } from "react";

export default function PageShowFix() {
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        document
          .querySelectorAll<HTMLElement>("[style*='opacity: 0']")
          .forEach((el) => {
            el.style.opacity = "1";
            el.style.transform = "none";
          });
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return null;
}
