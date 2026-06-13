"use client";

import { useState } from "react";
import { FormProgress } from "./FormProgress";
import { Page1PersonalDetails } from "./Page1PersonalDetails";
import { Page2FamilyDetails } from "./Page2FamilyDetails";
import { Page3Education } from "./Page3Education";
import { Page4Application } from "./Page4Application";

// A single uploaded document record (subset of ApplicationDocument)
export type UploadedDoc = {
  kind: string;
  fileName: string;
  educationEntryIndex: number | null;
};

// Shape of the hydrated draft passed from the server component
export type ExistingDraft = {
  id: string;
  // Page 1
  applicantFullName: string;
  applicantFullNameBangla: string;
  applicantDateOfBirth: string; // "YYYY-MM-DD"
  applicantGender: string;
  applicantBloodType: string;
  applicantMaritalStatus: string;
  applicantDenomination: string;
  applicantMobileNo: string;
  applicantEmail: string;
  applicantPlaceOfBirth: string;
  applicantHeight: string | number;
  applicantWeight: string | number;
  applicantChurchName: string;
  applicantDateOfBaptism: string; // "YYYY-MM-DD"
  applicantWorkplace: string;
  presentAddressDistrict: string;
  presentAddressUpazila: string;
  presentAddressPostOffice: string;
  presentAddressVillage: string;
  permanentSameAsPresent: boolean;
  permanentAddressDistrict: string;
  permanentAddressUpazila: string;
  permanentAddressPostOffice: string;
  permanentAddressVillage: string;
  // Page 2
  fatherName: string;
  fatherAge: string | number;
  fatherReligion: string;
  fatherChurchName: string;
  motherName: string;
  motherAge: string | number;
  motherReligion: string;
  motherChurchName: string;
  familyMobileNo: string;
  familyEmail: string;
  // Page 3
  educationEntries: Array<{
    id: string;
    degree: string;
    institutionName: string;
    gpa: string;
    passingYear: string;
  }> | null;
  // Page 4
  missionaryDesire: string;
  courtRecord: string; // "true" | "false" | ""
  healthCondition: string;
  badHabits: string;
  // All uploaded documents for this draft
  documents: UploadedDoc[];
};

export type FormProps = {
  applicantName: string;
  missionCode: string;
  missionName: string;
  windowOpen: boolean;
  windowCloseDate: string | null;
  programTitle: string | null;
  existingDraft: ExistingDraft | null;
};

const STEPS = [
  { label: "Personal Details", short: "Personal" },
  { label: "Family Details", short: "Family" },
  { label: "Education", short: "Education" },
  { label: "Application", short: "Application" },
];

export function BioDataForm({
  applicantName,
  missionCode,
  missionName,
  windowOpen,
  windowCloseDate,
  programTitle,
  existingDraft,
}: FormProps) {
  const [step, setStep] = useState(1);
  const [applicationId, setApplicationId] = useState<string | null>(
    existingDraft?.id ?? null,
  );

  if (!windowOpen) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-7 w-7 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-amber-900">
            No Open Application Window
          </h2>
          <p className="text-sm text-amber-700">
            There is no active application window for{" "}
            <strong>{missionName}</strong> right now. Please check back later or
            contact your Local Mission Director.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-blue-600">{missionName}</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Missionary Training Application
        </h1>
        {programTitle && (
          <p className="mt-1 text-sm text-gray-500">
            Program:{" "}
            <span className="font-medium text-gray-700">{programTitle}</span>
          </p>
        )}
        {windowCloseDate && (
          <p className="mt-1 text-xs text-gray-400">
            Application closes:{" "}
            {new Date(windowCloseDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Progress */}
      <FormProgress steps={STEPS} currentStep={step} />

      {/* Pages */}
      <div className="mt-8">
        {step === 1 && (
          <Page1PersonalDetails
            applicationId={applicationId}
            defaultValues={existingDraft ?? undefined}
            onNext={(id) => {
              setApplicationId(id);
              setStep(2);
            }}
          />
        )}
        {step === 2 && (
          <Page2FamilyDetails
            applicationId={applicationId!}
            defaultValues={existingDraft ?? undefined}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Page3Education
            applicationId={applicationId!}
            defaultValues={existingDraft ?? undefined}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <Page4Application
            applicationId={applicationId!}
            defaultValues={existingDraft ?? undefined}
            onBack={() => setStep(3)}
            applicantName={applicantName}
            missionName={missionName}
            programTitle={programTitle ?? undefined}
          />
        )}
      </div>
    </div>
  );
}
