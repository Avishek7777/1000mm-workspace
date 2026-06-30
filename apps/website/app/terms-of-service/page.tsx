/**
 * Terms of Service page — /terms-of-service
 * Drop at: apps/website/app/terms-of-service/page.tsx
 *
 * Assumptions (adjust if your project differs):
 *  - NavBar at components/NavBar.tsx (default export)
 *  - Footer at components/sections/Footer.tsx (default export)
 *  - If your root layout already renders NavBar/Footer, delete those imports + lines.
 *
 * Palette matches the site: teal (#007f98) -> orange (#f97316), inherited global font.
 *
 * ⚠️ Starting template, not legal advice. Fill the [PLACEHOLDERS] and have your
 * leadership (and ideally a BD legal advisor) review before publishing.
 */

import type { Metadata } from "next";
import Link from "next/link";

import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "Terms of Service | 1000 Missionary Movement Bangladesh",
  description:
    "The terms that govern your use of the 1000 Missionary Movement Bangladesh website and applicant portal.",
};

const EFFECTIVE_DATE = "1997";
const CONTACT_EMAIL = "info@1000mm.org.bd";
const GOVERNING_LAW = "the laws of Bangladesh";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold tracking-tight text-[#007f98]">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[#44585d]">
        {children}
      </div>
    </section>
  );
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#f4f9f9] text-[#0b3d49]">
      <NavBar />

      <header
        className="px-6 pt-32 pb-16 text-center"
        style={{
          background: "linear-gradient(135deg, #015d70 0%, #00404f 100%)",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#fb923c]">
          Legal
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-white/75">Effective {EFFECTIVE_DATE}</p>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-[15px] leading-relaxed text-[#44585d]">
          These Terms of Service ("Terms") govern your access to and use of the
          website and applicant portal of the 1000 Missionary Movement
          Bangladesh ("we," "us," or "the Movement"). By using our website or
          submitting an application, you agree to these Terms. If you do not
          agree, please do not use the service.
        </p>

        <Section title="1. Eligibility">
          <p>
            To apply through the portal you must be between 16 and 35 years of
            age. Applicants under 18 must have the consent of a parent or legal
            guardian. By applying, you confirm that the information you provide
            is true, accurate, and complete to the best of your knowledge.
          </p>
        </Section>

        <Section title="2. Your account">
          <p>
            You are responsible for keeping your account credentials
            confidential and for all activity that occurs under your account.
            Notify us promptly if you suspect any unauthorized use. We may
            suspend or disable accounts that we believe have been used in
            violation of these Terms.
          </p>
        </Section>

        <Section title="3. Applications and submissions">
          <p>
            Submitting an application does not guarantee selection. All
            applications are subject to review, screening, and approval by the
            Movement's leadership, whose decisions are final. You agree not to
            submit false documents or to impersonate another person.
          </p>
          <p>
            You retain ownership of the documents and content you upload. By
            submitting them, you grant the Movement permission to store and use
            them for the purposes of reviewing your application and
            administering the program.
          </p>
        </Section>

        <Section title="4. Acceptable use">
          <p>When using the service, you agree not to:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Use the service for any unlawful or fraudulent purpose;</li>
            <li>
              Upload viruses, malicious code, or content that infringes others'
              rights;
            </li>
            <li>
              Attempt to gain unauthorized access to any part of the system or
              other users' data;
            </li>
            <li>
              Interfere with or disrupt the integrity or performance of the
              service.
            </li>
          </ul>
        </Section>

        <Section title="5. Donations">
          <p>
            Donations made through or facilitated by our website are voluntary
            and support the Movement's mission and programs. Please review any
            specific donation terms provided at the time of giving. Refund
            requests, if applicable, should be directed to us using the contact
            details below.
          </p>
        </Section>

        <Section title="6. Intellectual property">
          <p>
            The website, its design, logos, and content (excluding content you
            submit) belong to the Movement or its licensors and are protected by
            applicable laws. You may not copy, modify, or distribute them
            without our permission.
          </p>
        </Section>

        <Section title="7. Third-party links">
          <p>
            Our website may link to third-party sites or services that we do not
            control. We are not responsible for their content or practices, and
            your use of them is at your own risk.
          </p>
        </Section>

        <Section title="8. Disclaimers and limitation of liability">
          <p>
            The service is provided "as is" without warranties of any kind. To
            the fullest extent permitted by law, the Movement will not be liable
            for any indirect, incidental, or consequential damages arising from
            your use of the service.
          </p>
        </Section>

        <Section title="9. Changes to these Terms">
          <p>
            We may update these Terms from time to time. Changes take effect
            when we post the revised Terms and update the effective date above.
            Your continued use of the service after changes are posted means you
            accept the updated Terms.
          </p>
        </Section>

        <Section title="10. Governing law">
          <p>
            These Terms are governed by {GOVERNING_LAW}, without regard to
            conflict-of-law principles.
          </p>
        </Section>

        <Section title="11. Contact us">
          <p>
            Questions about these Terms? Contact us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-[#007f98] underline decoration-[#f97316] underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <div className="mt-12 gap-3 flex flex-col border-t border-[#007f98]/12 pt-6">
          <Link
            href="/privacy-policy"
            className="text-sm font-medium text-[#007f98] underline decoration-[#f97316] underline-offset-2 hover:text-[#005f72]"
          >
            Read our Privacy Policy →
          </Link>
          <Link
            target="_blank"
            href="https://privacy.adventist.org/"
            className="text-sm font-medium text-[#007f98] underline decoration-[#f97316] underline-offset-2 hover:text-[#005f72]"
          >
            SDA Privecy Policy →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
