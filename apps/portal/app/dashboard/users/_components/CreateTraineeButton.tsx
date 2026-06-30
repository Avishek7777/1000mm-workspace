"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTraineeAction } from "@/actions/users";

type Mission = { id: string; code: string; name: string };

export function CreateTraineeButton({ missions }: { missions: Mission[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, action, pending] = useActionState(createTraineeAction, { ok: false });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        startTransition(() => router.refresh());
      }, 1200);
    }
  }, [state.ok]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const fe = state.fieldErrors ?? {};

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Create Trainee
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Create Trainee Account</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center gap-3 px-6 py-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                  <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900">Trainee account created!</p>
              </div>
            ) : (
              <form action={action} className="px-6 py-5 space-y-4">
                {state.error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{state.error}</div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Mission <span className="text-red-500">*</span></label>
                  <select name="missionId" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500">
                    {missions.map((m) => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
                  </select>
                  {fe.missionId && <p className="mt-0.5 text-xs text-red-500">{fe.missionId}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
                  <input name="fullName" placeholder="e.g. John Das" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500" />
                  {fe.fullName && <p className="mt-0.5 text-xs text-red-500">{fe.fullName}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                  <input name="email" type="email" placeholder="trainee@example.org" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500" />
                  {fe.email && <p className="mt-0.5 text-xs text-red-500">{fe.email}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                  <input name="password" type="password" placeholder="Min 8 characters" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500" />
                  {fe.password && <p className="mt-0.5 text-xs text-red-500">{fe.password}</p>}
                </div>
                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                  <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={pending} className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors">
                    {pending ? "Creating…" : "Create Account"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
