"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelDeploymentRequestAction, endDeploymentAction } from "@/actions/deployments";

export function CancelRequestButton({ deploymentId }: { deploymentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  async function handle() {
    if (!confirm("Cancel this deployment request?")) return;
    setLoading(true);
    await cancelDeploymentRequestAction(deploymentId);
    startTransition(() => router.refresh());
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="rounded border border-red-200 bg-white px-2 py-0.5 text-[10px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
    >
      {loading ? "…" : "Cancel"}
    </button>
  );
}

export function EndDeploymentButton({ deploymentId, name }: { deploymentId: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  async function handle() {
    if (!confirm(`End deployment for ${name}?`)) return;
    setLoading(true);
    await endDeploymentAction(deploymentId);
    startTransition(() => router.refresh());
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="rounded border border-amber-300 bg-white px-2 py-0.5 text-[10px] font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors"
    >
      {loading ? "…" : "End deployment"}
    </button>
  );
}
