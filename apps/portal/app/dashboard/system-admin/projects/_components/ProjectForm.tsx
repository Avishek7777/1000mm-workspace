"use client";

import { useState } from "react";
import { ProjectActionResult } from "@/actions/projects";

type ProjectFormData = {
  slug?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  location?: string;
  date?: string;
  images?: string[];
  tags?: string | string[];
  status?: string;
  goal?: string | null;
  participants?: number | null;
  highlight?: string | null;
  body?: string | null;
  budget?: string | null;
  objectives?: string[];
  order?: number;
  isPublished?: boolean;
};

function SingleImageUploader({
  index,
  defaultValue,
  required,
}: {
  index: number;
  defaultValue?: string;
  required?: boolean;
}) {
  const [preview, setPreview] = useState<string>(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.storageKey) setPreview(`/api/uploads/${data.storageKey}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <input type="hidden" name={`image_${index}`} value={preview} />
      <div className="flex items-start gap-3">
        {preview ? (
          <div className="relative flex-shrink-0">
            <img
              src={preview}
              alt={`Image ${index + 1}`}
              className="h-16 w-24 rounded-lg border border-gray-200 object-cover bg-gray-50"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <button
              type="button"
              onClick={() => setPreview("")}
              className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {uploading ? "Uploading…" : preview ? "Replace" : "Upload"}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
          </label>
          <input
            type="text"
            placeholder={required ? "/images/cover.jpg" : "Optional URL"}
            value={preview}
            onChange={(e) => setPreview(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1 text-xs font-mono outline-none focus:border-teal-500"
          />
        </div>
      </div>
    </div>
  );
}

export function ProjectForm({
  defaults = {},
  state,
  pending,
  submitLabel,
}: {
  defaults?: ProjectFormData;
  state: ProjectActionResult;
  pending: boolean;
  submitLabel: string;
}) {
  const fe = state.fieldErrors ?? {};
  const tagsStr = Array.isArray(defaults.tags)
    ? defaults.tags.join(", ")
    : defaults.tags ?? "";
  const objectivesStr = (defaults.objectives ?? []).join("\n");
  const defaultImages = defaults.images ?? [];

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
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            name="slug"
            defaultValue={defaults.slug ?? ""}
            placeholder="e.g. training-center"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-teal-500"
          />
          {fe.slug && <p className="mt-0.5 text-xs text-red-500">{fe.slug}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            name="status"
            defaultValue={defaults.status ?? "Active"}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 bg-white"
          >
            <option value="Active">Active</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          defaultValue={defaults.title ?? ""}
          placeholder="Project title"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
        {fe.title && <p className="mt-0.5 text-xs text-red-500">{fe.title}</p>}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Subtitle <span className="text-red-500">*</span>
        </label>
        <input
          name="subtitle"
          defaultValue={defaults.subtitle ?? ""}
          placeholder="Short tagline"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
        {fe.subtitle && <p className="mt-0.5 text-xs text-red-500">{fe.subtitle}</p>}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Goal <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          name="goal"
          defaultValue={defaults.goal ?? ""}
          placeholder="e.g. Equip 100 missionaries by end of 2026"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          defaultValue={defaults.description ?? ""}
          rows={4}
          placeholder="Full project description…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 resize-none"
        />
        {fe.description && <p className="mt-0.5 text-xs text-red-500">{fe.description}</p>}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Key Highlight <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          name="highlight"
          defaultValue={defaults.highlight ?? ""}
          placeholder="e.g. Trained 1,200 missionaries across 18 districts"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Full Story / Body <span className="text-gray-400 font-normal">(optional — shown only on detail page)</span>
        </label>
        <textarea
          name="body"
          defaultValue={defaults.body ?? ""}
          rows={6}
          placeholder="Write a detailed article-style body. Separate paragraphs with a blank line.&#10;&#10;E.g.: This project began with a vision...&#10;&#10;Over the past year, we have..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 resize-y"
        />
        <p className="mt-0.5 text-[10px] text-gray-400">Blank line between paragraphs will render as separate paragraph blocks.</p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Key Objectives <span className="text-gray-400 font-normal">(optional — one per line)</span>
        </label>
        <textarea
          name="objectivesRaw"
          defaultValue={objectivesStr}
          rows={4}
          placeholder="Train 60–100 young missionaries&#10;Cover evangelism, health ministry & leadership&#10;Run 4-week residential program&#10;Equip with digital outreach tools"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 resize-y"
        />
        <p className="mt-0.5 text-[10px] text-gray-400">Each line becomes one bullet point on the detail page.</p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Budget / Funding <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          name="budget"
          defaultValue={defaults.budget ?? ""}
          placeholder="e.g. BDT 1,891,382 (≈ USD 15,503)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            name="location"
            defaultValue={defaults.location ?? ""}
            placeholder="e.g. Gazipur, Bangladesh"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          {fe.location && <p className="mt-0.5 text-xs text-red-500">{fe.location}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Date / Period <span className="text-red-500">*</span>
          </label>
          <input
            name="date"
            defaultValue={defaults.date ?? ""}
            placeholder="e.g. Oct 04–31, 2026"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
          {fe.date && <p className="mt-0.5 text-xs text-red-500">{fe.date}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Participants <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="number"
            name="participants"
            defaultValue={defaults.participants ?? ""}
            placeholder="e.g. 500"
            min={0}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Images — 1 mandatory cover + 4 optional */}
      <div>
        <label className="mb-2 block text-xs font-medium text-gray-700">
          Project Images <span className="text-red-500">*</span>
          <span className="ml-1 font-normal text-gray-400">(1 cover required, up to 4 additional)</span>
        </label>
        <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-2 w-20 flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {i === 0 ? "Cover *" : `Extra ${i}`}
              </span>
              <div className="flex-1 min-w-0">
                <SingleImageUploader
                  index={i}
                  defaultValue={defaultImages[i] ?? ""}
                  required={i === 0}
                />
              </div>
            </div>
          ))}
        </div>
        {fe.images && <p className="mt-0.5 text-xs text-red-500">{fe.images}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Tags (comma-separated)
          </label>
          <input
            name="tags"
            defaultValue={tagsStr}
            placeholder="Training, Evangelism, Youth"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Display order
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
