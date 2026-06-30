"use client";

import { useActionState, useState } from "react";
import { sendBulkEmailAction } from "@/actions/bulkEmail";

const AUDIENCES = [
  { value: "all_users",   label: "All Users",        desc: "Everyone with a verified account" },
  { value: "missionaries",label: "Active Missionaries", desc: "Trainees currently on mission field" },
  { value: "trainees",    label: "All Trainees",     desc: "All registered trainee accounts" },
  { value: "trainers",    label: "Trainers",         desc: "All trainer accounts" },
  { value: "directors",   label: "Directors & Leadership", desc: "Main, Associate, Local Directors + Secretaries" },
  { value: "admins",      label: "Admins Only",      desc: "System administrators" },
];

const FROM_OPTIONS = [
  { value: "info",   label: "info@1000mm.org.bd",   desc: "General / organizational messages" },
  { value: "donate", label: "donate@1000mm.org.bd", desc: "Donation appeals & financial updates" },
];

type Counts = Record<string, number>;

export function BulkEmailForm({ counts }: { counts: Counts }) {
  const [state, action, pending] = useActionState(sendBulkEmailAction, { ok: false });
  const [audience, setAudience] = useState("all_users");
  const [confirmed, setConfirmed] = useState(false);

  const recipientCount = counts[audience] ?? 0;

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-green-100 bg-green-50 px-8 py-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-green-800">Emails Sent Successfully</h2>
        <p className="mt-1 text-sm text-green-600">
          {state.sent} email{state.sent !== 1 ? "s" : ""} delivered
          {state.skipped ? ` · ${state.skipped} skipped (no valid email)` : ""}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-xl bg-green-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
        >
          Send Another
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      {state.error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* From */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-gray-700">From Address</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {FROM_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-teal-400 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50 transition-colors"
            >
              <input
                type="radio"
                name="fromEmail"
                value={opt.value}
                defaultChecked={opt.value === "info"}
                className="mt-0.5 accent-teal-600"
              />
              <div>
                <p className="text-xs font-semibold text-gray-900 font-mono">{opt.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
        {state.fieldErrors?.fromEmail && (
          <p className="mt-1 text-xs text-red-500">{state.fieldErrors.fromEmail}</p>
        )}
      </div>

      {/* Audience */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-gray-700">
          Recipient Audience
          {recipientCount > 0 && (
            <span className="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
              ~{recipientCount} recipients
            </span>
          )}
        </label>
        <select
          name="audience"
          value={audience}
          onChange={(e) => { setAudience(e.target.value); setConfirmed(false); }}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
        >
          {AUDIENCES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label} — {a.desc}
            </option>
          ))}
        </select>
        {state.fieldErrors?.audience && (
          <p className="mt-1 text-xs text-red-500">{state.fieldErrors.audience}</p>
        )}
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="mb-2 block text-xs font-semibold text-gray-700">
          Subject Line
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          placeholder="e.g. Important Update from 1000MM Bangladesh"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
        />
        {state.fieldErrors?.subject && (
          <p className="mt-1 text-xs text-red-500">{state.fieldErrors.subject}</p>
        )}
      </div>

      {/* Body */}
      <div>
        <label htmlFor="body" className="mb-2 block text-xs font-semibold text-gray-700">
          Message Body
          <span className="ml-1.5 font-normal text-gray-400">(plain text — blank lines create new paragraphs)</span>
        </label>
        <textarea
          id="body"
          name="body"
          rows={10}
          placeholder="Write your message here..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 resize-none"
        />
        {state.fieldErrors?.body && (
          <p className="mt-1 text-xs text-red-500">{state.fieldErrors.body}</p>
        )}
      </div>

      {/* Confirm */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="h-4 w-4 rounded accent-teal-600"
        />
        <span className="text-xs text-gray-600">
          I confirm sending this email to{" "}
          <strong>{recipientCount > 0 ? `~${recipientCount}` : "the selected"}</strong>{" "}
          recipient{recipientCount !== 1 ? "s" : ""}. This action cannot be undone.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending || !confirmed}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending…
          </>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            Send Bulk Email
          </>
        )}
      </button>
    </form>
  );
}
