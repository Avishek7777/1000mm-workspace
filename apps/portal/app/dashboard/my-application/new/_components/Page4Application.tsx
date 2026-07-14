"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { submitApplicationAction } from "@/actions/application";
import {
  Field,
  Input,
  Textarea,
  FileInput,
  SectionHeading,
  FormCard,
  FormNav,
} from "./FormFields";
import type { ExistingDraft } from "./BioDataForm";

type Props = {
  applicationId: string;
  defaultValues?: ExistingDraft;
  onBack: () => void;
  applicantName?: string;
  missionName?: string;
  programTitle?: string;
};

type DocField = {
  name: string;
  label: string;
  hint: string;
  kind: string;
  required?: boolean;
};

const BASE_DOCUMENTS: DocField[] = [
  {
    name: "districtPastorRecommendation",
    kind: "DISTRICT_PASTOR_RECOMMENDATION",
    label: "District Pastor's Recommendation Letter",
    hint: "Letter from your district pastor. PDF or image, max 1 MB.",
    required: true,
  },
  {
    name: "baptismCertificate",
    kind: "BAPTISM_CERTIFICATE",
    label: "Baptism Certificate",
    hint: "Your official baptism certificate. PDF or image, max 400 KB.",
  },
  {
    name: "nid",
    kind: "NID",
    label: "National ID Card (NID)",
    hint: "Your NID scan. PDF or image, max 400 KB.",
  },
  {
    name: "birthCertificate",
    kind: "BIRTH_CERTIFICATE",
    label: "Birth Certificate",
    hint: "Your birth certificate. PDF or image, max 400 KB.",
  },
  {
    name: "parentPassportPhoto",
    kind: "PARENT_PASSPORT_PHOTO",
    label: "Parent's Passport-size Photo",
    hint: "Passport-sized photo of one parent. JPG or PNG, max 400 KB.",
  },
];

function calcAge(dobStr: string): number {
  const dob = new Date(dobStr);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const notYetHadBirthday =
    today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  return notYetHadBirthday ? age - 1 : age;
}

function YesNoField({
  name,
  label,
  description,
  initialValue,
}: {
  name: string;
  label: string;
  description: string;
  initialValue?: string;
}) {
  const [value, setValue] = useState<string>(initialValue ?? "");
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="mb-1 text-sm font-medium text-gray-800">{label}</p>
      <p className="mb-3 text-xs text-gray-500">{description}</p>
      <div className="flex gap-4">
        {["Yes", "No"].map((opt) => {
          const boolVal = opt === "Yes" ? "true" : "false";
          return (
            <label key={opt} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name={name}
                value={boolVal}
                checked={value === boolVal}
                onChange={() => setValue(boolVal)}
                className="h-4 w-4 text-blue-600"
              />
              <span
                className={`text-sm font-medium ${value === boolVal ? (opt === "Yes" ? "text-amber-600" : "text-green-600") : "text-gray-600"}`}
              >
                {opt}
              </span>
            </label>
          );
        })}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

function SuccessScreen({
  referenceNumber,
  applicationId,
  applicantName,
  missionName,
  programTitle,
}: {
  referenceNumber: string;
  applicationId: string;
  applicantName?: string;
  missionName?: string;
  programTitle?: string;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { BioDataPDF } = await import("./BioDataPDF");
      const res = await fetch(`/api/application/${applicationId}/pdf-data`);
      const data = await res.json();
      const blob = await pdf(
        <BioDataPDF
          {...data}
          referenceNumber={referenceNumber}
          submittedAt={new Date().toISOString()}
          logoUrl="/logos/1000mm-logo.png"
          sdaLogoUrl="/logos/sda-logo.png"
          missionName={missionName}
          programTitle={programTitle}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BioData-${referenceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  }, [applicationId, referenceNumber, missionName, programTitle]);

  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <svg
          className="h-10 w-10 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">
        Application Submitted!
      </h2>
      <p className="mb-6 max-w-md text-sm text-gray-500">
        Your application has been received. Your Local Mission Director will
        review it shortly.
      </p>
      <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 px-8 py-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-blue-500">
          Reference Number
        </p>
        <p className="font-mono text-2xl font-bold tracking-widest text-blue-800">
          {referenceNumber}
        </p>
        <p className="mt-1 text-xs text-blue-400">
          Keep this number for your records
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col items-center gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-6 py-3 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Generating PDF…
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Bio Data PDF
            </>
          )}
        </button>
        <Link
          href="/dashboard/my-application"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-800"
        >
          Go to My Application
        </Link>
      </div>
      <p className="mt-6 text-xs text-gray-400">
        You can also download your PDF anytime from the My Application page.
      </p>
    </div>
  );
}

