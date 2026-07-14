"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateSalaryWindowAction } from "@/actions/salary";
import type { ActionResult } from "@/actions/salary";

export function SalaryWindowForm({
  windowStart,
  windowEnd,
}: {
  windowStart: number;
  windowEnd: number;
}) {
  const [start, setStart] = useState(String(windowStart));
  const [end, setEnd] = useState(String(windowEnd));
  const [state, action, isPending] = useActionState<ActionResult, FormData>(
    updateSalaryWindowAction,
    { ok: false },
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(t);
    }
  }, [state]);

  const s = Number(start);
  const e = Number(end);
  const today = new Date().getDate();
  const isClosed = s === 0 && e === 0;
  const isOpenToday = !isClosed && today >= s && today <= e;

  function submitWith(newStart: number, newEnd: number) {
    setStart(String(newStart));
    setEnd(String(newEnd));
    // Submit after the state update lands in the inputs
    setTimeout(() => formRef.current?.requestSubmit(), 0);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Salary Request Window
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Missionaries can submit requests only between these days of each
            month.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            isClosed
              ? "bg-red-100 text-red-700"
              : isOpenToday
                ? "bg-teal-100 text-teal-700"
                : "bg-amber-100 text-amber-700"
          }`}
        >
          {isClosed ? "Closed" : isOpenToday ? "Open today" : "Closed today"}
        </span>
      </div>

      <form ref={formRef} action={action} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            From day
          </label>
          <input
            name="windowStart"
            type="number"
            min={0}
            max={31}
            value={start}
            onChange={(ev) => setStart(ev.target.value)}
            className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            To day
          </label>
          <input
            name="windowEnd"
            type="number"
            min={0}
            max={31}
            value={end}
            onChange={(ev) => setEnd(ev.target.value)}
            className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
        >
          {isPending ? "Saving…" : "Save"}
        </button>

        <span className="mx-1 hidden text-gray-200 sm:inline">|</span>

        <button
          type="button"
          disabled={isPending}
          onClick={() => submitWith(1, 31)}
          className="rounded-lg border border-teal-300 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-60 transition-colors"
        >
          Open all month
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => submitWith(0, 0)}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
        >
          Close requests
        </button>
      </form>

      {state.error && (
        <p className="mt-2 text-xs text-red-600">{state.error}</p>
      )}
      {saved && (
        <p className="mt-2 text-xs text-teal-700">Window updated.</p>
      )}
    </div>
  );
}
