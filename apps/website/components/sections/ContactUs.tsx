// apps/website/components/sections/ContactUs.tsx
// Server component — fetches from the portal's public API, no Prisma involved.

import ContactUsClient from "./ContactUsClient";

type Program = {
  id: string;
  title: string;
  category: string;
  startDate: string; // ISO string over the wire
  endDate: string;
  location: string | null;
};

export default async function ContactUs() {
  let programs: Program[] = [];

  try {
    const portalUrl =
      process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001";
    const res = await fetch(`${portalUrl}/api/public/programs`, {
      next: { revalidate: 300 }, // ISR: revalidate every 5 minutes
    });
    if (res.ok) {
      programs = await res.json();
    }
  } catch {
    // Portal unreachable — degrade gracefully, show empty state
  }

  return <ContactUsClient programs={programs} />;
}
