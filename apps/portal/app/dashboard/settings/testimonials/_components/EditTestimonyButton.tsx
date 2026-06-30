"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTestimonyAction } from "@/actions/testimonials";
import { TestimonyForm } from "./TestimonyForm";

type Testimony = {
  id: string;
  name: string;
  location: string;
  quote: string;
  color: string;
  order: number;
  isPublished: boolean;
};

export function EditTestimonyButton({ testimony }: { testimony: Testimony }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const boundAction = updateTestimonyAction.bind(null, testimony.id);
  const [state, action, pending] = useActionState(boundAction, { ok: false });

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      startTransition(() => router.refresh());
    }
  }, [state.ok]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        Edit
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-8"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Edit Testimony</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form action={action} className="px-6 py-5">
              <TestimonyForm
                state={state}
                pending={pending}
                submitLabel="Save Changes"
                defaults={testimony}
              />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
