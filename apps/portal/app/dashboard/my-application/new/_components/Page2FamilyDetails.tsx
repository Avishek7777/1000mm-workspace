"use client";

import { useState } from "react";
import { saveDraftAction } from "@/actions/application";
import {
  Field,
  Input,
  Select,
  FileInput,
  SectionHeading,
  FormCard,
  FormNav,
} from "./FormFields";
import type { ExistingDraft, UploadedDoc } from "./BioDataForm";

type Props = {
  applicationId: string;
  defaultValues?: ExistingDraft;
  onBack: () => void;
  onNext: () => void;
};

const RELIGION_OPTIONS = [
  { value: "CHRISTIANITY", label: "Christianity" },
  { value: "ISLAM", label: "Islam" },
  { value: "HINDUISM", label: "Hinduism" },
  { value: "BUDDHISM", label: "Buddhism" },
  { value: "JUDAISM", label: "Judaism" },
  { value: "OTHER", label: "Other" },
];

function ParentSection({
  prefix,
  title,
  errors,
  defaults,
  existingNid,
}: {
  prefix: "father" | "mother";
  title: string;
  errors: Record<string, string>;
  defaults?: {
    name: string;
    age: string | number;
    religion: string;
    churchName: string;
  };
  existingNid: UploadedDoc | null;
}) {
  const [name, setName] = useState(defaults?.name ?? "");
  const [age, setAge] = useState(
    defaults?.age != null && defaults.age !== "" ? String(defaults.age) : "",
  );
  const [religion, setReligion] = useState(defaults?.religion ?? "");
  const [churchName, setChurchName] = useState(defaults?.churchName ?? "");

  const nameKey = `${prefix}Name`;
  const ageKey = `${prefix}Age`;
  const religionKey = `${prefix}Religion`;
  const churchKey = `${prefix}ChurchName`;
  const nidKey = `${prefix}Nid`;

  return (
    <div>
      <SectionHeading title={title} />
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" error={errors[nameKey]}>
          <Input
            name={nameKey}
            placeholder="Full name"
            maxLength={36}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors[nameKey]}
          />
        </Field>
        <Field label="Age" error={errors[ageKey]}>
          <Input
            type="number"
            name={ageKey}
            placeholder="Age"
            min={18}
            max={100}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            error={errors[ageKey]}
          />
        </Field>
        <Field label="Religion" error={errors[religionKey]}>
          <Select
            name={religionKey}
            value={religion}
            onChange={(e) => setReligion(e.target.value)}
            error={errors[religionKey]}
          >
            <option value="">Select</option>
            {RELIGION_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
        {religion === "CHRISTIANITY" && (
          <Field label="Church Name" error={errors[churchKey]}>
            <Input
              name={churchKey}
              placeholder="Church name"
              maxLength={70}
              value={churchName}
              onChange={(e) => setChurchName(e.target.value)}
              error={errors[churchKey]}
            />
          </Field>
        )}
      </div>

      <Field
        label={`${title}'s NID`}
        error={errors[nidKey]}
        hint="Image or PDF, max 400 KB"
      >
        <FileInput
          name={nidKey}
          accept="image/jpeg,image/png,application/pdf"
          hint="JPG, PNG or PDF — max 400 KB"
          error={errors[nidKey]}
          existingFile={existingNid}
        />
      </Field>
    </div>
  );
}

export function Page2FamilyDetails({
  applicationId,
  defaultValues,
  onBack,
  onNext,
}: Props) {
  const d = defaultValues;
  const docs = d?.documents ?? [];

  const existingFatherNid =
    docs.find((doc) => doc.kind === "FATHER_NID") ?? null;
  const existingMotherNid =
    docs.find((doc) => doc.kind === "MOTHER_NID") ?? null;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [familyMobileNo, setFamilyMobileNo] = useState(d?.familyMobileNo ?? "");
  const [familyEmail, setFamilyEmail] = useState(d?.familyEmail ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setServerError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("__page", "2");
    formData.set("__applicationId", applicationId);

    const result = await saveDraftAction(null as any, formData);

    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      setServerError(result.error ?? null);
      setLoading(false);
      return;
    }

    onNext();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <FormCard>
        <SectionHeading
          title="Family Details"
          description="Information about your parents. All fields are optional but recommended."
        />

        <ParentSection
          prefix="father"
          title="Father"
          errors={errors}
          existingNid={existingFatherNid}
          defaults={
            d
              ? {
                  name: d.fatherName,
                  age: d.fatherAge,
                  religion: d.fatherReligion,
                  churchName: d.fatherChurchName,
                }
              : undefined
          }
        />

        <div className="my-6 border-t border-gray-100" />

        <ParentSection
          prefix="mother"
          title="Mother"
          errors={errors}
          existingNid={existingMotherNid}
          defaults={
            d
              ? {
                  name: d.motherName,
                  age: d.motherAge,
                  religion: d.motherReligion,
                  churchName: d.motherChurchName,
                }
              : undefined
          }
        />

        <div className="my-6 border-t border-gray-100" />

        <SectionHeading title="Parents' Contact" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Parents' Mobile No" error={errors.familyMobileNo}>
            <Input
              name="familyMobileNo"
              placeholder="01X-XXXXXXXX"
              maxLength={11}
              value={familyMobileNo}
              onChange={(e) => setFamilyMobileNo(e.target.value)}
              error={errors.familyMobileNo}
            />
          </Field>
          <Field label="Parents' Email" error={errors.familyEmail}>
            <Input
              type="email"
              name="familyEmail"
              placeholder="parent@example.com"
              value={familyEmail}
              onChange={(e) => setFamilyEmail(e.target.value)}
              error={errors.familyEmail}
            />
          </Field>
        </div>

        <FormNav
          onBack={onBack}
          nextLabel="Save & Continue →"
          loading={loading}
        />
      </FormCard>
    </form>
  );
}
