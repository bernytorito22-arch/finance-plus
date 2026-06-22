import { useState, useEffect } from "react";
import { Expense, WeeklyBudgets } from "../types";
import { CATEGORIES_CONFIG } from "../mockData";
import ActiveWeekSelector from "./ActiveWeekSelector";
import { WeekNumber } from "../utils/week";

interface WeeklyTrackingProps {
  expenses: Expense[];
  weekBudgets: WeeklyBudgets;
  activeWeek: WeekNumber;
  onActiveWeekChange: (week: WeekNumber) => void;
  onUpdateWeekBudgets?: (budgets: WeeklyBudgets) => void;
  monthlyBudget?: number;
  onDeleteExpense?: (id: string) => void;
}

export default function WeeklyTracking({
  expenses,
  weekBudgets,
  activeWeek,
  onActiveWeekChange,
  onUpdateWeekBudgets,
  monthlyBudget = 0,
  onDeleteExpense,
}: WeeklyTrackingProps) {
  const [selectedWeek, setSelectedWeek] = useState<number>(activeWeek);
  const [expandedDescriptionId, setExpandedDescriptionId] = useState<string | null>(null);
  const [isEditingBudgets, setIsEditingBudgets] = useState(false);
  const [editWeekBudgets, setEditWeekBudgets] = useState<Record<number, string>>({
    1: "0",
    2: "0",
    3: "0",
    4: "0",
  });

  useEffect(() => {
    setSelectedWeek(activeWeek);
  }, [activeWeek]);

  const handleActiveWeekChange = (week: WeekNumber) => {
    onActiveWeekChange(week);
    setSelectedWeek(week);
  };

  // Calculate stats per week
  const calculateWeekSpent = (weekNum: number) => {
    return expenses
      .filter((e) => e.week === weekNum)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const weekExpenses = expenses.filter((e) => e.week === selectedWeek);
  const weekSpent = calculateWeekSpent(selectedWeek);
  const weekBudget = weekBudgets[selectedWeek];

  const categoryTotals = weekExpenses.reduce<Record<string, number>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] ?? 0) + expense.amount;
    return acc;
  }, {});

  const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const topCategoryName = topCategoryEntry?.[0];
  const topCategoryAmount = topCategoryEntry?.[1] ?? 0;
  const topCategoryConfig = topCategoryName
    ? CATEGORIES_CONFIG.find((category) => category.name === topCategoryName)
    : null;

  const budgetPercentUsed = weekBudget > 0
    ? Math.round((weekSpent / weekBudget) * 100)
    : null;
  const budgetRemaining = weekBudget - weekSpent;

  const openBudgetEditor = () => {
    setEditWeekBudgets({
      1: weekBudgets[1].toString(),
      2: weekBudgets[2].toString(),
      3: weekBudgets[3].toString(),
      4: weekBudgets[4].toString(),
    });
    setIsEditingBudgets(true);
  };

  const splitMonthlyBudgetEvenly = () => {
    if (monthlyBudget <= 0) return;
    const perWeek = (monthlyBudget / 4).toFixed(2);
    setEditWeekBudgets({
      1: perWeek,
      2: perWeek,
      3: perWeek,
      4: perWeek,
    });
  };

  const currentMonthName = new Intl.DateTimeFormat("es-ES", { month: "long" })
    .format(new Date())
    .replace(/^\w/, (char) => char.toUpperCase());

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const day = String(d.getDate()).padStart(2, "0");
      const month = months[d.getMonth()];
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      return `${day} ${month}, ${hours}:${mins}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-sans text-2xl font-bold text-[#dae2fd] mb-1">Seguimiento Semanal</h2>
          <p className="text-[#bbcabf] font-sans text-sm">
            Resumen de tus gastos de {currentMonthName} por semana.
          </p>
        </div>
        {onUpdateWeekBudgets && (
          <button
            onClick={openBudgetEditor}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-[#4edea3] flex items-center justify-center border border-white/5 transition-all cursor-pointer shrink-0"
            title="Configurar presupuestos semanales"
          >
            <span className="material-symbols-outlined text-base font-semibold">tune</span>
          </button>
        )}
      </div>

      <div className="glass-card rounded-xl p-4">
        <ActiveWeekSelector
          activeWeek={activeWeek}
          onActiveWeekChange={handleActiveWeekChange}
        />
      </div>

      {/* Weekly summary cards swipeable / grid layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((wk) => {
          const spent = calculateWeekSpent(wk);
          const limit = weekBudgets[wk];
          const isSelected = selectedWeek === wk;
          const hasSpent = spent > 0;

          const ratio = limit > 0
            ? Math.min(100, Math.round((spent / limit) * 100))
            : 0;

          return (
            <div
              key={wk}
              onClick={() => setSelectedWeek(wk)}
              className={`rounded-xl p-4 cursor-pointer transition-all duration-300 transform active:scale-98 relative ${
                isSelected
                  ? "glass-card-active border-[#4edea3]/40 neo-glow"
                  : "glass-card border-white/5 hover:border-white/15"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`font-mono text-xs font-bold ${isSelected ? "text-[#4edea3]" : "text-[#bbcabf]"}`}>
                  Semana {wk}
                </span>
                <span className="material-symbols-outlined text-[#4edea3] text-lg select-none" style={{ fontVariationSettings: `'FILL' ${isSelected ? 1 : 0}` }}>
                  {hasSpent ? "check_circle" : isSelected ? "schedule" : "calendar_today"}
                </span>
              </div>

              <div className="mb-3">
                <div className="font-mono text-[10px] text-[#bbcabf] uppercase tracking-wider mb-0.5">
                  Gastado
                </div>
                <div className={`font-sans text-lg font-extrabold ${hasSpent ? "text-[#dae2fd]" : "text-[#bbcabf]/50"}`}>
                  ${spent.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full transition-all duration-700 ${isSelected ? "bg-[#4edea3] shadow-[0_0_8px_#4edea3]" : "bg-[#4edea3]/40"}`}
                  style={{ width: `${ratio}%` }}
                ></div>
              </div>

              <div className="flex justify-between font-mono text-[10px] text-[#bbcabf]">
                <span>Presupuesto</span>
                <span className="text-[#dae2fd]">${limit.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Transactions Section */}
      <section className="space-y-4">
        <h3 className="font-sans text-lg font-bold text-[#dae2fd]">
          Transacciones Semana {selectedWeek}
        </h3>

        {weekExpenses.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-[#bbcabf]">
            <span className="material-symbols-outlined text-4xl mb-2 text-[#bbcabf]/50">receipt_long</span>
            <p className="text-sm">No hay transacciones registradas</p>
            <p className="text-xs text-[#bbcabf]/60 mt-1">Registra gastos para esta semana.</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/5">
            {weekExpenses.map((expense) => {
              // Retrieve configured style icons
              const config = CATEGORIES_CONFIG.find((c) => c.name === expense.category) || CATEGORIES_CONFIG[CATEGORIES_CONFIG.length - 1];
              
              // Map categories to visual badges
              const iconName = config.icon;
              const textAccent = 
                expense.status === "Rechazado" ? "text-red-400" : "text-[#4edea3]";

              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group relative"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-2">
                    <div className={`w-11 h-11 rounded-xl ${config.bgColor} flex items-center justify-center ${config.textColor} shrink-0`}>
                      <span className="material-symbols-outlined text-lg">{iconName}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-semibold text-[#dae2fd] truncate group-hover:text-white">
                        {expense.name}
                      </p>
                      <p className="font-mono text-xs text-[#bbcabf] truncate">
                        {formatDate(expense.date)} • {expense.category}
                      </p>
                      {expense.description && (() => {
                        const descriptionLimit = 45;
                        const isLongDescription = expense.description.length > descriptionLimit;
                        const isExpanded = expandedDescriptionId === expense.id;

                        return (
                          <button
                            type="button"
                            onClick={() => {
                              if (!isLongDescription) return;
                              setExpandedDescriptionId(isExpanded ? null : expense.id);
                            }}
                            className={`mt-0.5 text-left w-full ${
                              isLongDescription ? "cursor-pointer group/desc" : "cursor-default"
                            }`}
                            title={isLongDescription && !isExpanded ? "Ver descripción completa" : undefined}
                          >
                            <p
                              className={`font-sans text-[11px] text-[#bbcabf]/60 italic ${
                                isLongDescription && !isExpanded
                                  ? "truncate max-w-[200px] sm:max-w-xs group-hover/desc:text-[#dae2fd]/80"
                                  : "whitespace-pre-wrap break-words text-[#dae2fd]/80"
                              }`}
                            >
                              "{isLongDescription && !isExpanded
                                ? `${expense.description.slice(0, descriptionLimit)}...`
                                : expense.description}"
                            </p>
                            {isLongDescription && !isExpanded && (
                              <span className="font-sans text-[10px] text-[#4edea3] font-semibold group-hover/desc:underline">
                                ··· ver más
                              </span>
                            )}
                            {isLongDescription && isExpanded && (
                              <span className="font-sans text-[10px] text-[#bbcabf]/60 group-hover/desc:text-[#dae2fd]">
                                ver menos
                              </span>
                            )}
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold text-[#dae2fd]">
                        -${expense.amount.toFixed(2)}
                      </p>
                      <p className={`font-mono text-[10px] ${textAccent}`}>
                        {expense.status === "Rechazado" ? "Rechazado" : "Completado"}
                      </p>
                    </div>

                    {/* Delete action button */}
                    {onDeleteExpense && (
                      <button
                        onClick={() => onDeleteExpense(expense.id)}
                        className="material-symbols-outlined text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-500/10 cursor-pointer ml-1 text-base"
                      >
                        delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {weekExpenses.length > 0 && (
      <div className="glass-card rounded-2xl p-5 flex items-center gap-5 border-[#4edea3]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4edea3]/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none"></div>
        <div className="w-14 h-14 rounded-full bg-[#4edea3]/10 flex items-center justify-center text-[#4edea3] shrink-0">
          <span className="material-symbols-outlined text-3xl font-light">summarize</span>
        </div>
        <div className="space-y-1.5 min-w-0">
          <h4 className="font-sans text-sm font-bold text-[#dae2fd]">
            Resumen Semana {selectedWeek}
          </h4>
          <p className="font-sans text-xs text-[#bbcabf] leading-relaxed">
            Total gastado:{" "}
            <span className="text-[#dae2fd] font-bold">
              ${weekSpent.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {" "}en {weekExpenses.length} {weekExpenses.length === 1 ? "transacción" : "transacciones"}.
          </p>
          <p className="font-sans text-xs text-[#bbcabf] leading-relaxed">
            {weekBudget > 0 ? (
              budgetRemaining >= 0 ? (
                <>
                  Te quedan{" "}
                  <span className="text-[#4edea3] font-bold">
                    ${budgetRemaining.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {" "}del presupuesto semanal ({budgetPercentUsed}% usado).
                </>
              ) : (
                <>
                  Has superado el presupuesto semanal en{" "}
                  <span className="text-red-400 font-bold">
                    ${Math.abs(budgetRemaining).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  .
                </>
              )
            ) : (
              "Sin presupuesto semanal configurado."
            )}
          </p>
          {topCategoryName && (
            <p className="font-sans text-xs text-[#bbcabf] leading-relaxed">
              Mayor gasto:{" "}
              <span className={`font-bold ${topCategoryConfig?.textColor ?? "text-[#4edea3]"}`}>
                {topCategoryName}
              </span>
              {" "}(
              ${topCategoryAmount.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              ).
            </p>
          )}
        </div>
      </div>
      )}

      {isEditingBudgets && onUpdateWeekBudgets && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#060e20]/85 backdrop-blur-md">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 space-y-5 animate-fade-in relative border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="font-sans text-lg font-bold text-[#dae2fd] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4edea3]">calendar_view_week</span>
                Presupuestos Semanales
              </h3>
              <button
                onClick={() => setIsEditingBudgets(false)}
                className="text-[#bbcabf] hover:text-white transition-all cursor-pointer w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/5"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="font-sans text-xs text-[#bbcabf] leading-relaxed">
              Define cuánto planeas gastar en cada semana del mes.
            </p>

            {monthlyBudget > 0 && (
              <button
                type="button"
                onClick={splitMonthlyBudgetEvenly}
                className="w-full text-left font-sans text-xs text-[#4edea3] hover:text-[#7ef0c4] transition-colors cursor-pointer"
              >
                Repartir presupuesto mensual (${monthlyBudget.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) en 4 semanas
              </button>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const parsedBudgets: WeeklyBudgets = {
                  1: parseFloat(editWeekBudgets[1]) || 0,
                  2: parseFloat(editWeekBudgets[2]) || 0,
                  3: parseFloat(editWeekBudgets[3]) || 0,
                  4: parseFloat(editWeekBudgets[4]) || 0,
                };
                onUpdateWeekBudgets(parsedBudgets);
                setIsEditingBudgets(false);
              }}
              className="space-y-4"
            >
              {[1, 2, 3, 4].map((week) => (
                <div key={week} className="space-y-1.5">
                  <label className="font-mono text-[10px] text-[#bbcabf] uppercase tracking-wider block">
                    Semana {week}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-sans text-sm text-[#bbcabf] select-none">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={editWeekBudgets[week]}
                      onChange={(e) =>
                        setEditWeekBudgets((prev) => ({ ...prev, [week]: e.target.value }))
                      }
                      className="w-full bg-[#171f33]/70 border border-white/10 rounded-xl py-2.5 pl-8 pr-4 font-sans text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#4edea3] focus:border-[#4edea3] transition-all"
                    />
                  </div>
                </div>
              ))}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#4edea3] to-[#10b981] text-[#002113] font-sans font-bold text-sm py-3 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-[0_0_15px_rgba(78,222,163,0.3)]"
              >
                Guardar presupuestos
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
