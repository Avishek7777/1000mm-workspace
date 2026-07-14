// apps/website/app/page.tsx
import NavBar from "@/components/NavBar";
import HeroSection from "@/components/sections/HeroSection";
import DirectorsMessage from "@/components/sections/DirectorsMessage";
import StatisticsSection from "@/components/sections/StatisticsSection";
import AboutUs from "@/components/sections/AboutUs";
import Testimonies, { type Testimony } from "@/components/sections/Testimonies";
import HowToJoin from "@/components/sections/HowToJoin";
import ContactUs from "@/components/sections/ContactUs";
import Footer from "@/components/sections/Footer";
import CurrentProjectsSection, { type Project } from "@/components/sections/CurrentProjectsSection";
import PageShowFix from "@/components/PageShowFix";
import { PROJECTS as FALLBACK_PROJECTS } from "@/lib/projects";
import { resolveProjectImages } from "@/lib/portal";

async function fetchProjects(): Promise<Project[]> {
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL;
  if (!portalUrl) return FALLBACK_PROJECTS.map((p) => ({ ...p, id: p.slug }));
  try {
    const res = await fetch(`${portalUrl}/api/public/projects`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("fetch failed");
    const projects: Project[] = await res.json();
    return projects.map(resolveProjectImages);
  } catch {
    return FALLBACK_PROJECTS.map((p) => ({ ...p, id: p.slug }));
  }
}

async function fetchTestimonies(): Promise<Testimony[]> {
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL;
  if (!portalUrl) return [];
  try {
    const res = await fetch(`${portalUrl}/api/public/testimonials`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("fetch failed");
    return res.json();
  } catch {
    return [];
  }
}

export default async function LandingPage() {
  const [projects, testimonies] = await Promise.all([fetchProjects(), fetchTestimonies()]);

  return (
    <main className="relative">
      <PageShowFix />
      <NavBar />
      <HeroSection />
      <DirectorsMessage />
      <CurrentProjectsSection projects={projects} />
      <StatisticsSection />
      <AboutUs />
      <Testimonies testimonies={testimonies} />
      <HowToJoin />
      <ContactUs />
      <Footer />
    </main>
  );
}
