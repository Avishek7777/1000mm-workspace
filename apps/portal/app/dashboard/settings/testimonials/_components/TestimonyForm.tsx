import type { TestimonyActionResult } from "@/actions/testimonials";

const COLOR_OPTIONS = [
  { label: "Green / Emerald",    value: "from-green-400 to-emerald-600" },
  { label: "Orange / Red",       value: "from-orange-400 to-red-500" },
  { label: "Emerald / Teal",     value: "from-emerald-500 to-teal-600" },
  { label: "Amber / Orange",     value: "from-amber-400 to-orange-500" },
  { label: "Green / Lime",       value: "from-green-500 to-lime-600" },
  { label: "Rose / Orange",      value: "from-rose-400 to-orange-400" },
  { label: "Blue / Indigo",      value: "from-blue-400 to-indigo-600" },
  { label: "Violet / Purple",    value: "from-violet-400 to-purple-600" },
  { label: "Cyan / Blue",        value: "from-cyan-400 to-blue-500" },
  { label: "Pink / Rose",        value: "from-pink-400 to-rose-500" },
];

type Props = {
  state: TestimonyActionResult;
  pending: boolean;
  submitLabel: string;
  defaults?: {
    name?: string;
    location?: string;
    quote?: string;
    color?: string;
    order?: number;
    isPublished?: boolean;
  };
};

export function TestimonyForm({ state, pending, submitLabel, defaults }: Props) {
  const fe = state.fieldErrors ?? {};

  return (
    <div className="space-y-4">
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{state.error}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            defaultValue={defaults?.name ?? ""}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            placeholder="e.g. Samuel Das"
          />
          {fe.name && <p className="mt-0.5 text-xs text-red-500">{fe.name}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            name="location"
            defaultValue={defaults?.location ?? ""}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            placeholder="e.g. Dhaka"
          />
          {fe.location && <p className="mt-0.5 text-xs text-red-500">{fe.location}</p>}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Quote / Testimony <span className="text-red-500">*</span>
        </label>
        <textarea
          name="quote"
          defaultValue={defaults?.quote ?? ""}
          rows={5}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none resize-none"
          placeholder="In their own words..."
        />
        {fe.quote && <p className="mt-0.5 text-xs text-red-500">{fe.quote}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Avatar Color</label>
          <select
            name="color"
            defaultValue={defaults?.color ?? "from-green-400 to-emerald-600"}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none bg-white"
          >
            {COLOR_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Display Order</label>
          <input
            name="order"
            type="number"
            defaultValue={defaults?.order ?? 0}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="hidden"
          name="isPublished"
          value="false"
        />
        <input
          id="isPublished"
          name="isPublished"
          type="checkbox"
          defaultChecked={defaults?.isPublished ?? true}
          value="true"
          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
        />
        <label htmlFor="isPublished" className="text-xs font-medium text-gray-700">
          Published (visible on website)
        </label>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60 transition-colors"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </div>
  );
}
