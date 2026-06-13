"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitSalaryRequestAction } from "@/actions/salary";

export function SalaryRequestButton({
  isWindowOpen,
  amount,
}: {
  isWindowOpen: boolean;
  amount: number;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitSalaryRequestAction, {
    ok: false,
  });

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok]);

  return (
    <form action={action}>
      {state.error && (
        <p className="mb-2 text-xs text-red-600">{state.error}</p>
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Amount:{" "}
          <span className="font-semibold text-teal-700">
            ৳{amount.toLocaleString()}
          </span>
        </p>
        <button
          type="submit"
          disabled={!isWindowOpen || pending}
          className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50 transition-colors"
        >
          {pending ? "Submitting…" : "Submit Request"}
        </button>
      </div>
    </form>
  );
}
