// apps/website/src/app/page.tsx
"use client";

import { useEffect } from "react";
import NavBar from "@/components/NavBar";
import HeroSection from "@/components/sections/HeroSection";
import DirectorsMessage from "@/components/sections/DirectorsMessage";
import StatisticsSection from "@/components/sections/StatisticsSection";
import AboutUs from "@/components/sections/AboutUs";
import Testimonies from "@/components/sections/Testimonies";
import HowToJoin from "@/components/sections/HowToJoin";
import ContactUs from "@/components/sections/ContactUs";
import Footer from "@/components/sections/Footer";

export default function LandingPage() {
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Force all framer-motion elements to be visible
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

  return (
    <main className="relative">
      <NavBar />
      <HeroSection />
      <DirectorsMessage />
      <StatisticsSection />
      <AboutUs />
      <Testimonies />
      <HowToJoin />
      <ContactUs />
      <Footer />
    </main>
  );
}
