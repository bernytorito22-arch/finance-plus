import { useState } from "react";
import { Expense, MonthlyBudget, PaymentMethod, WalletSplit, Wallets } from "../types";
import { CATEGORIES_CONFIG } from "../mockData";
import { isValidSplit, getTransactionType } from "../utils/wallet";
import Money from "./ui/Money";
import SectionLabel from "./ui/SectionLabel";
import Button from "./ui/Button";
import { Field, TextInput } from "./ui/Field";

interface MonthlyDashboardProps {
  expenses: Expense[];
  budget: MonthlyBudget;
  wallets: Wallets;
  walletSplit: WalletSplit;
  onUpdateBudgetConfig?: (payload: { budget: MonthlyBudget; walletSplit: WalletSplit }) => void;
  onUpdateWallets?: (wallets: Wallets) => void;
}

export default function MonthlyDashboard({
  expenses,
  budget,
  wallets,
  walletSplit,
  onUpdateBudgetConfig,
  onUpdateWallets,
}: MonthlyDashboardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTotalBudget, setEditTotalBudget] = useState("");
  const [editIncome, setEditIncome] = useState("");
  const [editSplitTarjeta, setEditSplitTarjeta] = useState("");
  const [editSplitEfectivo, setEditSplitEfectivo] = useState("");
  const [splitError, setSplitError] = useState("");
  const [editingWallet, setEditingWallet] = useState<PaymentMethod | null>(null);
  const [editWalletAmount, setEditWalletAmount] = useState("");

  const expenseOnly = expenses.filter((e) => getTransactionType(e) === "gasto");
  const totalIncome = budget.income;
  const totalExpenses = expenseOnly.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBudget = budget.totalBudget - totalExpenses;
  const budgetPercentage =
    budget.totalBudget > 0
      ? Math.min(100, Math.round((totalExpenses / budget.totalBudget) * 100))
      : 0;

  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    if (getTransactionType(e) !== "gasto") return;
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const categoriesWithPercentage = CATEGORIES_CONFIG.map((cat) => {
    const total = categoryTotals[cat.name] || 0;
    const percentage = totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0;
    return { ...cat, total, percentage };
  }).filter((c) => c.total > 0);

  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;
  const donutArcs = categoriesWithPercentage.map((cat) => {
    const pct = (cat.total / totalExpenses) * 100;
    const strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += pct;
    return { ...cat, strokeDasharray, strokeDashoffset };
  });

  const splitTotal = walletSplit.tarjeta + walletSplit.efectivo;
  const tarjetaPct = splitTotal > 0 ? Math.round((walletSplit.tarjeta / splitTotal) * 100) : 50;
  const efectivoPct = splitTotal > 0 ? 100 - tarjetaPct : 50;

  const openBudgetEditor = () => {
    setEditTotalBudget(budget.totalBudget.toString());
    setEditIncome(budget.income.toString());
    setEditSplitTarjeta(wallets.tarjeta.toString());
    setEditSplitEfectivo(wallets.efectivo.toString());
    setSplitError("");
    setIsEditing(true);
  };

  return (
    <div className="space-y-8 pb-4">
      <section className="space-y-3 pt-2">
        <SectionLabel>Presupuesto del ciclo</SectionLabel>
        <div className="flex items-end justify-between gap-3">
          <Money amount={remainingBudget} variant="hero" className="text-4xl sm:text-5xl font-semibold" />
          {onUpdateBudgetConfig && (
            <button
              type="button"
              onClick={openBudgetEditor}
              className="shrink-0 w-9 h-9 rounded-full border border-hairline text-muted hover:text-paper hover:border-muted flex items-center justify-center transition-colors cursor-pointer"
              title="Ajustar presupuesto e ingresos"
            >
              <span className="material-symbols-outlined text-lg">tune</span>
            </button>
          )}
        </div>
        <div className="h-1 rounded-full bg-surface-raised overflow-hidden">
          <div
            className="h-full bg-sage transition-all duration-700"
            style={{ width: `${budgetPercentage}%` }}
          />
        </div>
        <p className="text-sm text-muted">
          Gastado <Money amount={totalExpenses} className="text-sm" /> de{" "}
          <Money amount={budget.totalBudget} className="text-sm" />
        </p>
      </section>

      <section className="grid grid-cols-2 gap-0 border-y border-hairline py-4">
        <div className="pr-4 border-r border-hairline space-y-1">
          <SectionLabel>Ingreso</SectionLabel>
          <Money amount={totalIncome} className="text-lg font-medium" />
        </div>
        <div className="pl-4 space-y-1">
          <SectionLabel>Gastado</SectionLabel>
          <Money amount={totalExpenses} className="text-lg font-medium" />
        </div>
      </section>

      <section className="border-y border-hairline divide-y divide-hairline">
        <button
          type="button"
          onClick={() => {
            setEditingWallet("tarjeta");
            setEditWalletAmount(wallets.tarjeta.toString());
          }}
          className="flex items-center justify-between w-full py-4 text-left hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-muted text-lg">credit_card</span>
            <span className="text-sm text-muted">Tarjeta</span>
          </div>
          <div className="flex items-center gap-2">
            <Money amount={wallets.tarjeta} className="text-base" />
            {onUpdateWallets && (
              <span className="material-symbols-outlined text-sm text-muted">edit</span>
            )}
          </div>
        </button>
        <button
          type="button"
          onClick={() => {
            setEditingWallet("efectivo");
            setEditWalletAmount(wallets.efectivo.toString());
          }}
          className="flex items-center justify-between w-full py-4 text-left hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-muted text-lg">payments</span>
            <span className="text-sm text-muted">Efectivo</span>
          </div>
          <div className="flex items-center gap-2">
            <Money amount={wallets.efectivo} className="text-base" />
            {onUpdateWallets && (
              <span className="material-symbols-outlined text-sm text-muted">edit</span>
            )}
          </div>
        </button>
      </section>

      <section className="space-y-5">
        <h3 className="font-serif text-lg text-paper">Por categoría</h3>
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-8">
          <div className="relative w-[160px] h-[160px] shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#262118" strokeWidth="10" />
              {totalExpenses === 0 ? (
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#322c22" strokeWidth="10" />
              ) : (
                donutArcs.map((arc) => (
                  <circle
                    key={arc.name}
                    className="transition-all duration-1000"
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke={arc.color}
                    strokeWidth="10"
                    strokeDasharray={arc.strokeDasharray}
                    strokeDashoffset={arc.strokeDashoffset}
                    strokeLinecap="round"
                  />
                ))
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-wider text-muted">Usado</span>
              <span className="font-mono tabular-nums text-xl text-paper">{budgetPercentage}%</span>
            </div>
          </div>
          <div className="flex-1 w-full space-y-3">
            {categoriesWithPercentage.length === 0 ? (
              <p className="text-sm text-muted">Sin gastos registrados aún</p>
            ) : (
              categoriesWithPercentage.map((cat) => (
                <div key={cat.name} className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-paper flex-1 truncate">{cat.name}</span>
                  <span className="font-mono tabular-nums text-xs text-muted shrink-0">
                    {cat.percentage}%
                  </span>
                  <Money amount={cat.total} className="text-sm shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-ink/80">
          <div className="w-full max-w-sm bg-surface border border-hairline rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-paper">Ajustar presupuesto</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-muted hover:text-paper cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const numBudget = parseFloat(editTotalBudget);
                const numIncome = parseFloat(editIncome);
                const numTarjeta = parseFloat(editSplitTarjeta);
                const numEfectivo = parseFloat(editSplitEfectivo);
                if (
                  isNaN(numBudget) ||
                  isNaN(numIncome) ||
                  isNaN(numTarjeta) ||
                  isNaN(numEfectivo) ||
                  !onUpdateBudgetConfig
                ) {
                  return;
                }
                const nextSplit = { tarjeta: numTarjeta, efectivo: numEfectivo };
                if (!isValidSplit(nextSplit)) {
                  setSplitError("Tarjeta y efectivo deben ser 0 o más.");
                  return;
                }
                onUpdateBudgetConfig({
                  budget: { totalBudget: numBudget, income: numIncome },
                  walletSplit: nextSplit,
                });
                setSplitError("");
                setIsEditing(false);
              }}
              className="space-y-5"
            >
              <Field label="Presupuesto del ciclo">
                <TextInput
                  type="number"
                  step="0.01"
                  required
                  value={editTotalBudget}
                  onChange={(e) => setEditTotalBudget(e.target.value)}
                />
              </Field>
              <Field label="Ingreso mensual">
                <TextInput
                  type="number"
                  step="0.01"
                  required
                  value={editIncome}
                  onChange={(e) => setEditIncome(e.target.value)}
                />
              </Field>

              <div className="space-y-3">
                <SectionLabel>Distribución entre wallets</SectionLabel>
                <div className="flex h-2 rounded-full overflow-hidden bg-surface-raised">
                  <div className="bg-sage transition-all" style={{ width: `${tarjetaPct}%` }} />
                  <div
                    className="bg-cat-transporte transition-all"
                    style={{ width: `${efectivoPct}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tarjeta">
                    <TextInput
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={editSplitTarjeta}
                      onChange={(e) => setEditSplitTarjeta(e.target.value)}
                    />
                  </Field>
                  <Field label="Efectivo">
                    <TextInput
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={editSplitEfectivo}
                      onChange={(e) => setEditSplitEfectivo(e.target.value)}
                    />
                  </Field>
                </div>
              </div>

              {splitError && <p className="text-xs text-clay">{splitError}</p>}

              <div className="flex flex-col gap-2 pt-1">
                <Button type="submit" fullWidth>
                  Guardar cambios
                </Button>
                <Button type="button" variant="ghost" fullWidth onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingWallet && onUpdateWallets && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-ink/80">
          <div className="w-full max-w-sm bg-surface border border-hairline rounded-2xl p-6 space-y-5">
            <h3 className="font-serif text-lg text-paper">
              Ajustar saldo — {editingWallet === "tarjeta" ? "Tarjeta" : "Efectivo"}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amount = parseFloat(editWalletAmount);
                if (isNaN(amount) || amount < 0) return;
                onUpdateWallets({ ...wallets, [editingWallet]: amount });
                setEditingWallet(null);
              }}
              className="space-y-4"
            >
              <Field label="Saldo">
                <TextInput
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={editWalletAmount}
                  onChange={(e) => setEditWalletAmount(e.target.value)}
                />
              </Field>
              <div className="flex flex-col gap-2">
                <Button type="submit" fullWidth>
                  Guardar
                </Button>
                <Button type="button" variant="ghost" fullWidth onClick={() => setEditingWallet(null)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
