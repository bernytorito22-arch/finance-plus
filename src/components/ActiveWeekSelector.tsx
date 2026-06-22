import { WeekNumber } from "../utils/week";

interface ActiveWeekSelectorProps {
  activeWeek: WeekNumber;
  onActiveWeekChange: (week: WeekNumber) => void;
  compact?: boolean;
}

const WEEKS: WeekNumber[] = [1, 2, 3, 4];

export default function ActiveWeekSelector({
  activeWeek,
  onActiveWeekChange,
  compact = false,
}: ActiveWeekSelectorProps) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact && (
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] text-[#bbcabf] uppercase tracking-wider">
              Semana actual
            </p>
            <p className="font-sans text-xs text-[#bbcabf]/70 mt-0.5">
              Indica en qué semana del mes estás
            </p>
          </div>
          <span className="material-symbols-outlined text-[#4edea3] text-xl">today</span>
        </div>
      )}
      <div className={`grid grid-cols-4 ${compact ? "gap-1" : "gap-2"}`}>
        {WEEKS.map((week) => (
          <button
            key={week}
            type="button"
            onClick={() => onActiveWeekChange(week)}
            className={`rounded-lg font-mono border transition-all cursor-pointer ${
              compact ? "py-1 px-2 text-[10px]" : "py-2 px-3 text-xs"
            } ${
              activeWeek === week
                ? "bg-[#4edea3]/10 border-[#4edea3] text-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.15)]"
                : "bg-[#060e20] border-[#3c4a42] text-[#bbcabf] hover:border-[#bbcabf]/30"
            }`}
          >
            {compact ? week : `Semana ${week}`}
          </button>
        ))}
      </div>
    </div>
  );
}