export function Page4Application({
  applicationId,
  defaultValues,
  onBack,
  applicantName,
  missionName,
  programTitle,
}: Props) {
  const d = defaultValues;
  const docs = d?.documents ?? [];

  const isUnder21 = d?.applicantDateOfBirth
    ? calcAge(d.applicantDateOfBirth) < 21
    : false;

  const DOCUMENTS: DocField[] = [
    ...BASE_DOCUMENTS,
    {
      name: "parentsConsent",
      kind: "PARENTS_CONSENT",
      label: "Parent's Consent Form",
      required: isUnder21,
      hint: isUnder21
        ? "Required — applicant is under 21. PDF or image, max 400 KB."
        : "Optional. PDF or image, max 400 KB.",
    },
  ];

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [missionaryDesire, setMissionaryDesire] = useState(
    d?.missionaryDesire ?? "",
  );
  const [districtPastorName, setDistrictPastorName] = useState(
    d?.districtPastorName ?? "",
  );
  const [districtPastorMobile, setDistrictPastorMobile] = useState(
    d?.districtPastorMobile ?? "",
  );
  const [districtPastorEmail, setDistrictPastorEmail] = useState(
    d?.districtPastorEmail ?? "",
  );
  const [submitted, setSubmitted] = useState<{
    referenceNumber: string;
    applicationId: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setServerError(null);

    if (!declarationAccepted) {
      setErrors({
        declarationAccepted: "You must accept the declaration to submit.",
      });
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("__applicationId", applicationId);
    formData.set("declarationAccepted", "true");

    const result = await submitApplicationAction(null as any, formData);

    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      setServerError(result.error ?? null);
      setLoading(false);
      return;
    }

    setSubmitted({
      referenceNumber: result.referenceNumber!,
      applicationId: result.applicationId!,
    });
  }

  if (submitted) {
    return (
      <FormCard>
        <SuccessScreen
          referenceNumber={submitted.referenceNumber}
          applicationId={submitted.applicationId}
          applicantName={applicantName}
          missionName={missionName}
          programTitle={programTitle}
        />
      </FormCard>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <FormCard>
        {/* Instructions */}
        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <h3 className="mb-1 text-sm font-semibold text-blue-900">
            Before You Submit
          </h3>
          <ul className="list-inside list-disc space-y-1 text-xs text-blue-800">
            <li>
              Make sure all information in the previous pages is accurate.
            </li>
            <li>
              Upload all required documents. Missing documents may delay your
              review.
            </li>
            <li>
              Once submitted, you cannot edit your application unless it is
              returned to you.
            </li>
            <li>
              You will receive a reference number and a downloadable PDF after
              submission.
            </li>
          </ul>
        </div>

        {/* District Pastor Details */}
        <SectionHeading
          title="District Pastor Details"
          description="Contact details of the district pastor who recommends you — used to verify your recommendation."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Pastor's Name" required error={errors.districtPastorName}>
            <Input
              name="districtPastorName"
              placeholder="Full name"
              value={districtPastorName}
              onChange={(e) => setDistrictPastorName(e.target.value)}
              error={errors.districtPastorName}
            />
          </Field>
          <Field label="Mobile No" required error={errors.districtPastorMobile}>
            <Input
              name="districtPastorMobile"
              placeholder="01XXXXXXXXX"
              value={districtPastorMobile}
              onChange={(e) => setDistrictPastorMobile(e.target.value)}
              error={errors.districtPastorMobile}
            />
          </Field>
          <Field label="Email" error={errors.districtPastorEmail}>
            <Input
              name="districtPastorEmail"
              type="email"
              placeholder="pastor@example.com"
              value={districtPastorEmail}
              onChange={(e) => setDistrictPastorEmail(e.target.value)}
              error={errors.districtPastorEmail}
            />
          </Field>
        </div>

        {/* Missionary Desire */}
        <SectionHeading
          title="Missionary Desire"
          description="Describe in your own words why you want to become a missionary."
        />
        <Field
          label="Why do you want to serve as a missionary?"
          required
          error={errors.missionaryDesire}
        >
          <Textarea
            name="missionaryDesire"
            rows={5}
            placeholder="Share your calling, motivation, and how you hope to serve..."
            value={missionaryDesire}
            onChange={(e) => setMissionaryDesire(e.target.value)}
            error={errors.missionaryDesire}
          />
        </Field>

        {/* Declarations */}
        <div className="mt-6">
          <SectionHeading
            title="Declarations"
            description="Please answer honestly. A 'Yes' answer does not automatically disqualify your application."
          />
          <div className="flex flex-col gap-3">
            <YesNoField
              name="courtRecord"
              label="Criminal / Court Record"
              description="Do you have any previous criminal conviction or pending court case?"
              initialValue={d?.courtRecord}
            />
            <YesNoField
              name="healthCondition"
              label="Health Condition"
              description="Do you have any significant physical or mental health condition that may affect your missionary service?"
              initialValue={d?.healthCondition}
            />
            <YesNoField
              name="badHabits"
              label="Harmful Habits"
              description="Do you currently have any habits that you consider harmful to your faith or ministry?"
              initialValue={d?.badHabits}
            />
          </div>
        </div>

        {/* Document uploads */}
        <div className="mt-6">
          <SectionHeading title="Supporting Documents" />
          <div className="flex flex-col gap-5">
            {DOCUMENTS.map((doc) => (
              <Field
                key={doc.name}
                label={doc.label}
                required={doc.required}
                error={errors[doc.name]}
              >
                <FileInput
                  name={doc.name}
                  accept="image/jpeg,image/png,application/pdf"
                  hint={doc.hint}
                  error={errors[doc.name]}
                  existingFile={docs.find((d) => d.kind === doc.kind) ?? null}
                />
              </Field>
            ))}
          </div>
        </div>

        {/* Final declaration — intentionally not pre-checked */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={declarationAccepted}
              onChange={(e) => setDeclarationAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">
              I declare that all the information I have provided in this
              application is true and accurate to the best of my knowledge. I
              understand that providing false information may result in
              disqualification or removal from the programme.
            </span>
          </label>
          {errors.declarationAccepted && (
            <p className="mt-2 text-xs text-red-500">
              {errors.declarationAccepted}
            </p>
          )}
        </div>

        <FormNav
          onBack={onBack}
          nextLabel="Submit Application"
          loading={loading}
        />
      </FormCard>
    </form>
  );
}
