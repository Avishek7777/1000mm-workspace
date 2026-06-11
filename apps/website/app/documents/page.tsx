// apps/website/app/documents/page.tsx
// Public page — applicants download required forms before applying.
// Files live at: public/downloads/letter-of-intent.pdf
//                public/downloads/parents-consent.pdf
//                public/downloads/sworn-statement.pdf

import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileText,
  ShieldCheck,
  PenLine,
} from "lucide-react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/sections/Footer";

export const metadata = {
  title: "Application Documents — 1000MM Bangladesh",
  description:
    "Download the required forms for your 1000MM missionary training application: Letter of Intent, Parent's Consent, and Sworn Statement.",
};

const documents = [
  {
    id: "letter-of-intent",
    title: "Letter of Intent",
    description:
      "A personal statement expressing your commitment to the missionary training program. Fill it out completely, sign it, and include it with your application.",
    icon: PenLine,
    filename: "letter-of-intent.pdf",
    accent: "#007f98", // teal
    accentLight: "#f0fafa",
    accentBorder: "#b2e0e8",
  },
  {
    id: "parents-consent",
    title: "Parent's Consent",
    description:
      "Required for all unmarried applicants. Must be signed by a parent or legal guardian and submitted alongside your application documents.",
    icon: ShieldCheck,
    filename: "parents-consent.pdf",
    accent: "#f97316", // orange
    accentLight: "#fff7ed",
    accentBorder: "#fed7aa",
  },
  {
    id: "sworn-statement",
    title: "Sworn Statement",
    description:
      "A declaration affirming the accuracy of the information you have provided in your application. Must be signed in the presence of a witness.",
    icon: FileText,
    filename: "sworn-statement.pdf",
    accent: "#16a34a", // green
    accentLight: "#f0fdf4",
    accentBorder: "#bbf7d0",
  },
];

export default function DocumentsPage() {
  return (
    <>
      <NavBar />

      <main
        className="relative min-h-screen overflow-hidden pt-24 pb-20"
        style={{
          background: "linear-gradient(160deg, #fafaf9 0%, #fff7ed 100%)",
        }}
      >
        {/* Watermark */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-2rem] top-[8%] select-none text-[18vw] font-bold leading-none opacity-[0.035]"
          style={{ fontFamily: "Georgia, serif", color: "#f97316" }}
        >
          DOCS
        </div>

        <div className="relative z-10 mx-auto max-w-2xl px-6">
          {/* Back link */}
          <Link
            href="/#how-to-join"
            className="mb-10 inline-flex items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-stone-700"
            style={{ fontFamily: "Georgia, serif" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to How to Join
          </Link>

          {/* Header */}
          <div className="mb-12">
            <div className="mb-4 flex items-center gap-3">
              <span
                className="h-px w-12"
                style={{
                  background: "linear-gradient(90deg, #16a34a, #f97316)",
                }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Required Forms
              </span>
            </div>

            <h1
              className="text-4xl font-bold leading-tight text-stone-800 md:text-5xl"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Application{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                }}
              >
                Documents
              </span>
            </h1>

            <p
              className="mt-4 max-w-lg text-base leading-relaxed text-stone-500"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Download each form below, fill it out carefully, and include it
              with your application. All three documents are required before
              your application can be reviewed.
            </p>
          </div>

          {/* Document cards */}
          <div className="space-y-4">
            {documents.map((doc, i) => {
              const Icon = doc.icon;
              return (
                <div
                  key={doc.id}
                  className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
                  style={{ borderColor: doc.accentBorder }}
                >
                  {/* Left accent strip */}
                  <div
                    className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
                    style={{ background: doc.accent }}
                  />

                  <div className="flex items-start gap-5 px-6 py-5 pl-7">
                    {/* Icon */}
                    <div
                      className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ background: doc.accentLight }}
                    >
                      <Icon className="h-5 w-5" style={{ color: doc.accent }} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      {/* Step number + title */}
                      <div className="flex items-baseline gap-2">
                        <span
                          className="text-xs font-bold tabular-nums"
                          style={{
                            color: doc.accent,
                            fontFamily: "Georgia, serif",
                          }}
                        >
                          0{i + 1}
                        </span>
                        <h2
                          className="text-base font-bold text-stone-800"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {doc.title}
                        </h2>
                      </div>

                      <p
                        className="mt-1.5 text-sm leading-relaxed text-stone-500"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {doc.description}
                      </p>
                    </div>

                    {/* Download button */}
                    <a
                      href={`/downloads/${doc.filename}`}
                      download={doc.filename}
                      className="mt-0.5 flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md active:scale-95"
                      style={{
                        background: doc.accent,
                        fontFamily: "Georgia, serif",
                      }}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Help note */}
          <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/60 px-6 py-5">
            <p
              className="text-sm leading-relaxed text-amber-800"
              style={{ fontFamily: "Georgia, serif" }}
            >
              <span className="font-semibold">Need help?</span> If you have
              trouble opening any of these files, make sure you have a PDF
              viewer installed (such as Adobe Acrobat or your browser's built-in
              viewer). For questions about filling out the forms, contact us at{" "}
              <a
                href="mailto:info@1000mm.org.bd"
                className="font-semibold text-amber-900 underline underline-offset-2 hover:text-orange-700"
              >
                info@1000mm.org.bd
              </a>
              .
            </p>
          </div>

          {/* Apply CTA */}
          <div className="mt-10 text-center">
            <p
              className="mb-4 text-sm text-stone-400"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Already have all your documents ready?
            </p>
            <Link
              href={`${process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001"}/register`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:scale-105"
              style={{
                background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                fontFamily: "Georgia, serif",
              }}
            >
              Start Your Application
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
