"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  CreditCard,
  Camera,
} from "lucide-react";
import Navbar from "../../components/NavBar";

type FieldError = Record<string, string>;

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  fullAddress: string;
  specialization: string;
  acceptsSelfFunding: boolean;
  requestsInvitationLetter: boolean;
}

const INITIAL: FormState = {
  fullName: "",
  email: "",
  phone: "",
  country: "",
  fullAddress: "",
  specialization: "",
  acceptsSelfFunding: false,
  requestsInvitationLetter: false,
};

const WHY_ITEMS = [
  {
    num: "01",
    title: "Shape the Next Generation",
    body: "Your expertise will directly equip young missionaries going into the field across Bangladesh.",
    color: "from-teal-400 to-emerald-500",
  },
  {
    num: "02",
    title: "Work Alongside a Global Team",
    body: "Collaborate with trainers and directors from diverse backgrounds united by one mission.",
    color: "from-orange-400 to-amber-500",
  },
  {
    num: "03",
    title: "Leave a Lasting Legacy",
    body: "The lives you invest in will multiply — your one session can impact hundreds of communities.",
    color: "from-emerald-500 to-teal-600",
  },
];

export default function BecomeATrainerPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [files, setFiles] = useState<{
    cv?: File;
    passport?: File;
    photo?: File;
  }>({});
  const [errors, setErrors] = useState<FieldError>({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [serverError, setServerError] = useState("");

  const cvRef = useRef<HTMLInputElement>(null);
  const passportRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  function set(field: keyof FormState, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => {
      const n = { ...e };
      delete n[field];
      return n;
    });
  }

  function validate(): boolean {
    const e: FieldError = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "A valid email address is required.";
    if (!form.country.trim()) e.country = "Country is required.";
    if (!form.fullAddress.trim()) e.fullAddress = "Full address is required.";
    if (!form.specialization.trim())
      e.specialization = "Please describe your area of specialization.";
    if (!files.cv) e.cv = "Please upload your CV.";
    if (!files.passport) e.passport = "Please upload a copy of your passport.";
    if (!files.photo) e.photo = "Please upload a passport-sized photo.";
    if (!form.acceptsSelfFunding)
      e.acceptsSelfFunding =
        "You must acknowledge the expense policy before applying.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    setServerError("");
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, String(v)));
    if (files.cv) body.append("cv", files.cv);
    if (files.passport) body.append("passport", files.passport);
    if (files.photo) body.append("photo", files.photo);
    try {
      const res = await fetch("/api/trainer-application", {
        method: "POST",
        body,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(
          json.error ?? "Something went wrong. Please try again.",
        );
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setServerError(err instanceof Error ? err.message : "Unexpected error.");
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24"
        style={{
          background: "linear-gradient(160deg, #fafaf9 0%, #fff7ed 100%)",
        }}
      >
        <div
          className="absolute right-[-2rem] top-1/2 -translate-y-1/2 select-none pointer-events-none text-[18vw] font-bold leading-none opacity-[0.04] text-orange-400"
          style={{ fontFamily: "Georgia, serif" }}
          aria-hidden="true"
        >
          SENT
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h2
            className="text-4xl font-bold text-stone-800"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Application{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
              }}
            >
              Received
            </span>
          </h2>
          <p
            className="mt-4 text-stone-500 leading-relaxed"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Thank you for your interest in serving with 1000MM. Our team will
            review your application and reach out to you at{" "}
            <span className="font-semibold text-stone-700">{form.email}</span>{" "}
            with next steps.
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Main page ───────────────────────────────────────────────────────────────
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #fafaf9 0%, #fff7ed 100%)",
      }}
    >
      <Navbar />
      {/* Watermark */}
      <div
        className="pointer-events-none absolute right-[-2rem] top-[10%] select-none text-[18vw] font-bold leading-none opacity-[0.04] text-orange-400"
        style={{ fontFamily: "Georgia, serif" }}
        aria-hidden="true"
      >
        1000MM
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-24">
        {/* ── Hero header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-4">
            <span
              className="h-px w-12"
              style={{ background: "linear-gradient(90deg, #16a34a, #f97316)" }}
            />
            <span
              className="text-xs font-semibold tracking-[0.25em] uppercase text-orange-500"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Join Our Team
            </span>
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold text-stone-800 leading-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Become a{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
              }}
            >
              Trainer
            </span>
          </h1>
          <p
            className="mt-4 text-stone-500 text-lg max-w-xl leading-relaxed"
            style={{ fontFamily: "Georgia, serif" }}
          >
            We welcome experienced professionals to lead training sessions for
            our missionary trainees. Your knowledge, shared for even a few days,
            can shape lives for eternity.
          </p>
        </motion.div>

        {/* ── Why join cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-16 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {WHY_ITEMS.map((item) => (
            <div
              key={item.num}
              className="relative overflow-hidden rounded-3xl border border-stone-100 bg-white p-6 shadow-sm"
            >
              <div
                className={`absolute top-0 right-0 h-14 w-14 rounded-bl-3xl rounded-tr-3xl opacity-10 bg-gradient-to-br ${item.color}`}
              />
              <span
                className="text-3xl font-bold text-transparent bg-clip-text block mb-3"
                style={{
                  backgroundImage: "linear-gradient(90deg, #007f98, #f97316)",
                  fontFamily: "Georgia, serif",
                }}
              >
                {item.num}
              </span>
              <h3
                className="mb-1.5 font-bold text-stone-800 text-sm"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {item.title}
              </h3>
              <p
                className="text-xs text-stone-500 leading-relaxed"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {item.body}
              </p>
            </div>
          ))}
        </motion.div>

        {/* ── Form card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="rounded-3xl border border-stone-100 bg-white shadow-sm overflow-hidden"
        >
          {/* Form card header bar */}
          <div
            className="h-1.5 w-full"
            style={{
              background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
            }}
          />

          <div className="p-8 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Personal Information */}
              <FormSection label="Personal Information">
                <Field label="Full Name" error={errors.fullName} required>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder="Your full legal name"
                    className={inputCls(errors.fullName)}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email Address" error={errors.email} required>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="you@example.com"
                      className={inputCls(errors.email)}
                    />
                  </Field>
                  <Field label="Phone Number" error={errors.phone} required>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+1 555 000 0000"
                      className={inputCls(errors.phone)}
                    />
                  </Field>
                </div>
                <Field label="Country" error={errors.country} required>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                    placeholder="Country of origin / residence"
                    className={inputCls(errors.country)}
                  />
                </Field>
                <Field label="Full Address" error={errors.fullAddress} required>
                  <textarea
                    value={form.fullAddress}
                    onChange={(e) => set("fullAddress", e.target.value)}
                    rows={3}
                    placeholder="Street, City, State/Province, Postal Code"
                    className={inputCls(errors.fullAddress)}
                  />
                </Field>
              </FormSection>

              {/* Specialization */}
              <FormSection label="Area of Specialization">
                <Field
                  label="What do you specialize in?"
                  error={errors.specialization}
                  hint="Describe your expertise, the topics you teach, and any relevant experience."
                  required
                >
                  <textarea
                    value={form.specialization}
                    onChange={(e) => set("specialization", e.target.value)}
                    rows={4}
                    placeholder="e.g. Public health, Biblical studies, Community development, Leadership..."
                    className={inputCls(errors.specialization)}
                  />
                </Field>
              </FormSection>

              {/* Documents */}
              <FormSection label="Documents">
                <p
                  className="text-sm text-stone-400 -mt-2"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  All three documents are required. Accepted formats: PDF, JPG,
                  PNG (max 2 MB each).
                </p>
                <div className="space-y-3">
                  <FileUpload
                    label="Curriculum Vitae (CV)"
                    icon={FileText}
                    file={files.cv}
                    error={errors.cv}
                    inputRef={cvRef}
                    accept=".pdf,.doc,.docx"
                    onChange={(f) => {
                      setFiles((p) => ({ ...p, cv: f }));
                      setErrors((e) => {
                        const n = { ...e };
                        delete n.cv;
                        return n;
                      });
                    }}
                  />
                  <FileUpload
                    label="Passport (bio-data page)"
                    icon={CreditCard}
                    file={files.passport}
                    error={errors.passport}
                    inputRef={passportRef}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(f) => {
                      setFiles((p) => ({ ...p, passport: f }));
                      setErrors((e) => {
                        const n = { ...e };
                        delete n.passport;
                        return n;
                      });
                    }}
                  />
                  <FileUpload
                    label="Passport-sized Photo"
                    icon={Camera}
                    file={files.photo}
                    error={errors.photo}
                    inputRef={photoRef}
                    accept=".jpg,.jpeg,.png"
                    onChange={(f) => {
                      setFiles((p) => ({ ...p, photo: f }));
                      setErrors((e) => {
                        const n = { ...e };
                        delete n.photo;
                        return n;
                      });
                    }}
                  />
                </div>
              </FormSection>

              {/* Acknowledgements */}
              <FormSection label="Acknowledgements">
                <div className="space-y-4">
                  <Checkbox
                    id="selfFunding"
                    checked={form.acceptsSelfFunding}
                    onChange={(v) => set("acceptsSelfFunding", v)}
                    error={errors.acceptsSelfFunding}
                    label="I understand that as a trainer I will be responsible for my own expenses, including airfare, hotel, meals, and other personal costs."
                    required
                  />
                  <Checkbox
                    id="invitationLetter"
                    checked={form.requestsInvitationLetter}
                    onChange={(v) => set("requestsInvitationLetter", v)}
                    label="I will require an official invitation letter from 1000MM (e.g. for visa purposes)."
                  />
                </div>
              </FormSection>

              {/* Error banner */}
              {status === "error" && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {serverError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === "submitting"}
                className="relative w-full overflow-hidden rounded-2xl px-6 py-4 text-base font-semibold text-white transition-opacity disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(90deg, #007f98 0%, #f97316 100%)",
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </span>
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FormSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span
          className="h-px w-6 flex-shrink-0"
          style={{ background: "linear-gradient(90deg, #16a34a, #f97316)" }}
        />
        <h2
          className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {label}
        </h2>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-medium text-stone-700"
        style={{ fontFamily: "Georgia, serif" }}
      >
        {label}
        {required && <span className="ml-0.5 text-orange-500">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p
          className="mt-1.5 text-xs text-stone-400"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {hint}
        </p>
      )}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function FileUpload({
  label,
  icon: Icon,
  file,
  error,
  inputRef,
  accept,
  onChange,
}: {
  label: string;
  icon: React.ElementType;
  file?: File;
  error?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  accept: string;
  onChange: (f: File) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
          error
            ? "border-red-200 bg-red-50"
            : file
              ? "border-emerald-200 bg-emerald-50"
              : "border-stone-200 bg-stone-50 hover:bg-stone-100"
        }`}
      >
        <Icon
          className={`h-4 w-4 flex-shrink-0 ${file ? "text-emerald-600" : "text-stone-400"}`}
        />
        <span
          className={`flex-1 truncate text-sm ${file ? "text-emerald-700" : "text-stone-400"}`}
          style={{ fontFamily: "Georgia, serif" }}
        >
          {file ? file.name : label}
        </span>
        <Upload className="h-3.5 w-3.5 flex-shrink-0 text-stone-300" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f);
        }}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Checkbox({
  id,
  checked,
  onChange,
  label,
  error,
  required,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <div className="relative mt-0.5 flex-shrink-0">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
              checked
                ? "border-teal-600 bg-teal-600"
                : error
                  ? "border-red-400"
                  : "border-stone-300"
            }`}
            onClick={() => onChange(!checked)}
          >
            {checked && (
              <svg
                className="h-3 w-3 text-white"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2 6l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
        <span
          className={`text-sm leading-relaxed ${error ? "text-red-600" : "text-stone-600"}`}
          style={{ fontFamily: "Georgia, serif" }}
        >
          {label}
          {required && <span className="ml-0.5 text-orange-500">*</span>}
        </span>
      </label>
      {error && <p className="mt-1.5 ml-8 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function inputCls(error?: string) {
  return `w-full rounded-xl border px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-300 outline-none transition-colors focus:ring-2 focus:ring-offset-1 ${
    error
      ? "border-red-200 bg-red-50 focus:ring-red-300"
      : "border-stone-200 bg-stone-50 focus:border-teal-400 focus:ring-teal-200"
  }`;
}
