"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction, type FormState } from "@/lib/auth/actions";

const initial: FormState = { ok: false };

export function RegisterForm({
  missions,
}: {
  missions: { code: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(registerAction, initial);
  const fe = state.fieldErrors ?? {};
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/40 bg-white/65 shadow-xl backdrop-blur-md">
      {/* Brand header */}
      <div
        className="relative px-7 py-7 text-center"
        style={{ background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)" }}
      >
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-white/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/1000mm-logo.png" alt="1000MM Logo" width={36} height={36} />
        </div>
        <p className="text-sm font-semibold tracking-wide text-white">
          1000 Missionary Movement Bangladesh
        </p>
      </div>

      {/* Body */}
      <div className="px-7 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#0b3d49]">Create your account</h1>
        <p className="mt-1.5 mb-7 text-sm text-[#5b6e73]">
          For prospective trainees. Existing staff should sign in directly.
        </p>

        {state.ok && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            <p className="font-semibold mb-1">Check your email</p>
            <p className="text-green-700 leading-relaxed">
              We sent a verification link to your inbox. Click the link to
              activate your account, then sign in.
            </p>
          </div>
        )}

        {state.error && !state.ok && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            {state.error}
          </div>
        )}

        {!state.ok && <form action={formAction} className="space-y-4">
          <Field id="fullName" name="fullName" label="Full name" required autoComplete="name" error={fe.fullName} />
          <Field id="email" name="email" type="email" label="Email" required autoComplete="email" error={fe.email} />
          <Field id="phone" name="phone" label="Phone" required autoComplete="tel" error={fe.phone} />

          <div>
            <label
              htmlFor="homeMissionCode"
              className="mb-1 block text-sm font-medium text-[#0b3d49]"
            >
              Local Mission<span className="text-red-500"> *</span>
            </label>
            <select
              id="homeMissionCode"
              name="homeMissionCode"
              required
              defaultValue=""
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#0b3d49] outline-none transition focus:border-[#007f98] focus:ring-2 focus:ring-[#007f98]/20 ${
                fe.homeMissionCode ? "border-red-400" : "border-gray-300"
              }`}
            >
              <option value="" disabled>Select your Local Mission</option>
              {missions.map((m) => (
                <option key={m.code} value={m.code}>{m.name}</option>
              ))}
            </select>
            {fe.homeMissionCode && (
              <p className="mt-1 text-xs text-red-700">{fe.homeMissionCode}</p>
            )}
          </div>

          <PasswordField id="password" name="password" label="Password (min 8 characters)" show={showPwd} onToggle={() => setShowPwd(v => !v)} autoComplete="new-password" error={fe.password} />
          <PasswordField id="confirmPassword" name="confirmPassword" label="Confirm password" show={showPwd} onToggle={() => setShowPwd(v => !v)} autoComplete="new-password" error={fe.confirmPassword} />

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "linear-gradient(90deg, #007f98 0%, #f97316 100%)" }}
          >
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>}

        <p className="mt-6 text-center text-sm text-[#5b6e73]">
          Already have an account?{" "}
          <Link
            href="./"
            className="font-medium text-[#007f98] underline decoration-[#f97316] underline-offset-2 hover:text-[#005f72]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  id, name, label, type = "text", required, autoComplete, error,
}: {
  id: string; name: string; label: string; type?: string;
  required?: boolean; autoComplete?: string; error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-[#0b3d49]">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className={`w-full rounded-lg border px-3 py-2 text-sm text-[#0b3d49] outline-none transition focus:border-[#007f98] focus:ring-2 focus:ring-[#007f98]/20 ${
          error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

function PasswordField({
  id, name, label, show, onToggle, autoComplete, error,
}: {
  id: string; name: string; label: string;
  show: boolean; onToggle: () => void;
  autoComplete?: string; error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-[#0b3d49]">
        {label}<span className="text-red-500"> *</span>
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          required
          autoComplete={autoComplete}
          className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm text-[#0b3d49] outline-none transition focus:border-[#007f98] focus:ring-2 focus:ring-[#007f98]/20 ${
            error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
          }`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
