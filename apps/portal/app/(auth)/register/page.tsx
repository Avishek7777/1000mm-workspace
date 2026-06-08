"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type FormState } from "@/lib/auth/actions";

const initial: FormState = { ok: false };

const MISSIONS = [
  { code: "EBM", name: "Eastern Bangladesh Mission (EBM)" },
  { code: "NBM", name: "Northern Bangladesh Mission (NBM)" },
  { code: "SBM", name: "Southern Bangladesh Mission (SBM)" },
  { code: "WBM", name: "Western Bangladesh Mission (WBM)" },
];

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initial);
  const fe = state.fieldErrors ?? {};

  return (
    <div className="mx-auto max-w-md py-12 px-6">
      <h1 className="text-2xl font-medium mb-2">Create your account</h1>
      <p className="text-sm text-gray-600 mb-8">
        For prospective trainees. Existing staff should sign in directly.
      </p>

      {state.error && (
        <div className="mb-6 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <Field
          id="fullName"
          name="fullName"
          label="Full name"
          required
          autoComplete="name"
          error={fe.fullName}
        />
        <Field
          id="email"
          name="email"
          type="email"
          label="Email"
          required
          autoComplete="email"
          error={fe.email}
        />
        <Field
          id="phone"
          name="phone"
          label="Phone (optional)"
          autoComplete="tel"
          error={fe.phone}
        />

        <div>
          <label
            htmlFor="homeMissionCode"
            className="block text-sm font-medium mb-1"
          >
            Local Mission
          </label>
          <select
            id="homeMissionCode"
            name="homeMissionCode"
            required
            defaultValue=""
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white"
          >
            <option value="" disabled>
              Select your Local Mission
            </option>
            {MISSIONS.map((m) => (
              <option key={m.code} value={m.code}>
                {m.name}
              </option>
            ))}
          </select>
          {fe.homeMissionCode && (
            <p className="mt-1 text-xs text-red-700">{fe.homeMissionCode}</p>
          )}
        </div>

        <Field
          id="password"
          name="password"
          type="password"
          label="Password (min 8 characters)"
          required
          autoComplete="new-password"
          error={fe.password}
        />
        <Field
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm password"
          required
          autoComplete="new-password"
          error={fe.confirmPassword}
        />

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center">
        Already have an account?{" "}
        <Link href="./" className="text-blue-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required,
  autoComplete,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
