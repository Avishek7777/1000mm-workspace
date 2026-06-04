"use client";

import { useState } from "react";
import { submitApplicationAction } from "@/actions/application";
import {
  Field,
  Textarea,
  FileInput,
  SectionHeading,
  FormCard,
  FormNav,
} from "./FormFields";

type Props = {
  applicationId: string;
  onBack: () => void;
};

type DocField = {
  name: string;
  label: string;
  hint: string;
  required?: boolean;
};

const DOCUMENTS: DocField[] = [
  {
    name: "districtPastorRecommendation",
    label: "District Pastor's Recommendation Letter",
    hint: "Letter from your district pastor. PDF or image, max 1 MB.",
    required: true,
  },
  {
    name: "baptismCertificate",
    label: "Baptism Certificate",
    hint: "Your official baptism certificate. PDF or image, max 400 KB.",
  },
  {
    name: "nid",
    label: "National ID Card (NID)",
    hint: "Your NID scan. PDF or image, max 400 KB.",
  },
  {
    name: "birthCertificate",
    label: "Birth Certificate",
    hint: "Your birth certificate. PDF or image, max 400 KB.",
  },
  {
    name: "parentPassportPhoto",
    label: "Parent's Passport-size Photo",
    hint: "Passport-sized photo of one parent (not a passport scan). JPG or PNG, max 400 KB.",
  },
  {
    name: "parentsConsent",
    label: "Parent's Consent Form",
    hint: "Required if under 21. PDF or image, max 400 KB.",
  },
  {
    name: "letterOfIntent",
    label: "Letter of Intent",
    hint: "Your handwritten letter of intent / commitment. PDF or image, max 1 MB.",
  },
];

function YesNoField({
  name,
  label,
  description,
}: {
  name: string;
  label: string;
  description: string;
}) {
  const [value, setValue] = useState<string>("");

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
      {/* Hidden input so FormData always has the value */}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

export function Page4Application({ applicationId, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

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
    }
    // On success, the action redirects — nothing more to do here.
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
            <li>You will receive a reference number after submission.</li>
          </ul>
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
            />
            <YesNoField
              name="healthCondition"
              label="Health Condition"
              description="Do you have any significant physical or mental health condition that may affect your missionary service?"
            />
            <YesNoField
              name="badHabits"
              label="Harmful Habits"
              description="Do you currently have any habits that you consider harmful to your faith or ministry (e.g. substance use)?"
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
                />
              </Field>
            ))}
          </div>
        </div>

        {/* Final declaration */}
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
