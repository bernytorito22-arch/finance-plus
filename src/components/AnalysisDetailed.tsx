import { useEffect, useState } from "react";
import { Expense, FinanceCycleConfig, MonthlyBudget, WalletSplit, Wallets, WeeklyBudgets } from "../types";
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
import { getTransactionType } from "../utils/wallet";

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
  onResetCycleExpenses?: () => void;
  wallets: Wallets;
  walletSplit: WalletSplit;
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
  onResetCycleExpenses,
  wallets,
  walletSplit,
}: AnalysisDetailedProps) {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [hasConfirmedExport, setHasConfirmedExport] = useState(false);

  const closeResetModal = () => {
    setIsResetModalOpen(false);
    setHasConfirmedExport(false);
  };

  const now = new Date();
  const cycleRange = getFinanceCycleRange(now, financeCycleConfig.monthStartDay);
  const weekRanges = getFinanceWeekRanges(cycleRange, now);
  const cycleExpenses = expenses.filter((expense) =>
    isDateInRange(expense.date, cycleRange.startDate, cycleRange.endDate)
  );
  const cycleGastos = cycleExpenses.filter((expense) => getTransactionType(expense) === "gasto");
  const cycleStart = parseDateOnly(cycleRange.startDate);
  const cycleEnd = parseDateOnly(cycleRange.endDate);
  const daysInCycle = daysBetweenInclusive(cycleStart, cycleEnd);
  const dayOfCycle = Math.min(
    daysInCycle,
    Math.max(1, daysBetweenInclusive(cycleStart, startOfDay(now)))
  );

  const totalExpenses = cycleGastos.reduce((sum, expense) => sum + expense.amount, 0);
  const remainingBudget = budget.totalBudget - totalExpenses;
  const budgetPercentage = budget.totalBudget > 0
    ? Math.min(100, Math.round((totalExpenses / budget.totalBudget) * 100))
    : 0;

  const spentToday = cycleGastos
    .filter((expense) => isSameDay(expense.date, now))
    .reduce((sum, expense) => sum + expense.amount, 0);

  const spentThisWeek = cycleGastos
    .filter((expense) => expense.week === activeWeek)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const projectedCycleTotal = dayOfCycle > 0 && totalExpenses > 0
    ? (totalExpenses / dayOfCycle) * daysInCycle
    : 0;

  const categoryTotals: Record<string, number> = {};
  cycleGastos.forEach((expense) => {
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
      wallets,
      walletSplit,
      referenceDate: now,
    });
    downloadJsonFile(payload);
  };

  const handleConfirmReset = () => {
    if (!hasConfirmedExport || isDemoMode) return;
    onResetCycleExpenses?.();
    closeResetModal();
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
        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            onClick={handleExportCycle}
            disabled={isDemoMode}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
              isDemoMode
                ? "bg-white/5 border-white/10 text-[#bbcabf]/50 cursor-not-allowed"
                : "bg-[#4edea3]/10 border-[#4edea3]/40 text-[#4edea3] hover:bg-[#4edea3]/20 active:scale-95 cursor-pointer"
            }`}
            title={isDemoMode ? "Cambia a Mis datos para exportar" : "Exportar ciclo JSON"}
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Exportar JSON
          </button>
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            disabled={isDemoMode}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
              isDemoMode
                ? "bg-white/5 border-white/10 text-[#bbcabf]/50 cursor-not-allowed"
                : "bg-red-500/10 border-red-400/40 text-red-300 hover:bg-red-500/20 active:scale-95 cursor-pointer"
            }`}
            title={isDemoMode ? "Cambia a Mis datos para reiniciar" : "Reiniciar gastos del ciclo actual"}
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            Reiniciar ciclo
          </button>
        </div>
      </section>

      {isDemoMode && (
        <p className="font-sans text-xs text-[#bbcabf]/70 -mt-2">
          Cambia a Mis datos para exportar o reiniciar tu ciclo real.
        </p>
      )}

      {isResetModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#060e20]/85 backdrop-blur-md"
          onClick={closeResetModal}
        >
          <div
            className="glass-card w-full max-w-sm rounded-2xl p-6 space-y-5 animate-fade-in relative border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="font-sans text-lg font-bold text-[#dae2fd] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-red-300">warning</span>
                ¿Reiniciar el ciclo?
              </h3>
              <button
                type="button"
                onClick={closeResetModal}
                className="text-[#bbcabf] hover:text-white transition-all cursor-pointer w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/5"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 font-sans text-sm text-[#bbcabf] leading-relaxed">
              <p>
                Se borrarán los gastos del ciclo <span className="text-[#dae2fd] font-semibold">{cycleRange.label}</span>.
              </p>
              <p>
                Se eliminarán{" "}
                <span className="text-[#dae2fd] font-semibold">{cycleExpenses.length}</span>{" "}
                {cycleExpenses.length === 1 ? "gasto" : "gastos"}.
              </p>
              <p>El presupuesto y el ingreso se mantienen.</p>
              <p className="text-xs text-[#bbcabf]/80">
                Si quieres guardarlos, exporta el JSON antes de continuar.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-white/10 bg-white/5 p-3">
              <input
                type="checkbox"
                checked={hasConfirmedExport}
                onChange={(e) => setHasConfirmedExport(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-[#171f33] text-[#4edea3] focus:ring-[#4edea3] focus:ring-offset-0"
              />
              <span className="font-sans text-xs text-[#dae2fd] leading-relaxed">
                Ya exporté mis datos / entiendo que no podré recuperarlos.
              </span>
            </label>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={closeResetModal}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 text-[#dae2fd] text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={!hasConfirmedExport || isDemoMode}
                className={`flex-1 text-xs font-semibold py-2.5 rounded-xl transition-all ${
                  !hasConfirmedExport || isDemoMode
                    ? "bg-red-500/20 border border-red-400/20 text-red-300/50 cursor-not-allowed"
                    : "bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 text-red-300 active:scale-95 cursor-pointer"
                }`}
              >
                Reiniciar
              </button>
            </div>
          </div>
        </div>
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
