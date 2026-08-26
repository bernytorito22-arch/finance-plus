import { useState, useEffect } from "react";
import { Expense, FinanceCycleConfig, MutationResult, WeeklyBudgets } from "../types";
import { CATEGORIES_CONFIG } from "../mockData";
import ActiveWeekSelector from "./ActiveWeekSelector";
import TransactionDetailModal from "./TransactionDetailModal";
import Money from "./ui/Money";
import SectionLabel from "./ui/SectionLabel";
import Row from "./ui/Row";
import Button from "./ui/Button";
import { Field, TextInput, SelectInput } from "./ui/Field";
import {
  clampMonthStartDay,
  getCurrentWeekRange,
  getDaysRemainingInRange,
  getFinanceCycleRange,
  getFinanceWeekRanges,
  WeekNumber,
} from "../utils/week";
import { getTransactionType } from "../utils/wallet";

interface WeeklyTrackingProps {
  expenses: Expense[];
  weekBudgets: WeeklyBudgets;
  activeWeek: WeekNumber;
  onActiveWeekChange: (week: WeekNumber) => void;
  onUpdateWeekBudgets?: (budgets: WeeklyBudgets) => void;
  monthlyBudget?: number;
  onDeleteExpense?: (id: string) => MutationResult;
  onUpdateExpense?: (expense: Expense) => MutationResult;
  financeCycleConfig: FinanceCycleConfig;
  onUpdateFinanceCycleConfig: (config: FinanceCycleConfig) => void;
}

