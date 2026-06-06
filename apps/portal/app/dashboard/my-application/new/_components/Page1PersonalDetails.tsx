"use client";

import { useState, useRef } from "react";
import { saveDraftAction } from "@/actions/application";
import addressMap from "@/data/bd-address-map.json";
import {
  Field,
  Input,
  Select,
  FileInput,
  SectionHeading,
  FormCard,
  FormNav,
} from "./FormFields";
import type { ExistingDraft } from "./BioDataForm";

const DISTRICTS = Object.keys(addressMap).sort();
const UPAZILAS: Record<string, string[]> = addressMap;

type Props = {
  applicationId: string | null;
  defaultValues?: ExistingDraft;
  onNext: (applicationId: string) => void;
};

export function Page1PersonalDetails({
  applicationId,
  defaultValues,
  onNext,
}: Props) {
  const d = defaultValues;
  const docs = d?.documents ?? [];

  // Existing uploaded doc lookups
  const existingPhoto =
    docs.find((doc) => doc.kind === "PROFILE_PHOTO") ?? null;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const [permanentSameAsPresent, setPermanentSameAsPresent] = useState(
    d?.permanentSameAsPresent ?? false,
  );
  const [presentDistrict, setPresentDistrict] = useState(
    d?.presentAddressDistrict ?? "",
  );
  const [permanentDistrict, setPermanentDistrict] = useState(
    d?.permanentAddressDistrict ?? "",
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [fullName, setFullName] = useState(d?.applicantFullName ?? "");
  const [fullNameBangla, setFullNameBangla] = useState(
    d?.applicantFullNameBangla ?? "",
  );
  const [dob, setDob] = useState(d?.applicantDateOfBirth ?? "");
  const [gender, setGender] = useState(d?.applicantGender ?? "");
  const [bloodType, setBloodType] = useState(d?.applicantBloodType ?? "");
  const [placeOfBirth, setPlaceOfBirth] = useState(
    d?.applicantPlaceOfBirth ?? "",
  );
  const [maritalStatus, setMaritalStatus] = useState(
    d?.applicantMaritalStatus ?? "",
  );
  const [denomination, setDenomination] = useState(
    d?.applicantDenomination ?? "",
  );
  const [churchName, setChurchName] = useState(d?.applicantChurchName ?? "");
  const [dateOfBaptism, setDateOfBaptism] = useState(
    d?.applicantDateOfBaptism ?? "",
  );
  const [height, setHeight] = useState(
    d?.applicantHeight != null && d.applicantHeight !== ""
      ? String(d.applicantHeight)
      : "",
  );
  const [weight, setWeight] = useState(
    d?.applicantWeight != null && d.applicantWeight !== ""
      ? String(d.applicantWeight)
      : "",
  );
  const [workplace, setWorkplace] = useState(d?.applicantWorkplace ?? "");
  const [mobileNo, setMobileNo] = useState(d?.applicantMobileNo ?? "");
  const [email, setEmail] = useState(d?.applicantEmail ?? "");
  const [presentUpazila, setPresentUpazila] = useState(
    d?.presentAddressUpazila ?? "",
  );
  const [presentPostOffice, setPresentPostOffice] = useState(
    d?.presentAddressPostOffice ?? "",
  );
  const [presentVillage, setPresentVillage] = useState(
    d?.presentAddressVillage ?? "",
  );
  const [permanentUpazila, setPermanentUpazila] = useState(
    d?.permanentAddressUpazila ?? "",
  );
  const [permanentPostOffice, setPermanentPostOffice] = useState(
    d?.permanentAddressPostOffice ?? "",
  );
  const [permanentVillage, setPermanentVillage] = useState(
    d?.permanentAddressVillage ?? "",
  );

  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setServerError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("__page", "1");
    if (applicationId) formData.set("__applicationId", applicationId);
    formData.set("permanentSameAsPresent", String(permanentSameAsPresent));

    const result = await saveDraftAction(null as any, formData);

    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      setServerError(result.error ?? null);
      setLoading(false);
      return;
    }

    onNext(result.applicationId!);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <FormCard>
        <SectionHeading
          title="Personal Details"
          description="Fill in your personal information exactly as it appears on your official documents."
        />

        {/* Photo + Name row */}
        <div className="mb-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Profile photo */}
          <div className="flex flex-col items-center gap-2">
            <div className="h-28 w-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  <svg
                    className="h-10 w-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <label className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
              {existingPhoto && !photoPreview
                ? "Replace Photo"
                : "Upload Photo"}
              <input
                type="file"
                name="profilePhoto"
                accept="image/jpeg,image/png,image/webp"
                className="file-input-hidden"
                onChange={handlePhotoChange}
              />
            </label>
            {existingPhoto && !photoPreview && (
              <p className="flex items-center gap-1 text-xs text-green-600">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {existingPhoto.fileName}
              </p>
            )}
            <p className="text-center text-xs text-gray-400">
              Max 2 MB
              <br />
              JPG or PNG
            </p>
            {errors.profilePhoto && (
              <p className="text-xs text-red-500">{errors.profilePhoto}</p>
            )}
          </div>

          {/* Name fields */}
          <div className="flex flex-1 flex-col gap-4">
            <Field
              label="Full Name (English)"
              required
              error={errors.applicantFullName}
            >
              <Input
                name="applicantFullName"
                placeholder="As on official document"
                maxLength={36}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.applicantFullName}
              />
            </Field>
            <Field
              label="Full Name (Bangla)"
              error={errors.applicantFullNameBangla}
            >
              <Input
                name="applicantFullNameBangla"
                placeholder="বাংলায় নাম"
                dir="auto"
                maxLength={50}
                value={fullNameBangla}
                onChange={(e) => setFullNameBangla(e.target.value)}
                error={errors.applicantFullNameBangla}
              />
            </Field>
          </div>
        </div>

        {/* Row: DOB, Gender, Blood Type */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field
            label="Date of Birth"
            required
            error={errors.applicantDateOfBirth}
          >
            <Input
              type="date"
              name="applicantDateOfBirth"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              error={errors.applicantDateOfBirth}
            />
          </Field>
          <Field label="Gender" required error={errors.applicantGender}>
            <Select
              name="applicantGender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              error={errors.applicantGender}
            >
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </Select>
          </Field>
          <Field label="Blood Type" error={errors.applicantBloodType}>
            <Select
              name="applicantBloodType"
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              error={errors.applicantBloodType}
            >
              <option value="">Select</option>
              {[
                "A_POS",
                "A_NEG",
                "B_POS",
                "B_NEG",
                "AB_POS",
                "AB_NEG",
                "O_POS",
                "O_NEG",
              ].map((v) => (
                <option key={v} value={v}>
                  {v.replace("_", " ").replace("POS", "+").replace("NEG", "-")}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {/* Row: Place of Birth, Marital Status, Denomination */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Place of Birth" error={errors.applicantPlaceOfBirth}>
            <Input
              name="applicantPlaceOfBirth"
              placeholder="City / Village"
              maxLength={50}
              value={placeOfBirth}
              onChange={(e) => setPlaceOfBirth(e.target.value)}
              error={errors.applicantPlaceOfBirth}
            />
          </Field>
          <Field label="Marital Status" error={errors.applicantMaritalStatus}>
            <Select
              name="applicantMaritalStatus"
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value)}
              error={errors.applicantMaritalStatus}
            >
              <option value="">Select</option>
              <option value="SINGLE">Single</option>
              <option value="MARRIED">Married</option>
              <option value="DIVORCED">Divorced</option>
              <option value="WIDOWED">Widowed</option>
            </Select>
          </Field>
          <Field label="Denomination" error={errors.applicantDenomination}>
            <Select
              name="applicantDenomination"
              value={denomination}
              onChange={(e) => setDenomination(e.target.value)}
              error={errors.applicantDenomination}
            >
              <option value="">Select</option>
              <option value="SEVENTH_DAY_ADVENTIST">
                Seventh-day Adventist
              </option>
              <option value="BAPTIST">Baptist</option>
              <option value="CATHOLIC">Catholic</option>
              <option value="METHODIST">Methodist</option>
              <option value="PRESBYTERIAN">Presbyterian</option>
              <option value="PENTECOSTAL">Pentecostal</option>
              <option value="ANGLICAN">Anglican</option>
              <option value="LUTHERAN">Lutheran</option>
              <option value="ORTHODOX">Orthodox</option>
              <option value="OTHER">Other</option>
            </Select>
          </Field>
        </div>

        {/* Row: Church Name, Baptism Date */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Church Name" error={errors.applicantChurchName}>
            <Input
              name="applicantChurchName"
              placeholder="Your home church"
              maxLength={70}
              value={churchName}
              onChange={(e) => setChurchName(e.target.value)}
              error={errors.applicantChurchName}
            />
          </Field>
          <Field label="Date of Baptism" error={errors.applicantDateOfBaptism}>
            <Input
              type="date"
              name="applicantDateOfBaptism"
              value={dateOfBaptism}
              onChange={(e) => setDateOfBaptism(e.target.value)}
              error={errors.applicantDateOfBaptism}
            />
          </Field>
        </div>

        {/* Row: Height, Weight, Workplace */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Height (cm)" error={errors.applicantHeight}>
            <Input
              type="number"
              name="applicantHeight"
              placeholder="e.g. 170"
              min={100}
              max={250}
              step={0.1}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              error={errors.applicantHeight}
            />
          </Field>
          <Field label="Weight (kg)" error={errors.applicantWeight}>
            <Input
              type="number"
              name="applicantWeight"
              placeholder="e.g. 60"
              min={30}
              max={300}
              step={0.1}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              error={errors.applicantWeight}
            />
          </Field>
          <Field
            label="Present Workplace / Occupation"
            error={errors.applicantWorkplace}
          >
            <Input
              name="applicantWorkplace"
              placeholder="Job or occupation"
              maxLength={100}
              value={workplace}
              onChange={(e) => setWorkplace(e.target.value)}
              error={errors.applicantWorkplace}
            />
          </Field>
        </div>

        {/* Row: Mobile, Email */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Mobile No" error={errors.applicantMobileNo}>
            <Input
              name="applicantMobileNo"
              placeholder="01X-XXXXXXXX"
              maxLength={11}
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value)}
              error={errors.applicantMobileNo}
            />
          </Field>
          <Field label="Email Address" error={errors.applicantEmail}>
            <Input
              type="email"
              name="applicantEmail"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.applicantEmail}
            />
          </Field>
        </div>

        {/* Present Address */}
        <SectionHeading title="Present Address" />
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="District" error={errors.presentAddressDistrict}>
            <Select
              name="presentAddressDistrict"
              value={presentDistrict}
              onChange={(e) => {
                setPresentDistrict(e.target.value);
                setPresentUpazila("");
              }}
              error={errors.presentAddressDistrict}
            >
              <option value="">Select District</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Upazila / Police Station"
            error={errors.presentAddressUpazila}
          >
            <Select
              name="presentAddressUpazila"
              value={presentUpazila}
              onChange={(e) => setPresentUpazila(e.target.value)}
              error={errors.presentAddressUpazila}
              disabled={!presentDistrict}
            >
              <option value="">
                {presentDistrict ? "Select Upazila" : "Select District first"}
              </option>
              {(UPAZILAS[presentDistrict] ?? []).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Post Office" error={errors.presentAddressPostOffice}>
            <Input
              name="presentAddressPostOffice"
              placeholder="Post office name"
              maxLength={50}
              value={presentPostOffice}
              onChange={(e) => setPresentPostOffice(e.target.value)}
              error={errors.presentAddressPostOffice}
            />
          </Field>
          <Field label="Village / Road" error={errors.presentAddressVillage}>
            <Input
              name="presentAddressVillage"
              placeholder="Village or road"
              maxLength={50}
              value={presentVillage}
              onChange={(e) => setPresentVillage(e.target.value)}
              error={errors.presentAddressVillage}
            />
          </Field>
        </div>

        {/* Permanent Address */}
        <div className="mb-4 flex items-center gap-2">
          <input
            id="sameAddress"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
            checked={permanentSameAsPresent}
            onChange={(e) => setPermanentSameAsPresent(e.target.checked)}
          />
          <label
            htmlFor="sameAddress"
            className="text-sm font-medium text-gray-700"
          >
            Permanent address same as present address
          </label>
        </div>

        {!permanentSameAsPresent && (
          <>
            <SectionHeading title="Permanent Address" />
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="District" error={errors.permanentAddressDistrict}>
                <Select
                  name="permanentAddressDistrict"
                  value={permanentDistrict}
                  onChange={(e) => {
                    setPermanentDistrict(e.target.value);
                    setPermanentUpazila("");
                  }}
                  error={errors.permanentAddressDistrict}
                >
                  <option value="">Select District</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Upazila / Police Station"
                error={errors.permanentAddressUpazila}
              >
                <Select
                  name="permanentAddressUpazila"
                  value={permanentUpazila}
                  onChange={(e) => setPermanentUpazila(e.target.value)}
                  error={errors.permanentAddressUpazila}
                  disabled={!permanentDistrict}
                >
                  <option value="">
                    {permanentDistrict
                      ? "Select Upazila"
                      : "Select District first"}
                  </option>
                  {(UPAZILAS[permanentDistrict] ?? []).map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Post Office"
                error={errors.permanentAddressPostOffice}
              >
                <Input
                  name="permanentAddressPostOffice"
                  placeholder="Post office name"
                  maxLength={50}
                  value={permanentPostOffice}
                  onChange={(e) => setPermanentPostOffice(e.target.value)}
                  error={errors.permanentAddressPostOffice}
                />
              </Field>
              <Field
                label="Village / Road"
                error={errors.permanentAddressVillage}
              >
                <Input
                  name="permanentAddressVillage"
                  placeholder="Village or road"
                  maxLength={50}
                  value={permanentVillage}
                  onChange={(e) => setPermanentVillage(e.target.value)}
                  error={errors.permanentAddressVillage}
                />
              </Field>
            </div>
          </>
        )}

        <FormNav isFirst nextLabel="Save & Continue →" loading={loading} />
      </FormCard>
    </form>
  );
}
