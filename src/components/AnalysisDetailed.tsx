import { useEffect } from "react";
import { Expense, FinanceCycleConfig, MonthlyBudget, WeeklyBudgets } from "../types";
import { CATEGORIES_CONFIG } from "../mockData";
import ActiveWeekSelector from "./ActiveWeekSelector";
import { buildMonthlyExportPayload, downloadJsonFile } from "../utils/exportMonthlyData";
import {
  getFinanceCycleRange,
  getFinanceWeekRanges,
  isDateInRange,
  parseDateOnly,
  daysBetweenInclusive,
  startOfDay,
  WeekNumber,
} from "../utils/week";

interface AnalysisDetailedProps {
  expenses: Expense[];
  budget: MonthlyBudget;
  weekBudgets: WeeklyBudgets;
  activeWeek: WeekNumber;
  onActiveWeekChange: (week: WeekNumber) => void;
  aiRecommendation?: string;
  onRefreshAi?: () => void;
  isLoadingAi?: boolean;
  financeCycleConfig: FinanceCycleConfig;
  isDemoMode: boolean;
}

function isSameDay(dateStr: string, ref = new Date()): boolean {
  const date = new Date(dateStr);
  return (
    date.getFullYear() === ref.getFullYear() &&
    date.getMonth() === ref.getMonth() &&
    date.getDate() === ref.getDate()
  );
}

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const day = String(date.getDate()).padStart(2, "0");
    const month = months[date.getMonth()];
    const hours = String(date.getHours()).padStart(2, "0");
    const mins = String(date.getMinutes()).padStart(2, "0");
    return `${day} ${month}, ${hours}:${mins}`;
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AnalysisDetailed({
  expenses,
  budget,
  weekBudgets,
  activeWeek,
  onActiveWeekChange,
  aiRecommendation,
  onRefreshAi,
  isLoadingAi,
  financeCycleConfig,
  isDemoMode,
}: AnalysisDetailedProps) {
  const now = new Date();
  const cycleRange = getFinanceCycleRange(now, financeCycleConfig.monthStartDay);
  const weekRanges = getFinanceWeekRanges(cycleRange, now);
  const cycleExpenses = expenses.filter((expense) =>
    isDateInRange(expense.date, cycleRange.startDate, cycleRange.endDate)
  );
  const cycleStart = parseDateOnly(cycleRange.startDate);
  const cycleEnd = parseDateOnly(cycleRange.endDate);
  const daysInCycle = daysBetweenInclusive(cycleStart, cycleEnd);
  const dayOfCycle = Math.min(
    daysInCycle,
    Math.max(1, daysBetweenInclusive(cycleStart, startOfDay(now)))
  );

  const totalExpenses = cycleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remainingBudget = budget.totalBudget - totalExpenses;
  const budgetPercentage = budget.totalBudget > 0
    ? Math.min(100, Math.round((totalExpenses / budget.totalBudget) * 100))
    : 0;

  const spentToday = cycleExpenses
    .filter((expense) => isSameDay(expense.date, now))
    .reduce((sum, expense) => sum + expense.amount, 0);

  const spentThisWeek = cycleExpenses
    .filter((expense) => expense.week === activeWeek)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const projectedCycleTotal = dayOfCycle > 0 && totalExpenses > 0
    ? (totalExpenses / dayOfCycle) * daysInCycle
    : 0;

  const categoryTotals: Record<string, number> = {};
  cycleExpenses.forEach((expense) => {
    categoryTotals[expense.category] = (categoryTotals[expense.category] ?? 0) + expense.amount;
  });

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, total]) => ({
      name,
      total,
      percentage: totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0,
      config: CATEGORIES_CONFIG.find((category) => category.name === name),
    }));

  const recentExpenses = [...cycleExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const hasData = totalExpenses > 0;

  const handleExportCycle = () => {
    if (isDemoMode) return;

    const payload = buildMonthlyExportPayload({
      expenses,
      budget,
      weekBudgets,
      financeCycleConfig,
      referenceDate: now,
    });
    downloadJsonFile(payload);
  };

  useEffect(() => {
    if (!aiRecommendation && onRefreshAi && expenses.length > 0) {
      onRefreshAi();
    }
  }, []);

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-sans text-2xl font-bold text-[#dae2fd] mb-1">Resumen</h2>
          <p className="text-[#bbcabf] font-sans text-sm">
            Vista rápida del ciclo {cycleRange.label}
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCycle}
          disabled={isDemoMode}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
            isDemoMode
              ? "bg-white/5 border-white/10 text-[#bbcabf]/50 cursor-not-allowed"
              : "bg-[#4edea3]/10 border-[#4edea3]/40 text-[#4edea3] hover:bg-[#4edea3]/20 active:scale-95 cursor-pointer"
          }`}
          title={isDemoMode ? "Cambia a Mis datos para exportar" : "Exportar ciclo JSON"}
        >
          <span className="material-symbols-outlined text-sm">download</span>
          Exportar JSON
        </button>
      </section>

      {isDemoMode && (
        <p className="font-sans text-xs text-[#bbcabf]/70 -mt-2">
          Cambia a Mis datos para exportar tu ciclo real.
        </p>
      )}

      <section className="glass-card rounded-2xl p-5 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4edea3]/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] text-[#bbcabf] uppercase tracking-wider mb-1">
                Presupuesto del ciclo
              </p>
              <p className="font-sans text-2xl font-extrabold text-[#4edea3]">
                ${formatCurrency(remainingBudget)}
              </p>
              <p className="font-sans text-xs text-[#bbcabf] mt-0.5">restantes</p>
            </div>
            {budget.totalBudget > 0 && (
              <div className="text-right">
                <p className="font-mono text-[10px] text-[#bbcabf] uppercase tracking-wider mb-1">
                  Usado
                </p>
                <p className="font-sans text-xl font-bold text-[#dae2fd]">{budgetPercentage}%</p>
              </div>
            )}
          </div>

          {budget.totalBudget > 0 ? (
            <div className="space-y-1.5">
              <div className="h-2 bg-[#171f33] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${
                    budgetPercentage >= 90 ? "bg-red-400" : "bg-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.5)]"
                  }`}
                  style={{ width: `${budgetPercentage}%` }}
                />
              </div>
              <div className="flex justify-between font-mono text-[10px] text-[#bbcabf]">
                <span>Gastado: ${formatCurrency(totalExpenses)}</span>
                <span>Límite: ${formatCurrency(budget.totalBudget)}</span>
              </div>
            </div>
          ) : (
            <p className="font-sans text-xs text-[#bbcabf]/70">
              Configura tu presupuesto del ciclo en la pestaña Monthly.
            </p>
          )}

          {hasData && budget.totalBudget > 0 && (
            <div className="rounded-xl bg-white/5 border border-white/5 p-3">
              <p className="font-mono text-[10px] text-[#bbcabf] uppercase tracking-wider mb-1">
                Proyección de fin de ciclo
              </p>
              <p className="font-sans text-xs text-[#bbcabf] leading-relaxed">
                {projectedCycleTotal <= budget.totalBudget ? (
                  <>
                    Si mantienes este ritmo, terminarás el ciclo con{" "}
                    <span className="text-[#4edea3] font-bold">
                      ${formatCurrency(budget.totalBudget - projectedCycleTotal)}
                    </span>{" "}
                    de margen.
                  </>
                ) : (
                  <>
                    Si mantienes este ritmo, podrías superar tu presupuesto en{" "}
                    <span className="text-red-400 font-bold">
                      ${formatCurrency(projectedCycleTotal - budget.totalBudget)}
                    </span>
                    .
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-4 space-y-1">
          <p className="font-mono text-[10px] text-[#bbcabf] uppercase tracking-wider">Hoy</p>
          <p className="font-sans text-xl font-extrabold text-[#dae2fd]">
            ${formatCurrency(spentToday)}
          </p>
          <p className="font-sans text-[10px] text-[#bbcabf]/70">gastado hoy</p>
        </div>
        <div className="glass-card rounded-xl p-4 space-y-3">
          <div>
            <p className="font-mono text-[10px] text-[#bbcabf] uppercase tracking-wider">
              Semana {activeWeek}
            </p>
            <p className="font-sans text-xl font-extrabold text-[#dae2fd] mt-1">
              ${formatCurrency(spentThisWeek)}
            </p>
            <p className="font-sans text-[10px] text-[#bbcabf]/70">esta semana</p>
          </div>
          <ActiveWeekSelector
            activeWeek={activeWeek}
            onActiveWeekChange={onActiveWeekChange}
            compact
            weekRanges={weekRanges}
          />
        </div>
      </section>

      <section className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="font-sans text-md font-bold text-[#dae2fd]">Top categorías del ciclo</h3>
        {topCategories.length === 0 ? (
          <p className="font-sans text-sm text-[#bbcabf]/70 text-center py-4">
            Sin gastos registrados aún
          </p>
        ) : (
          <div className="space-y-3">
            {topCategories.map((category, index) => (
              <div key={category.name} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] text-[#4edea3] font-bold w-4">
                      {index + 1}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg ${category.config?.bgColor ?? "bg-white/10"} flex items-center justify-center ${category.config?.textColor ?? "text-[#dae2fd]"} shrink-0`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {category.config?.icon ?? "category"}
                      </span>
                    </div>
                    <span className="font-sans text-sm text-[#dae2fd] truncate">{category.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xs font-bold text-[#dae2fd]">
                      ${formatCurrency(category.total)}
                    </p>
                    <p className="font-mono text-[10px] text-[#bbcabf]">{category.percentage}%</p>
                  </div>
                </div>
                <div className="h-1 bg-[#171f33] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4edea3]/70 transition-all duration-700"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-sans text-md font-bold text-[#dae2fd]">Últimas transacciones</h3>
        </div>
        {recentExpenses.length === 0 ? (
          <div className="p-8 text-center text-[#bbcabf]">
            <span className="material-symbols-outlined text-4xl mb-2 text-[#bbcabf]/50">receipt_long</span>
            <p className="text-sm">No hay transacciones aún</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentExpenses.map((expense) => {
              const config =
                CATEGORIES_CONFIG.find((category) => category.name === expense.category) ??
                CATEGORIES_CONFIG[CATEGORIES_CONFIG.length - 1];

              return (
                <div key={expense.id} className="flex items-center justify-between p-4 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg ${config.bgColor} flex items-center justify-center ${config.textColor} shrink-0`}
                    >
                      <span className="material-symbols-outlined text-base">{config.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-semibold text-[#dae2fd] truncate">
                        {expense.name}
                      </p>
                      <p className="font-mono text-[10px] text-[#bbcabf] truncate">
                        {formatDate(expense.date)} • {expense.category}
                      </p>
                    </div>
                  </div>
                  <p className="font-mono text-sm font-semibold text-[#dae2fd] shrink-0">
                    -${expense.amount.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="glass-card p-5 rounded-xl border-l-4 border-[#4edea3] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4edea3]/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
        <div className="flex gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full bg-[#4edea3]/10 flex items-center justify-center text-[#4edea3] shrink-0">
            <span className="material-symbols-outlined font-semibold text-2xl">lightbulb</span>
          </div>
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-sans text-base font-bold text-[#dae2fd]">
                Recomendación Finance+ AI
              </h4>
              <button
                onClick={onRefreshAi}
                disabled={isLoadingAi}
                className="material-symbols-outlined text-xs text-[#4edea3] hover:text-[#dae2fd] active:scale-90 transition-all cursor-pointer select-none disabled:opacity-50"
                title="Generar nueva recomendación"
              >
                refresh
              </button>
            </div>

            {isLoadingAi ? (
              <div className="space-y-2 py-1">
                <div className="h-3 bg-white/5 rounded animate-pulse w-full" />
                <div className="h-3 bg-white/5 rounded animate-pulse w-4/5" />
              </div>
            ) : (
              <p className="font-sans text-xs text-[#bbcabf] leading-relaxed">
                {aiRecommendation ||
                  (hasData
                    ? "Haz clic en recargar para obtener tu diagnóstico personalizado."
                    : "Registra tus primeros gastos para recibir recomendaciones personalizadas.")}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