export default function WeeklyTracking({
  expenses,
  weekBudgets,
  activeWeek,
  onActiveWeekChange,
  onUpdateWeekBudgets,
  monthlyBudget = 0,
  onDeleteExpense,
  onUpdateExpense,
  financeCycleConfig,
  onUpdateFinanceCycleConfig,
}: WeeklyTrackingProps) {
  const [selectedWeek, setSelectedWeek] = useState<number>(activeWeek);
  const [expandedDescriptionId, setExpandedDescriptionId] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Expense | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isEditingBudgets, setIsEditingBudgets] = useState(false);
  const [isEditingCycle, setIsEditingCycle] = useState(false);
  const [editCycleStartDay, setEditCycleStartDay] = useState(
    financeCycleConfig.monthStartDay.toString()
  );
  const [editWeekBudgets, setEditWeekBudgets] = useState<Record<number, string>>({
    1: "0",
    2: "0",
    3: "0",
    4: "0",
  });

  useEffect(() => {
    setSelectedWeek(activeWeek);
  }, [activeWeek]);

  useEffect(() => {
    setEditCycleStartDay(financeCycleConfig.monthStartDay.toString());
  }, [financeCycleConfig.monthStartDay]);

  const now = new Date();
  const cycleRange = getFinanceCycleRange(now, financeCycleConfig.monthStartDay);
  const weekRanges = getFinanceWeekRanges(cycleRange, now);
  const currentWeekRange = getCurrentWeekRange(cycleRange, now, financeCycleConfig.monthStartDay);
  const daysLeftInWeek = getDaysRemainingInRange(currentWeekRange, now);
  const daysLeftInCycle = getDaysRemainingInRange(cycleRange, now);

  const handleActiveWeekChange = (week: WeekNumber) => {
    onActiveWeekChange(week);
    setSelectedWeek(week);
  };

  // Calculate stats per week
  const calculateWeekSpent = (weekNum: number) => {
    return expenses
      .filter((e) => e.week === weekNum && getTransactionType(e) === "gasto")
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const weekExpenses = expenses.filter((e) => e.week === selectedWeek);
  const weekSpent = calculateWeekSpent(selectedWeek);
  const weekBudget = weekBudgets[selectedWeek];

  const categoryTotals = weekExpenses.reduce<Record<string, number>>((acc, expense) => {
    if (getTransactionType(expense) !== "gasto") return acc;
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
          <h2 className="font-serif text-2xl text-paper mb-1">Seguimiento Semanal</h2>
          <p className="text-muted text-sm">
            Ciclo {cycleRange.label}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsEditingCycle(true)}
            className="w-9 h-9 rounded-full border border-hairline text-muted hover:text-paper hover:border-muted flex items-center justify-center transition-colors cursor-pointer"
            title="Configurar inicio del ciclo"
          >
            <span className="material-symbols-outlined text-base">event</span>
          </button>
          {onUpdateWeekBudgets && (
            <button
              onClick={openBudgetEditor}
              className="w-9 h-9 rounded-full border border-hairline text-muted hover:text-paper hover:border-muted flex items-center justify-center transition-colors cursor-pointer"
              title="Configurar presupuestos semanales"
            >
              <span className="material-symbols-outlined text-base">tune</span>
            </button>
          )}
        </div>
      </div>

      <div className="border border-hairline rounded-xl p-4 space-y-2 bg-surface">
        <div className="flex items-start justify-between gap-3">
          <div>
            <SectionLabel>Semana actual</SectionLabel>
            <p className="text-sm font-medium text-paper mt-1">
              Semana {currentWeekRange.week} · {currentWeekRange.label}
            </p>
          </div>
          <span className="material-symbols-outlined text-sage text-xl">today</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          <span className="rounded-lg bg-surface-raised px-2.5 py-1">
            {daysLeftInWeek === 0
              ? "Esta semana termina hoy"
              : `Te quedan ${daysLeftInWeek} ${daysLeftInWeek === 1 ? "día" : "días"} de esta semana`}
          </span>
          <span className="rounded-lg bg-surface-raised px-2.5 py-1">
            {daysLeftInCycle === 0
              ? "Tu ciclo termina hoy"
              : `Tu ciclo termina en ${daysLeftInCycle} ${daysLeftInCycle === 1 ? "día" : "días"}`}
          </span>
        </div>
      </div>

      <ActiveWeekSelector
        activeWeek={activeWeek}
        onActiveWeekChange={handleActiveWeekChange}
        weekRanges={weekRanges}
      />

      {/* Weekly summary cards swipeable / grid layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((wk) => {
          const spent = calculateWeekSpent(wk);
          const limit = weekBudgets[wk];
          const isSelected = selectedWeek === wk;
          const hasSpent = spent > 0;
          const weekRange = weekRanges.find((range) => range.week === wk);
          const isCompleted = weekRange?.status === "completed";

          const ratio = limit > 0
            ? Math.min(100, Math.round((spent / limit) * 100))
            : 0;

          return (
            <div
              key={wk}
              onClick={() => setSelectedWeek(wk)}
              className={`rounded-xl p-4 cursor-pointer transition-all border ${
                isSelected
                  ? "bg-surface-raised border-sage"
                  : isCompleted
                    ? "bg-surface border-hairline opacity-80 hover:opacity-100"
                    : "bg-surface border-hairline hover:border-muted"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`font-mono text-xs font-medium block ${isSelected ? "text-sage" : "text-muted"}`}>
                    Semana {wk}
                  </span>
                  {weekRange && (
                    <span className="font-mono text-[9px] text-muted/70 block mt-0.5">
                      {weekRange.label}
                    </span>
                  )}
                </div>
                <span
                  className="material-symbols-outlined text-sage text-lg select-none"
                  style={{ fontVariationSettings: `'FILL' ${isSelected || isCompleted ? 1 : 0}` }}
                >
                  {isCompleted ? "check_circle" : hasSpent ? "check_circle" : isSelected ? "schedule" : "calendar_today"}
                </span>
              </div>

              <div className="mb-3">
                <SectionLabel>Gastado</SectionLabel>
                <Money
                  amount={spent}
                  className={`text-lg font-medium block mt-0.5 ${hasSpent ? "" : "text-muted/50"}`}
                />
              </div>

              <div className="h-1 rounded-full bg-surface-raised overflow-hidden mb-1">
                <div
                  className="h-full bg-sage transition-all duration-700"
                  style={{ width: `${ratio}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-muted">
                <span>Presupuesto</span>
                <Money amount={limit} className="text-[10px]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Transactions Section */}
      <section className="space-y-4">
        <h3 className="font-serif text-lg text-paper">
          Transacciones Semana {selectedWeek}
        </h3>

        {weekExpenses.length === 0 ? (
          <div className="border border-hairline rounded-xl p-8 text-center text-muted">
            <span className="material-symbols-outlined text-4xl mb-2 text-muted/50">receipt_long</span>
            <p className="text-sm">No hay transacciones registradas</p>
            <p className="text-xs text-muted/60 mt-1">Registra gastos para esta semana.</p>
          </div>
        ) : (
          <div>
            {weekExpenses.map((expense) => {
              const isIngreso = getTransactionType(expense) === "ingreso";
              const config = isIngreso
                ? { icon: "savings", color: undefined as string | undefined }
                : CATEGORIES_CONFIG.find((c) => c.name === expense.category) || CATEGORIES_CONFIG[CATEGORIES_CONFIG.length - 1];

              return (
                <Row
                  key={expense.id}
                  onClick={() => setSelectedTransaction(expense)}
                  className="group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                      {!isIngreso && config.color && (
                        <div
                          className="absolute top-0 right-0 w-2 h-2 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                      )}
                      <span className={`material-symbols-outlined text-lg ${isIngreso ? "text-sage" : "text-muted"}`}>
                        {config.icon}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-paper truncate">
                        {expense.name}
                      </p>
                      <p className="font-mono text-xs text-muted truncate">
                        {formatDate(expense.date)} • {isIngreso ? "Ingreso" : expense.category}
                      </p>
                      {expense.description && (() => {
                        const descriptionLimit = 45;
                        const isLongDescription = expense.description.length > descriptionLimit;
                        const isExpanded = expandedDescriptionId === expense.id;

                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isLongDescription) return;
                              setExpandedDescriptionId(isExpanded ? null : expense.id);
                            }}
                            className={`mt-0.5 text-left w-full ${
                              isLongDescription ? "cursor-pointer group/desc" : "cursor-default"
                            }`}
                            title={isLongDescription && !isExpanded ? "Ver descripción completa" : undefined}
                          >
                            <p
                              className={`text-[11px] text-muted/60 italic ${
                                isLongDescription && !isExpanded
                                  ? "truncate max-w-[200px] sm:max-w-xs group-hover/desc:text-paper/80"
                                  : "whitespace-pre-wrap break-words text-paper/80"
                              }`}
                            >
                              "{isLongDescription && !isExpanded
                                ? `${expense.description.slice(0, descriptionLimit)}...`
                                : expense.description}"
                            </p>
                            {isLongDescription && !isExpanded && (
                              <span className="text-[10px] text-sage font-medium group-hover/desc:underline">
                                ··· ver más
                              </span>
                            )}
                            {isLongDescription && isExpanded && (
                              <span className="text-[10px] text-muted group-hover/desc:text-paper">
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
                      <Money
                        amount={isIngreso ? expense.amount : -expense.amount}
                        showSign
                        variant={isIngreso ? "positive" : "default"}
                        className="text-sm font-medium"
                      />
                      <p className={`font-mono text-[10px] ${
                        expense.status === "Rechazado" ? "text-clay" : "text-muted"
                      }`}>
                        {expense.status === "Rechazado" ? "Rechazado" : "Completado"}
                      </p>
                    </div>

                    {onDeleteExpense && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const result = onDeleteExpense(expense.id);
                          if (result.ok === false) {
                            setDeleteError(result.error);
                            setTimeout(() => setDeleteError(null), 3000);
                          }
                        }}
                        className="material-symbols-outlined text-clay hover:text-clay/80 p-1 rounded-full hover:bg-clay-surface cursor-pointer text-base"
                      >
                        delete
                      </button>
                    )}
                  </div>
                </Row>
              );
            })}
          </div>
        )}
      </section>

      {weekExpenses.length > 0 && (
      <div className="border border-hairline rounded-xl p-5 flex items-center gap-5 bg-surface">
        <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center text-sage shrink-0">
          <span className="material-symbols-outlined text-2xl">summarize</span>
        </div>
        <div className="space-y-1.5 min-w-0">
          <h4 className="text-sm font-medium text-paper">
            Resumen Semana {selectedWeek}
          </h4>
          <p className="text-xs text-muted leading-relaxed">
            Total gastado:{" "}
            <Money amount={weekSpent} className="text-xs font-medium" />
            {" "}en {weekExpenses.length} {weekExpenses.length === 1 ? "transacción" : "transacciones"}.
          </p>
          <p className="text-xs text-muted leading-relaxed">
            {weekBudget > 0 ? (
              budgetRemaining >= 0 ? (
                <>
                  Te quedan{" "}
                  <Money amount={budgetRemaining} variant="positive" className="text-xs font-medium" />
                  {" "}del presupuesto semanal ({budgetPercentUsed}% usado).
                </>
              ) : (
                <>
                  Has superado el presupuesto semanal en{" "}
                  <Money amount={Math.abs(budgetRemaining)} className="text-xs font-medium text-clay" />
                  .
                </>
              )
            ) : (
              "Sin presupuesto semanal configurado."
            )}
          </p>
          {topCategoryName && (
            <p className="text-xs text-muted leading-relaxed flex items-center gap-1.5 flex-wrap">
              <span>Mayor gasto:</span>
              {topCategoryConfig?.color && (
                <span
                  className="w-2 h-2 rounded-full shrink-0 inline-block"
                  style={{ backgroundColor: topCategoryConfig.color }}
                />
              )}
              <span className="font-medium text-paper">{topCategoryName}</span>
              <span>
                (<Money amount={topCategoryAmount} className="text-xs" />).
              </span>
            </p>
          )}
        </div>
      </div>
      )}

      {isEditingCycle && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-ink/80">
          <div className="w-full max-w-sm bg-surface border border-hairline rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-paper flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sage">event</span>
                Inicio del ciclo
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingCycle(false)}
                className="text-muted hover:text-paper cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Define el día en que empieza tu ciclo financiero. Las semanas y el export se calcularán desde esa fecha.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateFinanceCycleConfig({
                  monthStartDay: clampMonthStartDay(parseInt(editCycleStartDay, 10)),
                });
                setIsEditingCycle(false);
              }}
              className="space-y-5"
            >
              <Field label="Día de inicio del ciclo">
                <SelectInput
                  value={editCycleStartDay}
                  onChange={(e) => setEditCycleStartDay(e.target.value)}
                >
                  {Array.from({ length: 28 }, (_, index) => {
                    const day = index + 1;
                    return (
                      <option key={day} value={day}>
                        Día {day}
                      </option>
                    );
                  })}
                </SelectInput>
              </Field>

              <div className="flex flex-col gap-2">
                <Button type="submit" fullWidth>
                  Guardar ciclo
                </Button>
                <Button type="button" variant="ghost" fullWidth onClick={() => setIsEditingCycle(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditingBudgets && onUpdateWeekBudgets && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-ink/80">
          <div className="w-full max-w-sm bg-surface border border-hairline rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-paper flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sage">calendar_view_week</span>
                Presupuestos Semanales
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingBudgets(false)}
                className="text-muted hover:text-paper cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Define cuánto planeas gastar en cada semana del mes.
            </p>

            {monthlyBudget > 0 && (
              <button
                type="button"
                onClick={splitMonthlyBudgetEvenly}
                className="w-full text-left text-xs text-sage hover:text-sage/80 transition-colors cursor-pointer"
              >
                Repartir presupuesto mensual (
                <Money amount={monthlyBudget} className="text-xs" />
                ) en 4 semanas
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
                <div key={week}>
                  <Field label={`Semana ${week}`}>
                    <TextInput
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={editWeekBudgets[week]}
                      onChange={(e) =>
                        setEditWeekBudgets((prev) => ({ ...prev, [week]: e.target.value }))
                      }
                    />
                  </Field>
                </div>
              ))}

              <div className="flex flex-col gap-2 pt-1">
                <Button type="submit" fullWidth>
                  Guardar presupuestos
                </Button>
                <Button type="button" variant="ghost" fullWidth onClick={() => setIsEditingBudgets(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-surface border border-clay text-paper px-5 py-3 rounded-xl text-sm max-w-xs text-center">
          {deleteError}
        </div>
      )}

      {selectedTransaction && onUpdateExpense && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onSave={(updated) => {
            const result = onUpdateExpense(updated);
            if (result.ok) {
              setSelectedTransaction(null);
            }
            return result;
          }}
          onDelete={onDeleteExpense}
        />
      )}
    </div>
  );
}
