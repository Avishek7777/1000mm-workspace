"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export type FilterOption = { value: string; label: string };
export type FilterDef = {
  name: string;
  label: string;
  options: FilterOption[];
  allLabel?: string;
};

export function FilterBar({
  filters,
  current,
  basePath,
  className,
}: {
  filters: FilterDef[];
  current: Record<string, string>;
  basePath: string;
  className?: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const filterNames = new Set(filters.map((f) => f.name));

  function buildUrl(params: Record<string, string>): string {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) p.set(k, v);
    }
    const qs = p.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  function handleChange(name: string, value: string) {
    startTransition(() => {
      router.push(buildUrl({ ...current, [name]: value }));
    });
  }

  function handleClear() {
    const kept: Record<string, string> = {};
    for (const [k, v] of Object.entries(current)) {
      if (!filterNames.has(k)) kept[k] = v;
    }
    startTransition(() => {
      router.push(buildUrl(kept));
    });
  }

  const hasActive = filters.some((f) => !!current[f.name]);

  return (
    <div className={`flex flex-wrap items-end gap-3 ${className ?? ""}`}>
      {filters.map((f) => (
        <div key={f.name} className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {f.label}
          </label>
          <select
            value={current[f.name] ?? ""}
            onChange={(e) => handleChange(f.name, e.target.value)}
            className="min-w-[110px] rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="">{f.allLabel ?? "All"}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      {/* Always rendered so its space is reserved — invisible when no filter is active */}
      <button
        onClick={handleClear}
        disabled={!hasActive}
        className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
          hasActive
            ? "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 cursor-pointer"
            : "invisible pointer-events-none border-transparent"
        }`}
      >
        ✕ Clear
      </button>
    </div>
  );
}
