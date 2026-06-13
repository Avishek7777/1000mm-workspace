type MissionRow = {
  code: string;
  name: string;
  count: number;
  color: string;
};

type MissionsBreakdownProps = {
  missions: MissionRow[];
  total: number;
};

export function MissionsBreakdown({ missions, total }: MissionsBreakdownProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-medium text-gray-900">
        Applications by mission
      </h2>
      <ul className="space-y-2.5">
        {missions.map((mission) => {
          const pct = total > 0 ? Math.round((mission.count / total) * 100) : 0;
          return (
            <li key={mission.code}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ background: mission.color }}
                    aria-hidden="true"
                  />
                  <span className="text-xs text-gray-700">{mission.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {mission.count} ({pct}%)
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: mission.color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
