"use client";

export function ProgramFilter({
  programs,
  currentProgram,
  currentMission,
  currentQ,
}: {
  programs: { id: string; code: string; title: string }[];
  currentProgram?: string;
  currentMission?: string;
  currentQ?: string;
}) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const url = new URL(window.location.href);
    if (e.target.value) url.searchParams.set("program", e.target.value);
    else url.searchParams.delete("program");
    window.location.href = url.toString();
  }

  return (
    <select
      defaultValue={currentProgram ?? ""}
      onChange={handleChange}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500"
    >
      <option value="">All programs</option>
      {programs.map((p) => (
        <option key={p.id} value={p.id}>
          {p.code}
        </option>
      ))}
    </select>
  );
}
