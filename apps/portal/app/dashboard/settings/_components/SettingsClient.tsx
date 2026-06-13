"use client";

import { useState, useTransition } from "react";
import { toggleSettingAction } from "@/actions/settings";

type SettingItem = {
  key: string;
  label: string;
  description: string;
};

type SettingGroup = {
  group: string;
  description: string;
  items: SettingItem[];
};

export function SettingsClient({
  groups,
  initialSettings,
}: {
  groups: SettingGroup[];
  initialSettings: Record<string, boolean>;
}) {
  const [settings, setSettings] =
    useState<Record<string, boolean>>(initialSettings);
  const [loading, setLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  async function handleToggle(key: string, newValue: boolean) {
    // Optimistic update
    setSettings((prev) => ({ ...prev, [key]: newValue }));
    setLoading(key);
    setErrors((prev) => ({ ...prev, [key]: "" }));

    const result = await toggleSettingAction(key, newValue);

    if (!result.ok) {
      // Revert
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
      setErrors((prev) => ({ ...prev, [key]: result.error ?? "Failed." }));
    }
    setLoading(null);
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div
          key={group.group}
          className="rounded-xl border border-gray-200 bg-white overflow-hidden"
        >
          {/* Group header */}
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-900">
              {group.group}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">{group.description}</p>
          </div>

          {/* Settings list */}
          <div className="divide-y divide-gray-50">
            {group.items.map((item) => {
              const enabled = settings[item.key] ?? false;
              const isLoading = loading === item.key;
              const error = errors[item.key];

              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-6 px-6 py-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {item.label}
                      </p>
                      {enabled && (
                        <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                          Enabled
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {item.description}
                    </p>
                    {error && (
                      <p className="mt-1 text-xs text-red-500">{error}</p>
                    )}
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(item.key, !enabled)}
                    disabled={isLoading}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-60 ${
                      enabled ? "bg-teal-600" : "bg-gray-200"
                    }`}
                    role="switch"
                    aria-checked={enabled}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Info note */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-xs text-blue-700">
        <strong>Note:</strong> The System Admin always retains full access to
        all features regardless of these settings. These toggles only affect the
        Union Director.
      </div>
    </div>
  );
}
