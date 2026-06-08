"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleIdCardPrintingAction } from "@/actions/settings";

type Program = { id: string; code: string; title: string };
type Trainee = {
  enrollmentId: string;
  fullName: string;
  referenceNumber: string;
  missionCode: string;
  deploymentLocation: string | null;
};

export function IdCardsClient({
  isSA,
  printingEnabled,
  programs,
}: {
  isSA: boolean;
  printingEnabled: boolean;
  programs: Program[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"batch" | "selective">("batch");
  const [selectedProgram, setSelectedProgram] = useState<string>(
    programs[0]?.id ?? "",
  );
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingTrainees, setLoadingTrainees] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [togglingAccess, setTogglingAccess] = useState(false);
  const [accessEnabled, setAccessEnabled] = useState(printingEnabled);

  // Load trainees when program changes
  useEffect(() => {
    if (!selectedProgram) return;
    setLoadingTrainees(true);
    setSelectedIds(new Set());
    fetch(`/api/id-cards/trainees?programId=${selectedProgram}`)
      .then((r) => r.json())
      .then((data) => {
        setTrainees(data);
        setLoadingTrainees(false);
      })
      .catch(() => setLoadingTrainees(false));
  }, [selectedProgram]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(trainees.map((t) => t.enrollmentId)));
  }
  function deselectAll() {
    setSelectedIds(new Set());
  }

  async function handlePrint() {
    setGenerating(true);
    const url =
      mode === "batch"
        ? `/api/id-cards?programId=${selectedProgram}`
        : `/api/id-cards?enrollmentIds=${[...selectedIds].join(",")}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        alert(text);
        return;
      }
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `id-cards-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert("Failed to generate ID cards.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggleAccess() {
    setTogglingAccess(true);
    const result = await toggleIdCardPrintingAction(!accessEnabled);
    if (result.ok) {
      setAccessEnabled(!accessEnabled);
      startTransition(() => router.refresh());
    }
    setTogglingAccess(false);
  }

  const canPrint =
    mode === "batch"
      ? !!selectedProgram && trainees.length > 0
      : selectedIds.size > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">ID Cards</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Generate trainee ID cards — 6 per A4 page
          </p>
        </div>

        {/* SA access toggle */}
        {isSA && (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div>
              <p className="text-xs font-medium text-gray-800">
                Union Director Access
              </p>
              <p className="text-[10px] text-gray-400">
                Allow UD to print ID cards
              </p>
            </div>
            <button
              onClick={handleToggleAccess}
              disabled={togglingAccess}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-60 ${
                accessEnabled ? "bg-teal-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                  accessEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-xs font-medium ${accessEnabled ? "text-teal-700" : "text-gray-400"}`}
            >
              {accessEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        )}
      </div>

      {/* Program selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-48">
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Program
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            >
              {programs.length === 0 ? (
                <option value="">No programs with accepted trainees</option>
              ) : (
                programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.title}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Mode toggle */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Print Mode
            </label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
              <button
                onClick={() => setMode("batch")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  mode === "batch"
                    ? "bg-teal-700 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Batch (All)
              </button>
              <button
                onClick={() => setMode("selective")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                  mode === "selective"
                    ? "bg-teal-700 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Selective
              </button>
            </div>
          </div>
        </div>

        {/* Trainee list for selective mode */}
        {loadingTrainees ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Loading trainees…
          </div>
        ) : trainees.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
            No accepted trainees in this program.
          </div>
        ) : (
          <>
            {mode === "selective" && (
              <div className="mb-3 flex items-center gap-3">
                <button
                  onClick={selectAll}
                  className="text-xs text-teal-600 hover:underline"
                >
                  Select all
                </button>
                <span className="text-gray-300">·</span>
                <button
                  onClick={deselectAll}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Deselect all
                </button>
                <span className="ml-auto text-xs text-gray-500">
                  {selectedIds.size} selected
                </span>
              </div>
            )}

            <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-100">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b border-gray-100 bg-gray-50">
                  <tr>
                    {mode === "selective" && <th className="w-10 px-3 py-2" />}
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      #
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Ref. No.
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Mission
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Deployment
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {trainees.map((t, i) => (
                    <tr
                      key={t.enrollmentId}
                      className={`hover:bg-gray-50 transition-colors ${
                        mode === "selective" && selectedIds.has(t.enrollmentId)
                          ? "bg-teal-50"
                          : ""
                      }`}
                      onClick={
                        mode === "selective"
                          ? () => toggleSelect(t.enrollmentId)
                          : undefined
                      }
                      style={
                        mode === "selective" ? { cursor: "pointer" } : undefined
                      }
                    >
                      {mode === "selective" && (
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(t.enrollmentId)}
                            onChange={() => toggleSelect(t.enrollmentId)}
                            className="h-4 w-4 rounded border-gray-300 text-teal-600"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                      )}
                      <td className="px-3 py-2 text-xs text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900">
                        {t.fullName}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-600">
                        {t.referenceNumber}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                          {t.missionCode}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {t.deploymentLocation ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary + print button */}
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500">
                {mode === "batch"
                  ? `${trainees.length} ID cards · ${Math.ceil(trainees.length / 6)} page${trainees.length > 6 ? "s" : ""}`
                  : `${selectedIds.size} selected · ${Math.ceil(selectedIds.size / 6)} page${selectedIds.size > 6 ? "s" : ""}`}
              </p>
              <button
                onClick={handlePrint}
                disabled={!canPrint || generating}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
              >
                {generating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generating…
                  </>
                ) : (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    {mode === "batch"
                      ? `Print All (${trainees.length})`
                      : `Print Selected (${selectedIds.size})`}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
