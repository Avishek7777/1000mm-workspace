// apps/website/app/page.tsx
import NavBar from "@/components/NavBar";
import HeroSection from "@/components/sections/HeroSection";
import DirectorsMessage from "@/components/sections/DirectorsMessage";
import StatisticsSection from "@/components/sections/StatisticsSection";
import AboutUs from "@/components/sections/AboutUs";
import Testimonies from "@/components/sections/Testimonies";
import HowToJoin from "@/components/sections/HowToJoin";
import ContactUs from "@/components/sections/ContactUs";
import Footer from "@/components/sections/Footer";
import CurrentProjectsSection from "@/components/sections/CurrentProjectsSection";
import PageShowFix from "@/components/PageShowFix";

export default function LandingPage() {
  return (
    <main className="relative">
      <PageShowFix />
      <NavBar />
      <HeroSection />
      <DirectorsMessage />
      <CurrentProjectsSection />
      <StatisticsSection />
      <AboutUs />
      <Testimonies />
      <HowToJoin />
      <ContactUs />
      <Footer />
    </main>
  );
}
