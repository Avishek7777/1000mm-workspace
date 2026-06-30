"use client";

import type { TestimonyActionResult } from "@/actions/testimonials";

const COLOR_OPTIONS = [
  { label: "Green → Emerald", value: "from-green-400 to-emerald-600" },
  { label: "Orange → Red", value: "from-orange-400 to-red-500" },
  { label: "Emerald → Teal", value: "from-emerald-500 to-teal-600" },
  { label: "Amber → Orange", value: "from-amber-400 to-orange-500" },
  { label: "Green → Lime", value: "from-green-500 to-lime-600" },
  { label: "Rose → Orange", value: "from-rose-400 to-orange-400" },
  { label: "Teal → Cyan", value: "from-teal-500 to-cyan-600" },
  { label: "Purple → Indigo", value: "from-purple-500 to-indigo-600" },
];

type Defaults = {
  name?: string;
  location?: string;
  quote?: string;
  color?: string;
  order?: number;
  isPublished?: boolean;
};

export function TestimonyForm({
  defaults = {},
  state,
  pending,
  submitLabel,
}: {
  defaults?: Defaults;
  state: TestimonyActionResult;
  pending: boolean;
  submitLabel: string;
}) {
  const fe = state.fieldErrors ?? {};

  return (
    <div className="space-y-4">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            defaultValue={defaults.name ?? ""}
            placeholder="e.g. Samuel Das"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          {fe.name && <p className="mt-0.5 text-xs text-red-500">{fe.name}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            name="location"
            defaultValue={defaults.location ?? ""}
            placeholder="e.g. Dhaka"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          {fe.location && <p className="mt-0.5 text-xs text-red-500">{fe.location}</p>}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Testimony <span className="text-red-500">*</span>
        </label>
        <textarea
          name="quote"
          defaultValue={defaults.quote ?? ""}
          rows={5}
          placeholder="Write the testimony in the person's own words…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 resize-none"
        />
        {fe.quote && <p className="mt-0.5 text-xs text-red-500">{fe.quote}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Avatar Color <span className="text-red-500">*</span>
          </label>
          <select
            name="color"
            defaultValue={defaults.color ?? "from-green-400 to-emerald-600"}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 bg-white"
          >
            {COLOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {fe.color && <p className="mt-0.5 text-xs text-red-500">{fe.color}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Display Order
          </label>
          <input
            name="order"
            type="number"
            defaultValue={defaults.order ?? 0}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublished"
          name="isPublished"
          value="true"
          defaultChecked={defaults.isPublished !== false}
          className="h-4 w-4 rounded border-gray-300 text-teal-600"
        />
        <label htmlFor="isPublished" className="text-sm text-gray-700">
          Published (visible on website)
        </label>
      </div>

      <div className="flex justify-end border-t border-gray-100 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </div>
  );
}
