"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createFinancialEntry } from "@/actions/financial";
import type { ActionResult } from "@/actions/financial";

const ENTRY_TYPES = [
  { value: "INCOME", label: "Income", color: "text-teal-700" },
  { value: "DONATION", label: "Donation", color: "text-teal-700" },
  { value: "DEPOSIT", label: "Deposit", color: "text-blue-700" },
  { value: "TRANSFER_TO_MISSION", label: "Transfer to Mission", color: "text-purple-700" },
  { value: "EXPENSE", label: "Expense", color: "text-red-700" },
  { value: "OTHER", label: "Other", color: "text-gray-600" },
];

type Mission = { id: string; code: string; name: string };

export function AddEntryForm({
  missions,
  defaultMissionId,
  isStaff = false,
}: {
  missions: Mission[];
  defaultMissionId?: string;
  isStaff?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isFirstRender = useRef(true);
  const [selectedType, setSelectedType] = useState("INCOME");
  const [state, action, pending] = useActionState<ActionResult, FormData>(
    createFinancialEntry,
    { ok: false },
  );

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (state.ok) setOpen(false);
  }, [state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
      >
        + Add Entry
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">New Financial Entry</p>
        <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">
          Cancel
        </button>
      </div>
      <form action={action} className="space-y-3">
        {state.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {state.error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Type <span className="text-red-500">*</span></label>
            <select
              name="type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 bg-white"
            >
              {ENTRY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {state.fieldErrors?.type && <p className="mt-0.5 text-[11px] text-red-600">{state.fieldErrors.type}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Mission</label>
            <select
              name="missionId"
              defaultValue={defaultMissionId ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 bg-white"
            >
              {isStaff && <option value="">All Missions</option>}
              {missions.map((m) => (
                <option key={m.id} value={m.id}>{m.code} — {m.name}</option>
              ))}
            </select>
          </div>
        </div>
        {selectedType === "OTHER" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Category / Write-in <span className="text-red-500">*</span></label>
            <input
              name="otherCategory"
              type="text"
              placeholder="Describe the category (e.g. Equipment, Training materials…)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Amount (৳) <span className="text-red-500">*</span></label>
            <input
              name="amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
            {state.fieldErrors?.amount && <p className="mt-0.5 text-[11px] text-red-600">{state.fieldErrors.amount}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Date <span className="text-red-500">*</span></label>
            <input
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
          <input
            name="description"
            type="text"
            placeholder="Brief description of this entry"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          {state.fieldErrors?.description && <p className="mt-0.5 text-[11px] text-red-600">{state.fieldErrors.description}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Reference / Note</label>
          <input
            name="reference"
            type="text"
            placeholder="Invoice #, receipt, or other reference"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
          >
            {pending ? "Saving…" : "Save Entry"}
          </button>
        </div>
      </form>
    </div>
  );
}
