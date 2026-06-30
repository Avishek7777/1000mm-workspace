"use client";

import { useState } from "react";

type TopicOption = { id: string; title: string; hasTrainer: boolean };
type ProgramOption = { id: string; code: string; title: string; topics: TopicOption[] };

export function TopicAssignSelect({ programs }: { programs: ProgramOption[] }) {
  const [selectedProgramId, setSelectedProgramId] = useState("");

  const program = programs.find((p) => p.id === selectedProgramId);
  const availableTopics = program?.topics.filter((t) => !t.hasTrainer) ?? [];

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Assign to Program <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <select
          name="programId"
          value={selectedProgramId}
          onChange={(e) => setSelectedProgramId(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Skip for now —</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.title}
            </option>
          ))}
        </select>
      </div>

      {selectedProgramId && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Assign to Topic <span className="text-red-500">*</span>
          </label>
          {availableTopics.length === 0 ? (
            <p className="text-xs text-amber-600">
              All topics in this program already have a trainer assigned. Add topics first from the program detail page.
            </p>
          ) : (
            <select
              name="topicId"
              required={!!selectedProgramId}
              defaultValue=""
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Select a topic…</option>
              {availableTopics.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}
