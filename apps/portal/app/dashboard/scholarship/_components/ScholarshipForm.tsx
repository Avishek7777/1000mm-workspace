"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { submitScholarshipAction, type ScholarshipResult } from "@/actions/scholarships";

const INIT: ScholarshipResult = { ok: false };

/** Mirrors the printed form's field order so the two read the same. */
const TEXT_FIELDS: Array<{ name: string; label: string; placeholder?: string; type?: string }> = [
  { name: "servingYear", label: "Serving Year", placeholder: "e.g. 2025–2026" },
  { name: "passingGrade", label: "Passing Grade", placeholder: "e.g. HSC" },
  { name: "passingYear", label: "Year", placeholder: "e.g. 2024" },
  { name: "gpa", label: "GPA", placeholder: "e.g. 4.50" },
  { name: "planningToStudy", label: "Planning to Study", placeholder: "e.g. Bachelor of Nursing" },
  { name: "subject", label: "Subject" },
  { name: "collegeName", label: "College Name" },
  { name: "collegeAddress", label: "College Address" },
  { name: "estimatedMonthlyFees", label: "Estimated Monthly Fees" },
  { name: "yearlyFees", label: "Yearly Fees" },
  { name: "additionalFees", label: "Additional Fees" },
  { name: "fatherName", label: "Name of Father" },
  { name: "motherName", label: "Name of Mother" },
  { name: "siblingName", label: "Name of Brother / Sister" },
  { name: "homeAddress", label: "Home Address" },
  { name: "phoneNumber", label: "Phone Number" },
  { name: "emailId", label: "Email ID", type: "email" },
];

const NARRATIVES: Array<{ name: string; label: string; placeholder: string }> = [
  {
    name: "experience",
    label: "Experience of Missionary",
    placeholder: "Describe your service so far — where you served and what you did…",
  },
  {
    name: "desireToStudy",
    label: "Desire to Study & Why You Need a Scholarship",
    placeholder: "What you want to study, and why you need financial support…",
  },
  {
    name: "familyBackground",
    label: "Family Background of the Missionary",
    placeholder: "Your family's situation and circumstances…",
  },
];

const ATTACHMENTS: Array<{ name: string; label: string; hint: string }> = [
  { name: "photo", label: "PP Size Picture", hint: "JPG or PNG, max 2 MB" },
  { name: "missionaryCertificate", label: "Missionary Certificate", hint: "PDF, JPG or PNG, max 2 MB" },
  { name: "academicResult", label: "Academic Result or Certificate", hint: "PDF, JPG or PNG, max 2 MB" },
  { name: "recommendationLetter", label: "Recommendation Letter", hint: "PDF, JPG or PNG, max 2 MB" },
  { name: "nid", label: "NID", hint: "PDF, JPG or PNG, max 2 MB" },
];

export function ScholarshipForm({
  applicantName,
  applicantDateOfBirth,
}: {
  applicantName: string;
  applicantDateOfBirth: string | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitScholarshipAction, INIT);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (state.ok) router.refresh();
  }, [state, router]);

  const fe = ("fieldErrors" in state && state.fieldErrors) || {};

  return (
    <form action={action} className="space-y-6">
      {"error" in state && state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-medium text-gray-900">Applicant Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Name of Missionary
            </label>
            <input
              value={applicantName}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
            />
            <p className="mt-1 text-[11px] text-gray-400">From your account.</p>
          </div>

          {/* Locked when we already hold a date of birth; typed only when
              neither the account nor the applicant's bio-data has one, so
              nobody is left staring at an empty field they cannot fill. */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Date of Birth
            </label>
            {applicantDateOfBirth ? (
              <>
                <input
                  value={new Date(applicantDateOfBirth).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  readOnly
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                />
                <p className="mt-1 text-[11px] text-gray-400">From your records.</p>
              </>
            ) : (
              <input
                name="dateOfBirth"
                type="date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
            )}
            {fe.dateOfBirth && <p className="mt-0.5 text-xs text-red-500">{fe.dateOfBirth}</p>}
          </div>
          {TEXT_FIELDS.map((f) => (
            <div key={f.name}>
              <label className="mb-1 block text-xs font-medium text-gray-700">{f.label}</label>
              <input
                name={f.name}
                type={f.type ?? "text"}
                placeholder={f.placeholder}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
              {fe[f.name] && <p className="mt-0.5 text-xs text-red-500">{fe[f.name]}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-medium text-gray-900">Your Statement</h2>
        <div className="space-y-4">
          {NARRATIVES.map((n) => (
            <div key={n.name}>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                {n.label} <span className="text-red-500">*</span>
              </label>
              <textarea
                name={n.name}
                rows={5}
                placeholder={n.placeholder}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
              {fe[n.name] && <p className="mt-0.5 text-xs text-red-500">{fe[n.name]}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-medium text-gray-900">Attachments</h2>
        <p className="mb-4 text-xs text-gray-500">
          Missing attachments may delay your application.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ATTACHMENTS.map((a) => (
            <div key={a.name}>
              <label className="mb-1 block text-xs font-medium text-gray-700">{a.label}</label>
              <input
                name={a.name}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-2 file:py-1 file:text-xs focus:border-teal-500"
              />
              <p className="mt-0.5 text-[11px] text-gray-400">{a.hint}</p>
              {fe[a.name] && <p className="mt-0.5 text-xs text-red-500">{fe[a.name]}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
        <p className="text-xs text-gray-500">
          Submitted by <span className="font-medium text-gray-700">{applicantName}</span>
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Submit Application"}
        </button>
      </div>
    </form>
  );
}
