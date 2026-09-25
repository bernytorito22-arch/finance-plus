import { useEffect, useRef, useState } from "react";
import { Expense, FinanceCycleConfig, MonthlyBudget, WalletSplit, Wallets, WeeklyBudgets } from "../types";
import { CATEGORIES_CONFIG } from "../mockData";
import ActiveWeekSelector from "./ActiveWeekSelector";
import { buildMonthlyExportPayload, downloadJsonFile } from "../utils/exportMonthlyData";
import { buildCycleTsv } from "../utils/exportCycleTsv";
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
import Money from "./ui/Money";
import SectionLabel from "./ui/SectionLabel";
import Row from "./ui/Row";
import Button from "./ui/Button";

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

type CopyButton = "sheet" | "rows";
type CopyNotice = { button: CopyButton; status: "copied" | "done" | "empty" | "error"; count: number } | null;

function copyButtonLabel(button: CopyButton, notice: CopyNotice): string {
  if (notice?.button === button && notice.status === "copied") return "Copiado";
  return button === "sheet" ? "Copiar para Sheets" : "Copiar solo filas";
}

function copyNoticeMessage(notice: CopyNotice): string | null {
  if (!notice) return null;
  if (notice.status === "empty") return "Este ciclo no tiene movimientos.";
  if (notice.status === "error") return "No se pudo copiar. Intenta de nuevo.";
  if (notice.status !== "copied" && notice.status !== "done") return null;
  if (notice.button === "sheet") {
    return notice.count === 0
      ? "Copiado: solo la fila de títulos."
      : `Copiado: títulos y ${notice.count} ${notice.count === 1 ? "movimiento" : "movimientos"}.`;
  }
  return `Copiado: ${notice.count} ${notice.count === 1 ? "movimiento" : "movimientos"}, sin títulos.`;
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
  const [summaryNotice, setSummaryNotice] = useState<CopyNotice>(null);
  const [modalNotice, setModalNotice] = useState<CopyNotice>(null);
  const copiedTimeoutRef = useRef<number | null>(null);
  const copyGenerationRef = useRef(0);

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

  const copyCycle = async (includeHeader: boolean, surface: "summary" | "modal") => {
    if (isDemoMode) return;
    const setNotice = surface === "summary" ? setSummaryNotice : setModalNotice;
    const button: CopyButton = includeHeader ? "sheet" : "rows";
    const sheetOptions = {
      cycleLabel: cycleRange.label,
      weekRanges,
      includeHeader,
    };
    const text = buildCycleTsv(cycleExpenses, sheetOptions);
    if (!includeHeader && text === "") {
      setNotice({ button, status: "empty", count: 0 });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      const generation = ++copyGenerationRef.current;
      setNotice({ button, status: "copied", count: cycleExpenses.length });
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = window.setTimeout(() => {
        if (copyGenerationRef.current !== generation) return;
        setNotice((current) =>
          current?.status === "copied" ? { ...current, status: "done" } : current
        );
        copiedTimeoutRef.current = null;
      }, 2000);
    } catch {
      setNotice({ button, status: "error" });
    }
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

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-8 pb-4">
      <section className="flex items-start justify-between gap-3 pt-2">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl text-paper">Resumen</h2>
          <p className="text-sm text-muted">
            Vista rápida del ciclo {cycleRange.label}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Button
            variant="destructive"
            onClick={() => setIsResetModalOpen(true)}
            disabled={isDemoMode}
            className="text-xs py-2 px-3"
            title={isDemoMode ? "Cambia a Mis datos para reiniciar" : "Reiniciar gastos del ciclo actual"}
          >
            <span className="material-symbols-outlined text-sm mr-1.5">restart_alt</span>
            Reiniciar ciclo
          </Button>
        </div>
      </section>

      <section className="space-y-3 -mt-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => copyCycle(true, "summary")}
            disabled={isDemoMode}
            className="text-xs py-2 px-3"
            title={isDemoMode ? "Cambia a Mis datos para copiar" : "Copiar movimientos con títulos para pegar en Sheets"}
          >
            <span className="material-symbols-outlined text-sm mr-1.5">content_paste</span>
            {copyButtonLabel("sheet", summaryNotice)}
          </Button>
          <Button
            variant="outline"
            onClick={() => copyCycle(false, "summary")}
            disabled={isDemoMode}
            className="text-xs py-2 px-3"
            title={isDemoMode ? "Cambia a Mis datos para copiar" : "Copiar solo filas de movimientos"}
          >
            <span className="material-symbols-outlined text-sm mr-1.5">table_rows</span>
            {copyButtonLabel("rows", summaryNotice)}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCycle}
            disabled={isDemoMode}
            className="text-xs py-2 px-3"
            title={isDemoMode ? "Cambia a Mis datos para exportar" : "Exportar ciclo JSON"}
          >
            <span className="material-symbols-outlined text-sm mr-1.5">download</span>
            Exportar JSON
          </Button>
        </div>
        {copyNoticeMessage(summaryNotice) && (
          <p className="text-xs text-muted">{copyNoticeMessage(summaryNotice)}</p>
        )}
        <p className="text-xs text-muted leading-relaxed">
          La primera vez, pega “Copiar para Sheets” en la celda A1. Cada mes siguiente, usa “Copiar solo filas” y
          pégalo en la primera fila vacía. Las columnas no cambian, así que los ciclos se apilan en la misma hoja.
        </p>
      </section>

      {isDemoMode && (
        <p className="text-xs text-muted -mt-4">
          Cambia a Mis datos para exportar o reiniciar tu ciclo real.
        </p>
      )}

      {isResetModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/80"
          onClick={closeResetModal}
        >
          <div
            className="w-full max-w-sm bg-surface border border-hairline rounded-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-paper flex items-center gap-1.5">
                <span className="material-symbols-outlined text-clay">warning</span>
                ¿Reiniciar el ciclo?
              </h3>
              <button
                type="button"
                onClick={closeResetModal}
                className="text-muted hover:text-paper transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 text-sm text-muted leading-relaxed">
              <p>
                Se borrarán los movimientos del ciclo{" "}
                <span className="text-paper font-medium">{cycleRange.label}</span>.
              </p>
              <p>
                Se eliminarán{" "}
                <span className="text-paper font-medium">{cycleExpenses.length}</span>{" "}
                {cycleExpenses.length === 1 ? "movimiento" : "movimientos"}.
              </p>
              <p>El presupuesto y el ingreso se mantienen.</p>
              <p className="text-xs">
                Para guardarlos, copia los movimientos y pégalos en Excel o Google Sheets. También puedes descargar
                el JSON.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => copyCycle(true, "modal")}
                  disabled={isDemoMode}
                  className="text-xs py-2 px-3 flex-1 min-w-[140px]"
                >
                  <span className="material-symbols-outlined text-sm mr-1.5">content_paste</span>
                  {copyButtonLabel("sheet", modalNotice)}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyCycle(false, "modal")}
                  disabled={isDemoMode}
                  className="text-xs py-2 px-3 flex-1 min-w-[140px]"
                >
                  <span className="material-symbols-outlined text-sm mr-1.5">table_rows</span>
                  {copyButtonLabel("rows", modalNotice)}
                </Button>
              </div>
              {copyNoticeMessage(modalNotice) && (
                <p className="text-xs text-muted">{copyNoticeMessage(modalNotice)}</p>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-hairline bg-surface p-3">
              <input
                type="checkbox"
                checked={hasConfirmedExport}
                onChange={(e) => setHasConfirmedExport(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-hairline bg-ink text-sage focus:ring-sage focus:ring-offset-0"
              />
              <span className="text-xs text-paper leading-relaxed">
                Ya copié mis datos a Sheets o Excel, o entiendo que al reiniciar no podré recuperarlos.
              </span>
            </label>

            <div className="flex flex-col gap-2 pt-1">
              <Button variant="ghost" fullWidth onClick={closeResetModal}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                fullWidth
                onClick={handleConfirmReset}
                disabled={!hasConfirmedExport || isDemoMode}
              >
                Reiniciar
              </Button>
            </div>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <SectionLabel>Presupuesto del ciclo</SectionLabel>
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-0.5">
            <Money amount={remainingBudget} variant="hero" className="text-3xl font-semibold" />
            <p className="text-xs text-muted">restantes</p>
          </div>
          {budget.totalBudget > 0 && (
            <div className="text-right">
              <SectionLabel>Usado</SectionLabel>
              <p className="font-mono tabular-nums text-xl text-paper">{budgetPercentage}%</p>
            </div>
          )}
        </div>

        {budget.totalBudget > 0 ? (
          <>
            <div className="h-1 rounded-full bg-surface-raised overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ${
                  budgetPercentage >= 90 ? "bg-clay" : "bg-sage"
                }`}
                style={{ width: `${budgetPercentage}%` }}
              />
            </div>
            <p className="text-sm text-muted">
              Gastado <Money amount={totalExpenses} className="text-sm" /> de{" "}
              <Money amount={budget.totalBudget} className="text-sm" />
            </p>
          </>
        ) : (
          <p className="text-xs text-muted">
            Configura tu presupuesto del ciclo en la pestaña Monthly.
          </p>
        )}

        {hasData && budget.totalBudget > 0 && (
          <div className="rounded-xl border border-hairline bg-surface p-3">
            <SectionLabel>Proyección de fin de ciclo</SectionLabel>
            <p className="text-xs text-muted leading-relaxed mt-1.5">
              {projectedCycleTotal <= budget.totalBudget ? (
                <>
                  Si mantienes este ritmo, terminarás el ciclo con{" "}
                  <Money
                    amount={budget.totalBudget - projectedCycleTotal}
                    variant="positive"
                    className="text-xs font-medium"
                  />{" "}
                  de margen.
                </>
              ) : (
                <>
                  Si mantienes este ritmo, podrías superar tu presupuesto en{" "}
                  <Money
                    amount={projectedCycleTotal - budget.totalBudget}
                    className="text-xs font-medium text-clay"
                  />
                  .
                </>
              )}
            </p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-0 border-y border-hairline py-4">
        <div className="pr-4 border-r border-hairline space-y-1">
          <SectionLabel>Hoy</SectionLabel>
          <Money amount={spentToday} className="text-lg font-medium" />
          <p className="text-[10px] text-muted">gastado hoy</p>
        </div>
        <div className="pl-4 space-y-3">
          <div className="space-y-1">
            <SectionLabel>Semana {activeWeek}</SectionLabel>
            <Money amount={spentThisWeek} className="text-lg font-medium" />
            <p className="text-[10px] text-muted">esta semana</p>
          </div>
          <ActiveWeekSelector
            activeWeek={activeWeek}
            onActiveWeekChange={onActiveWeekChange}
            compact
            weekRanges={weekRanges}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-serif text-lg text-paper">Top categorías del ciclo</h3>
        {topCategories.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">
            Sin gastos registrados aún
          </p>
        ) : (
          <div>
            {topCategories.map((category, index) => (
              <Row key={category.name}>
                <span className="font-mono text-[10px] text-sage font-medium w-4 shrink-0">
                  {index + 1}
                </span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: category.config?.color
                      ? `${category.config.color}22`
                      : undefined,
                  }}
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ color: category.config?.color ?? undefined }}
                  >
                    {category.config?.icon ?? "category"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-paper truncate">{category.name}</p>
                  <p className="text-[10px] text-muted">{category.percentage}%</p>
                </div>
                <Money amount={category.total} className="text-sm shrink-0" />
              </Row>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-1">
        <h3 className="font-serif text-lg text-paper pb-2">Últimas transacciones</h3>
        {recentExpenses.length === 0 ? (
          <div className="py-8 text-center text-muted">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
            <p className="text-sm">No hay transacciones aún</p>
          </div>
        ) : (
          <div>
            {recentExpenses.map((expense) => {
              const config =
                CATEGORIES_CONFIG.find((category) => category.name === expense.category) ??
                CATEGORIES_CONFIG[CATEGORIES_CONFIG.length - 1];

              return (
                <Row key={expense.id}>
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: config.color ? `${config.color}22` : undefined,
                    }}
                  >
                    <span
                      className="material-symbols-outlined text-base"
                      style={{ color: config.color }}
                    >
                      {config.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-paper truncate">{expense.name}</p>
                    <p className="text-[10px] text-muted truncate">
                      {formatDate(expense.date)} · {expense.category}
                    </p>
                  </div>
                  <Money amount={expense.amount} className="text-sm shrink-0" />
                </Row>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-hairline bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-serif text-base text-paper">
            Recomendación Finance+ AI
          </h4>
          <button
            onClick={onRefreshAi}
            disabled={isLoadingAi}
            className="material-symbols-outlined text-sm text-sage hover:text-paper active:opacity-80 transition-colors cursor-pointer select-none disabled:opacity-50"
            title="Generar nueva recomendación"
          >
            refresh
          </button>
        </div>

        {isLoadingAi ? (
          <div className="space-y-2 py-1">
            <div className="h-3 bg-surface-raised rounded animate-pulse w-full" />
            <div className="h-3 bg-surface-raised rounded animate-pulse w-4/5" />
          </div>
        ) : (
          <p className="text-xs text-muted leading-relaxed">
            {aiRecommendation ||
              (hasData
                ? "Haz clic en recargar para obtener tu diagnóstico personalizado."
                : "Registra tus primeros gastos para recibir recomendaciones personalizadas.")}
          </p>
        )}
      </section>
    </div>
  );
}
