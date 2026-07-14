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

// Image file names within a project's folder, in upload order (index 0 = cover).
const IMAGE_FILE_NAMES = ["cover", "extra-1", "extra-2", "extra-3", "extra-4"];

function slugToFolder(slug: string): string | null {
  const safe = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  return safe ? `projects/${safe}` : null;
}

function SingleImageUploader({
  index,
  defaultValue,
  required,
  folder,
}: {
  index: number;
  defaultValue?: string;
  required?: boolean;
  folder: string | null;
}) {
  const [preview, setPreview] = useState<string>(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !folder) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      fd.append("fileName", IMAGE_FILE_NAMES[index]);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      // ?v= busts image caches when a slot is re-uploaded — the storage key
      // is deterministic (cover/extra-N), so the path alone never changes.
      if (data.storageKey)
        setPreview(`/api/uploads/${data.storageKey}?v=${Date.now()}`);
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
          <label
            className={`flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 transition-colors ${folder ? "cursor-pointer hover:border-teal-400 hover:text-teal-600" : "cursor-not-allowed opacity-60"}`}
            title={folder ? undefined : "Enter a slug first"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {uploading ? "Uploading…" : preview ? "Replace" : "Upload"}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading || !folder} />
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
  const [slug, setSlug] = useState(defaults.slug ?? "");
  const imageFolder = slugToFolder(slug);

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
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
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
          Goal <span className="text-gray-400 font-normal">(optional — shown in the impact band & sidebar)</span>
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
          Key Highlight <span className="text-gray-400 font-normal">(optional — the pull-quote card on the detail page)</span>
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
          Full Story / Body <span className="text-gray-400 font-normal">(optional — the article on the detail page)</span>
        </label>
        <textarea
          name="body"
          defaultValue={defaults.body ?? ""}
          rows={12}
          placeholder={"## Section Heading\n\nA paragraph of the story. Separate paragraphs with a blank line.\n\n* Bullet point one\n* Bullet point two\n\n> \"A quote rendered as a pull-quote card.\""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-teal-500 resize-y"
        />
        <details className="mt-1.5 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2">
          <summary className="cursor-pointer text-[11px] font-semibold text-blue-700">
            Formatting guide — how the story renders on the website
          </summary>
          <div className="mt-2 space-y-1 font-mono text-[11px] leading-relaxed text-blue-800">
            <p><span className="font-bold">## Heading</span> → section heading with a gradient mark</p>
            <p><span className="font-bold">### Sub-heading</span> → smaller teal heading</p>
            <p><span className="font-bold">* item</span> (one per line) → bulleted list</p>
            <p><span className="font-bold">**bold text**</span> → bold inline</p>
            <p><span className="font-bold">&gt; "Quote"</span> → pull-quote card</p>
            <p><span className="font-bold">| Item | Amount |</span> rows → styled table; a row with **bold** cells becomes the highlighted total row</p>
            <p><span className="font-bold">* **$250** description</span> (all items money-led) → donation tier cards</p>
            <p className="pt-1 font-sans text-blue-600">Blank line = new paragraph/block. Content pasted from Word works as-is.</p>
          </div>
        </details>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Key Objectives <span className="text-gray-400 font-normal">(optional — one per line; rendered as the objectives card grid)</span>
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
        {!imageFolder && (
          <p className="mb-2 text-[11px] text-amber-600">Enter a slug above before uploading images.</p>
        )}
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
                  folder={imageFolder}
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
