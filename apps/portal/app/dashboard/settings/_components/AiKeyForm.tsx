"use client";

import { useState, useTransition } from "react";
import { saveStringSettingAction } from "@/actions/settings";
import { SETTING_KEYS } from "@/lib/settings";

export function AiKeyForm({ currentKey }: { currentKey: string }) {
  const [value, setValue] = useState(currentKey ? "••••••••••••••••••••••••" : "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  function startEdit() {
    setDraft("");
    setEditing(true);
    setSaved(false);
    setError("");
  }

  function cancelEdit() {
    setEditing(false);
    setDraft("");
  }

  function save() {
    if (!draft.trim()) {
      setError("API key cannot be empty.");
      return;
    }
    startTransition(async () => {
      const result = await saveStringSettingAction(SETTING_KEYS.AI_API_KEY, draft.trim());
      if (result.ok) {
        setValue("••••••••••••••••••••••••");
        setEditing(false);
        setDraft("");
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error ?? "Failed to save.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-900">API Integrations</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Configure external API keys used by automated features.
        </p>
      </div>
      <div className="px-6 py-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-gray-900">Anthropic API Key</p>
              {saved && (
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                  Saved
                </span>
              )}
              {currentKey && !saved && (
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                  Set
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Used by AI Executive Insights on the director dashboard. Get a key from console.anthropic.com.
            </p>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

            {editing ? (
              <div className="mt-2 flex gap-2">
                <input
                  type="password"
                  value={draft}
                  onChange={(e) => { setDraft(e.target.value); setError(""); }}
                  placeholder="sk-ant-api03-..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-mono focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  autoFocus
                />
                <button
                  onClick={save}
                  className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-800"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2 items-center">
                <span className="font-mono text-xs text-gray-400">
                  {currentKey ? value : "Not set"}
                </span>
                <button
                  onClick={startEdit}
                  className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  {currentKey ? "Update" : "Set Key"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
