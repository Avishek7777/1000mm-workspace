"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { withdrawProgramApplicationAction } from "@/actions/trainees";

export function WithdrawApplicationButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  async function withdraw() {
    setLoading(true);
    const res = await withdrawProgramApplicationAction();
    setLoading(false);
    if (res.ok) startTransition(() => router.refresh());
  }

  return (
    <button
      onClick={withdraw}
      disabled={loading}
      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
    >
      {loading ? "Withdrawing…" : "Withdraw application"}
    </button>
  );
}
