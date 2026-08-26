import { WeekNumber } from "../utils/week";
import { WeekRange } from "../types";
import SectionLabel from "./ui/SectionLabel";

interface ActiveWeekSelectorProps {
  activeWeek: WeekNumber;
  onActiveWeekChange: (week: WeekNumber) => void;
  compact?: boolean;
  weekRanges?: WeekRange[];
}

const WEEKS: WeekNumber[] = [1, 2, 3, 4];

export default function ActiveWeekSelector({
  activeWeek,
  onActiveWeekChange,
  compact = false,
  weekRanges,
}: ActiveWeekSelectorProps) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact && (
        <div className="flex items-center justify-between gap-2">
          <div>
            <SectionLabel>Semana actual</SectionLabel>
            <p className="text-xs text-muted mt-0.5">
              Indica en qué semana del ciclo estás
            </p>
          </div>
          <span className="material-symbols-outlined text-sage text-xl">today</span>
        </div>
      )}
      <div
        className={`grid grid-cols-4 bg-surface-raised rounded-xl p-1 ${
          compact ? "gap-0.5" : "gap-1"
        }`}
      >
        {WEEKS.map((week) => {
          const range = weekRanges?.find((item) => item.week === week);
          const isCompleted = range?.status === "completed";

          return (
            <button
              key={week}
              type="button"
              onClick={() => onActiveWeekChange(week)}
              className={`rounded-lg font-mono transition-all cursor-pointer ${
                compact ? "py-1.5 px-1 text-[10px]" : "py-2 px-2 text-xs"
              } ${
                activeWeek === week
                  ? "bg-sage text-ink font-medium"
                  : isCompleted
                    ? "text-muted/60 hover:text-muted"
                    : "text-muted hover:text-paper"
              }`}
            >
              <span className="block">{compact ? `Sem ${week}` : `Semana ${week}`}</span>
              {range && (
                <span
                  className={`block mt-0.5 leading-tight ${
                    compact ? "text-[8px]" : "text-[9px]"
                  } ${activeWeek === week ? "text-ink/70" : "text-muted/60"}`}
                >
                  {range.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
