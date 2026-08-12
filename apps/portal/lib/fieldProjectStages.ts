/**
 * Stage labels and badge styles for field projects.
 *
 * Deliberately not exported from a "use client" module: server components
 * import these too, and a value re-exported across the client boundary arrives
 * as a client reference proxy rather than the array itself.
 */
export const STAGES = [
  { value: "PLANNING", label: "Planning" },
  { value: "STARTED", label: "Started" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "NEARLY_COMPLETE", label: "Nearly complete" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ON_HOLD", label: "On hold" },
] as const;

export const stageLabel: Record<string, string> = Object.fromEntries(
  STAGES.map((s) => [s.value, s.label]),
);

export const stageBadge: Record<string, string> = {
  PLANNING: "bg-gray-100 text-gray-600",
  STARTED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-teal-100 text-teal-700",
  NEARLY_COMPLETE: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  ON_HOLD: "bg-red-100 text-red-600",
};
