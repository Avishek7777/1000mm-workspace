"use client";

import { useState } from "react";
import { saveDraftAction } from "@/actions/application";
import {
  Field,
  Input,
  Select,
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

type EducationEntry = {
  id: string;
  degree: string;
  institutionName: string;
  gpa: string;
  passingYear: string;
  certFile: File | null;
};

const DEGREE_OPTIONS = [
  "SSC / Dakhil",
  "HSC / Alim",
  "Diploma",
  "Bachelor",
  "Master",
  "PhD",
  "Other",
];

function blankEntry(): EducationEntry {
  return {
    id: crypto.randomUUID(),
    degree: "",
    institutionName: "",
    gpa: "",
    passingYear: "",
    certFile: null,
  };
}

function EntryCard({
  entry,
  index,
  total,
  existingCert,
  onChange,
  onRemove,
}: {
  entry: EducationEntry;
  index: number;
  total: number;
  existingCert: UploadedDoc | null;
  onChange: (
    id: string,
    field: keyof EducationEntry,
    value: string | File | null,
  ) => void;
  onRemove: (id: string) => void;
}) {
  const [newCertName, setNewCertName] = useState<string | null>(null);
  const existing = !newCertName && existingCert ? existingCert.fileName : null;
  const uploaded = newCertName;

  return (
    <div className="relative rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">
          Entry {index + 1}
        </span>
        {total > 1 && (
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Degree / Level">
          <Select
            value={entry.degree}
            onChange={(e) => onChange(entry.id, "degree", e.target.value)}
          >
            <option value="">Select</option>
            {DEGREE_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Institution Name">
          <Input
            value={entry.institutionName}
            onChange={(e) =>
              onChange(entry.id, "institutionName", e.target.value)
            }
            placeholder="School / College / University"
            maxLength={100}
          />
        </Field>
        <Field label="GPA / Result" hint="e.g. 4.50 or A+">
          <Input
            value={entry.gpa}
            onChange={(e) => onChange(entry.id, "gpa", e.target.value)}
            placeholder="GPA or grade"
          />
        </Field>
        <Field label="Passing Year">
          <Input
            type="number"
            value={entry.passingYear}
            onChange={(e) => onChange(entry.id, "passingYear", e.target.value)}
            placeholder="e.g. 2020"
            min={1980}
            max={new Date().getFullYear()}
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Certificate" hint="Image or PDF, max 400 KB">
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 hover:bg-white ${existing ? "border-green-400 bg-green-50" : "border-gray-300"}`}
          >
            <svg
              className={`h-5 w-5 flex-shrink-0 ${existing || uploaded ? "text-green-500" : "text-gray-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {existing || uploaded ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              )}
            </svg>
            <span className="text-sm text-gray-500">
              {existing ? (
                <span className="font-medium text-green-700">
                  {existing} — click to replace
                </span>
              ) : uploaded ? (
                <span className="font-medium text-blue-600">{uploaded}</span>
              ) : (
                "Click to upload certificate"
              )}
            </span>
            <input
              type="file"
              name={`cert_${entry.id}`}
              accept="image/jpeg,image/png,application/pdf"
              className="file-input-hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setNewCertName(file?.name ?? null);
                onChange(entry.id, "certFile", file);
              }}
            />
          </label>
        </Field>
      </div>
    </div>
  );
}

export function Page3Education({
  applicationId,
  defaultValues,
  onBack,
  onNext,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const docs = defaultValues?.documents ?? [];

  const [entries, setEntries] = useState<EducationEntry[]>(() => {
    const saved = defaultValues?.educationEntries;
    if (saved && saved.length > 0) {
      return saved.map((e) => ({
        id: e.id ?? crypto.randomUUID(),
        degree: e.degree ?? "",
        institutionName: e.institutionName ?? "",
        gpa: e.gpa != null ? String(e.gpa) : "",
        passingYear: e.passingYear != null ? String(e.passingYear) : "",
        certFile: null,
      }));
    }
    return [blankEntry()];
  });

  function handleChange(
    id: string,
    field: keyof EducationEntry,
    value: string | File | null,
  ) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  }

  function handleRemove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function handleAdd() {
    setEntries((prev) => [...prev, blankEntry()]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setServerError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("__page", "3");
    formData.set("__applicationId", applicationId);

    const entriesJson = JSON.stringify(
      entries.map(({ certFile, ...rest }) => rest),
    );
    formData.set("educationEntries", entriesJson);

    const result = await saveDraftAction(null as any, formData);

    if (!result.ok) {
      setServerError(result.error ?? "An error occurred.");
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
          title="Educational Background"
          description="Add all your educational qualifications, starting from your highest."
        />

        <div className="flex flex-col gap-4">
          {entries.map((entry, idx) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              index={idx}
              total={entries.length}
              // Match cert doc by entry index position
              existingCert={
                docs.find(
                  (d) =>
                    d.kind === "EDUCATION_CERTIFICATE" &&
                    d.educationEntryIndex === idx,
                ) ?? null
              }
              onChange={handleChange}
              onRemove={handleRemove}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 py-3 text-sm font-medium text-blue-600 hover:border-blue-400 hover:bg-blue-50"
        >
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Another Qualification
        </button>

        <FormNav
          onBack={onBack}
          nextLabel="Save & Continue →"
          loading={loading}
        />
      </FormCard>
    </form>
  );
}
