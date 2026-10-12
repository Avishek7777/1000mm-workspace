"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  searchProgramCandidatesAction,
  addTraineesToProgramAction,
  addAllAcceptedFromWindowsAction,
  removeEnrollmentAction,
  type CandidateScope,
  type EnrollCandidate,
  type AddResult,
} from "@/actions/programRoster";

type EnrolledRow = {
  id: string;
  traineeName: string;
  missionCode: string | null;
  referenceNumber: string | null;
  enrolledAt: Date;
  attendanceConfirmed: boolean;
  certificateIssued: boolean;
};

const SCOPES: { value: CandidateScope; label: string; hint: string }[] = [
  {
    value: "window",
    label: "Accepted on this program",
    hint: "Accepted applicants who applied through this program's own windows.",
  },
  {
    value: "accepted",
    label: "All accepted applicants",
    hint: "Anyone accepted into 1000MMBD, whichever window they came through.",
  },
  {
    value: "all",
    label: "Any trainee account",
    hint: "Every active trainee account — use for people admitted on paper.",
  },
];

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function RosterPanel({
  programId,
  programCode,
  enrolled,
  acceptedOnWindows,
}: {
  programId: string;
  programCode: string;
  enrolled: EnrolledRow[];
  /** Accepted applicants on this program's windows who hold no place yet. */
  acceptedOnWindows: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [scope, setScope] = useState<CandidateScope>("window");
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<EnrollCandidate[] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allowMultiProgram, setAllowMultiProgram] = useState(false);

  const [busy, setBusy] = useState<"search" | "add" | "bulk" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AddResult | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  function refresh() {
    startTransition(() => router.refresh());
  }

  // Deliberately does not clear `result` — addSelected refreshes the list right
  // after a successful add and the summary of that add must survive.
  async function search(nextScope = scope) {
    setBusy("search");
    setError(null);
    const res = await searchProgramCandidatesAction(programId, nextScope, query);
    setBusy(null);
    if (!res.ok) {
      setError(res.error ?? "Search failed.");
      setCandidates(null);
      return;
    }
    setCandidates(res.candidates ?? []);
    setTruncated(!!res.truncated);
    setSelected(new Set());
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!candidates) return;
    setSelected((prev) =>
      prev.size === candidates.length
        ? new Set()
        : new Set(candidates.map((c) => c.traineeId)),
    );
  }

  async function addSelected() {
    setBusy("add");
    setError(null);
    setResult(null);
    const res = await addTraineesToProgramAction(
      programId,
      [...selected],
      allowMultiProgram,
    );
    setBusy(null);
    if (!res.ok) {
      setError(res.error ?? "Could not add trainees.");
      return;
    }
    setResult(res);
    setSelected(new Set());
    await search();
    refresh();
  }

  async function addAllFromWindows() {
    setBusy("bulk");
    setError(null);
    setResult(null);
    const res = await addAllAcceptedFromWindowsAction(
      programId,
      allowMultiProgram,
    );
    setBusy(null);
    if (!res.ok) {
      setError(res.error ?? "Could not add trainees.");
      return;
    }
    setResult(res);
    setCandidates(null);
    refresh();
  }

  async function remove(enrollmentId: string) {
    setRemoving(enrollmentId);
    setError(null);
    const res = await removeEnrollmentAction(enrollmentId);
    setRemoving(null);
    setConfirmRemove(null);
    if (!res.ok) {
      setError(res.error ?? "Could not remove the trainee.");
      return;
    }
    refresh();
  }

  const activeScope = SCOPES.find((s) => s.value === scope)!;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 print:hidden">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900">
          Enrolled Trainees
        </h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
            {enrolled.length} on roster
          </span>
          {enrolled.length > 0 && (
            <>
              <Link
                href={`/dashboard/trainees?program=${programId}`}
                className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Print list
              </Link>
              <Link
                href="/dashboard/id-cards"
                className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ID cards
              </Link>
            </>
          )}
        </div>
      </div>
      <p className="mb-4 text-xs text-gray-500">
        Accepting an application admits someone to 1000MMBD — it does not place
        them in this program. Add them here to make them appear on rosters, ID
        cards and attendance.
      </p>

      {/* One-click catch-up */}
      {acceptedOnWindows > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            {acceptedOnWindows} accepted applicant
            {acceptedOnWindows !== 1 ? "s" : ""} on this program&apos;s windows{" "}
            {acceptedOnWindows !== 1 ? "are" : "is"} not on the roster.
          </p>
          <p className="mt-0.5 text-xs text-amber-800">
            They were accepted but never picked a program themselves, so{" "}
            {programCode} still counts them as not enrolled.
          </p>
          <button
            onClick={addAllFromWindows}
            disabled={busy !== null}
            className="mt-3 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800 disabled:opacity-60 transition-colors"
          >
            {busy === "bulk"
              ? "Adding…"
              : `Add all ${acceptedOnWindows} to ${programCode}`}
          </button>
        </div>
      )}

      {/* Result summary */}
      {result && (
        <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 p-4 text-xs text-teal-900">
          <p className="font-medium">
            {(result.added ?? 0) + (result.promoted ?? 0)} trainee
            {(result.added ?? 0) + (result.promoted ?? 0) !== 1 ? "s" : ""} now
            enrolled
            {result.promoted
              ? ` (${result.promoted} already had a pending application)`
              : ""}
            .
          </p>
          {result.skipped && result.skipped.length > 0 && (
            <div className="mt-2">
              <p className="font-medium">
                {result.skipped.length} skipped:
              </p>
              <ul className="mt-1 space-y-0.5">
                {result.skipped.map((s, i) => (
                  <li key={i}>
                    · {s.fullName} — {s.reason}
                  </li>
                ))}
              </ul>
              {result.skipped.some((s) =>
                s.reason.startsWith("Already active on"),
              ) &&
                !allowMultiProgram && (
                  <p className="mt-2">
                    Tick &ldquo;allow trainees already on another
                    program&rdquo; below and retry to add them anyway.
                  </p>
                )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Current roster */}
      {enrolled.length === 0 ? (
        <div className="mb-5 rounded-lg border border-dashed border-gray-200 bg-gray-50 py-6 text-center">
          <p className="text-sm text-gray-400">No trainees on this roster yet.</p>
        </div>
      ) : (
        <div className="mb-5 max-h-80 overflow-y-auto rounded-lg border border-gray-100">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                  Trainee
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                  Mission
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                  Reference
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                  Enrolled
                </th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {enrolled.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <p className="font-medium text-gray-900">{e.traineeName}</p>
                    <div className="mt-0.5 flex gap-1">
                      {e.attendanceConfirmed && (
                        <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">
                          Attending
                        </span>
                      )}
                      {e.certificateIssued && (
                        <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] text-violet-700">
                          Certified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                      {e.missionCode ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">
                    {e.referenceNumber ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {formatDate(e.enrolledAt)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {confirmRemove === e.id ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[11px] text-gray-500">
                          Remove?
                        </span>
                        <button
                          onClick={() => remove(e.id)}
                          disabled={removing !== null}
                          className="rounded-lg border border-red-300 bg-white px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          {removing === e.id ? "…" : "Yes"}
                        </button>
                        <button
                          onClick={() => setConfirmRemove(null)}
                          disabled={removing !== null}
                          className="rounded-lg border border-gray-300 bg-white px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmRemove(e.id)}
                        className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add trainees */}
      <div className="border-t border-gray-100 pt-4">
        <p className="mb-3 text-xs font-medium text-gray-700">
          Add Trainees to {programCode}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={scope}
            onChange={(ev) => {
              const next = ev.target.value as CandidateScope;
              setScope(next);
              setCandidates(null);
              setResult(null);
            }}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-teal-500"
          >
            {SCOPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                setResult(null);
                search();
              }
            }}
            placeholder="Search name or email… (blank = everyone)"
            className="min-w-[220px] flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-teal-500"
          />
          <button
            onClick={() => {
              setResult(null);
              search();
            }}
            disabled={busy !== null}
            className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
          >
            {busy === "search" ? "Searching…" : "Search"}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-gray-400">{activeScope.hint}</p>

        <label className="mt-3 flex items-center gap-2 text-[11px] text-gray-600">
          <input
            type="checkbox"
            checked={allowMultiProgram}
            onChange={(ev) => setAllowMultiProgram(ev.target.checked)}
            className="h-3.5 w-3.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          Allow trainees already on another program (normally one program at a
          time)
        </label>

        {/* Candidate list */}
        {candidates !== null && (
          <div className="mt-4">
            {candidates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 py-6 text-center">
                <p className="text-xs text-gray-400">
                  No one left to add for this filter.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <button
                    onClick={toggleAll}
                    className="text-[11px] text-teal-600 hover:underline"
                  >
                    {selected.size === candidates.length
                      ? "Clear selection"
                      : `Select all ${candidates.length}`}
                  </button>
                  {truncated && (
                    <span className="text-[11px] text-amber-600">
                      Showing the first 200 — narrow your search for the rest.
                    </span>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-100 divide-y divide-gray-50">
                  {candidates.map((c) => (
                    <label
                      key={c.traineeId}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(c.traineeId)}
                        onChange={() => toggle(c.traineeId)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-900">
                          {c.fullName}
                        </span>
                        <span className="block truncate text-[11px] text-gray-400">
                          {c.email}
                        </span>
                      </span>
                      <span className="flex flex-shrink-0 items-center gap-1.5">
                        {c.pendingHere && (
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            Applied here
                          </span>
                        )}
                        {c.conflictProgramCode && (
                          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                            On {c.conflictProgramCode}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-gray-400">
                          {c.referenceNumber ?? "—"}
                        </span>
                        <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                          {c.missionCode ?? "—"}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-end gap-3">
                  <span className="text-[11px] text-gray-500">
                    {selected.size} selected
                  </span>
                  <button
                    onClick={addSelected}
                    disabled={busy !== null || selected.size === 0}
                    className="rounded-lg bg-teal-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
                  >
                    {busy === "add"
                      ? "Adding…"
                      : `Add ${selected.size || ""} to ${programCode}`}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
