"use client";

import { useState } from "react";
import { saveDraftAction } from "@/actions/application";
import { Religion } from "@prisma/client";
import {
  Field,
  Input,
  Select,
  FileInput,
  SectionHeading,
  FormCard,
  FormNav,
} from "./FormFields";

type Props = {
  applicationId: string;
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
}: {
  prefix: "father" | "mother";
  title: string;
  errors: Record<string, string>;
}) {
  const [religion, setReligion] = useState("");

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
        />
      </Field>
    </div>
  );
}

export function Page2FamilyDetails({ applicationId, onBack, onNext }: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

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

        <ParentSection prefix="father" title="Father" errors={errors} />

        <div className="my-6 border-t border-gray-100" />

        <ParentSection prefix="mother" title="Mother" errors={errors} />

        <div className="my-6 border-t border-gray-100" />

        {/* Parents' contact */}
        <SectionHeading title="Parents' Contact" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Parents' Mobile No" error={errors.familyMobileNo}>
            <Input
              name="familyMobileNo"
              placeholder="01X-XXXXXXXX"
              maxLength={11}
              error={errors.familyMobileNo}
            />
          </Field>
          <Field label="Parents' Email" error={errors.familyEmail}>
            <Input
              type="email"
              name="familyEmail"
              placeholder="parent@example.com"
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
