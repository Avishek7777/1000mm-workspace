/**
 * Privacy Policy page — /privacy-policy
 * Drop at: apps/website/app/privacy-policy/page.tsx
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
  title: "Privacy Policy | 1000 Missionary Movement Bangladesh",
  description:
    "How the 1000 Missionary Movement Bangladesh collects, uses, and protects your personal information.",
};

const EFFECTIVE_DATE = "1997";
const CONTACT_EMAIL = "info@1000mm.org.bd";
const ORG_ADDRESS = "149 Shah Ali Bagh, Mirpur - 1, Dhaka 1216, Bangladesh";

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

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-white/75">Effective {EFFECTIVE_DATE}</p>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-[15px] leading-relaxed text-[#44585d]">
          The 1000 Missionary Movement Bangladesh ("we," "us," or "the
          Movement") respects your privacy. This policy explains what personal
          information we collect when you use our website and applicant portal,
          how we use it, and the choices you have. By submitting an application
          or otherwise providing information to us, you agree to the practices
          described here.
        </p>

        <Section title="1. Information we collect">
          <p>We collect information you provide directly to us, including:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Application and bio-data:</strong> your name, date of
              birth, gender, contact details, address, family details, and
              educational background.
            </li>
            <li>
              <strong>Uploaded documents:</strong> identity documents (such as
              National ID), educational certificates, a passport-sized photo,
              and supporting letters.
            </li>
            <li>
              <strong>Account information:</strong> your email address and an
              encrypted password used to access the applicant portal.
            </li>
            <li>
              <strong>Ministry records:</strong> if you are accepted, deployment
              details, field reports, and related program records you submit
              during service.
            </li>
            <li>
              <strong>Communications:</strong> messages you send us through
              contact forms or email.
            </li>
          </ul>
          <p>
            We may also automatically collect limited technical information
            (such as your IP address) to keep the service secure and
            functioning.
          </p>
        </Section>

        <Section title="2. How we use your information">
          <p>We use the information we collect to:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Review and process missionary and trainer applications;</li>
            <li>
              Communicate with you about your application status and program
              activities;
            </li>
            <li>
              Administer training, deployment, reporting, and (where applicable)
              support;
            </li>
            <li>
              Generate identity cards, certificates, and official documents;
            </li>
            <li>Maintain the security and integrity of the portal;</li>
            <li>Meet our administrative, reporting, and legal obligations.</li>
          </ul>
        </Section>

        <Section title="3. Who can see your information">
          <p>
            Your information is accessible only to authorized personnel of the
            Movement who need it to carry out their roles — for example, local
            mission directors, the union director, trainers, and system
            administrators. We do <strong>not</strong> sell your personal
            information.
          </p>
          <p>
            We may share information with trusted service providers who help us
            operate the portal (such as hosting and email delivery), and where
            required by law or to protect the rights and safety of the Movement
            and others.
          </p>
        </Section>

        <Section title="4. Applicants under 18">
          <p>
            Applications are open to individuals aged 16 and above. If you are
            under 18, you must have the consent of a parent or legal guardian
            before submitting an application or any documents. We collect a
            parental/guardian consent form as part of the process for minor
            applicants. If you believe a minor has provided us information
            without the required consent, please contact us so we can address
            it.
          </p>
        </Section>

        <Section title="5. How we store and protect your data">
          <p>
            We take reasonable technical and organizational measures to protect
            your information, including encrypted passwords and access controls
            that limit who can view applicant records. Uploaded documents are
            stored securely and served only to authorized users. No method of
            transmission or storage is completely secure, so we cannot guarantee
            absolute security.
          </p>
        </Section>

        <Section title="6. How long we keep your data">
          <p>
            We retain application and ministry records for as long as needed to
            fulfil the purposes described in this policy, to maintain accurate
            program records, and to comply with our obligations. When
            information is no longer needed, we take steps to delete or
            anonymize it.
          </p>
        </Section>

        <Section title="7. Your rights">
          <p>You may, subject to applicable limits:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Request access to the personal information we hold about you;
            </li>
            <li>
              Ask us to correct information that is inaccurate or incomplete;
            </li>
            <li>
              Request deletion of your information where we are not required to
              keep it;
            </li>
            <li>Withdraw your application or consent at any time.</li>
          </ul>
          <p>
            To make a request, contact us using the details below. We may need
            to verify your identity before acting on a request.
          </p>
        </Section>

        <Section title="8. Changes to this policy">
          <p>
            We may update this policy from time to time. When we do, we will
            revise the effective date above and, where appropriate, notify you.
            Please review this page periodically.
          </p>
        </Section>

        <Section title="9. Contact us">
          <p>
            If you have questions about this policy or how we handle your
            information, contact us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-[#007f98] underline decoration-[#f97316] underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            or write to us at {ORG_ADDRESS}.
          </p>
        </Section>

        <div className="mt-12 gap-3 flex flex-col border-t border-[#007f98]/12 pt-6">
          <Link
            href="/terms-of-service"
            className="text-sm font-medium text-[#007f98] underline decoration-[#f97316] underline-offset-2 hover:text-[#005f72]"
          >
            Read our Terms of Service →
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
