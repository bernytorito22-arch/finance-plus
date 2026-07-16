import { useState, useEffect } from "react";
import Header from "./components/Header";
import MonthlyDashboard from "./components/MonthlyDashboard";
import WeeklyTracking from "./components/WeeklyTracking";
import AddExpense from "./components/AddExpense";
import AnalysisDetailed from "./components/AnalysisDetailed";
import { Expense, FinanceCycleConfig, MonthlyBudget, MutationResult, WalletSplit, Wallets, WeeklyBudgets } from "./types";
import { getFinanceCycleRange, getSuggestedWeekOfMonth, WeekNumber } from "./utils/week";
import { removeExpensesInCycle } from "./utils/resetCycleData";
import {
  applyEdit,
  applyTransaction,
  initWalletsFromSplit,
  revertTransaction,
} from "./utils/wallet";
import {
  createSnapshot,
  DataMode,
  getDemoSnapshot,
  initializeAppData,
  loadUserSnapshot,
  persistDataMode,
  persistUserSnapshot,
} from "./utils/storage";

type ActiveTab = "monthly" | "weekly" | "add" | "analysis";

const initialAppData = initializeAppData();

function walletsAreEmpty(wallets: Wallets): boolean {
  return wallets.tarjeta === 0 && wallets.efectivo === 0;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const saved = localStorage.getItem("finanzapro_active_tab");
      return (saved as ActiveTab) || "monthly";
    } catch {
      return "monthly";
    }
  });

  const [dataMode, setDataMode] = useState<DataMode>(initialAppData.mode);
  const [expenses, setExpenses] = useState<Expense[]>(initialAppData.snapshot.expenses);
  const [budget, setBudget] = useState<MonthlyBudget>(initialAppData.snapshot.budget);
  const [weekBudgets, setWeekBudgets] = useState<WeeklyBudgets>(initialAppData.snapshot.weekBudgets);
  const [activeWeek, setActiveWeek] = useState<WeekNumber>(initialAppData.snapshot.activeWeek);
  const [financeCycleConfig, setFinanceCycleConfig] = useState<FinanceCycleConfig>(
    initialAppData.snapshot.financeCycleConfig
  );
  const [wallets, setWallets] = useState<Wallets>(initialAppData.snapshot.wallets);
  const [walletSplit, setWalletSplit] = useState<WalletSplit>(initialAppData.snapshot.walletSplit);

  const [aiRecommendation, setAiRecommendation] = useState<string>("");
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);

  const isDemoMode = dataMode === "demo";

  useEffect(() => {
    localStorage.setItem("finanzapro_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    persistDataMode(dataMode);
  }, [dataMode]);

  useEffect(() => {
    if (dataMode !== "personal") return;

    persistUserSnapshot(
      createSnapshot(
        expenses,
        budget,
        weekBudgets,
        activeWeek,
        financeCycleConfig,
        wallets,
        walletSplit
      )
    );
  }, [expenses, budget, weekBudgets, activeWeek, financeCycleConfig, wallets, walletSplit, dataMode]);

  const applySnapshot = (snapshot: ReturnType<typeof getDemoSnapshot>) => {
    setExpenses(snapshot.expenses);
    setBudget(snapshot.budget);
    setWeekBudgets(snapshot.weekBudgets);
    setActiveWeek(snapshot.activeWeek);
    setFinanceCycleConfig(snapshot.financeCycleConfig);
    setWallets(snapshot.wallets);
    setWalletSplit(snapshot.walletSplit);
    setAiRecommendation("");
  };

  const handleToggleDataMode = () => {
    if (dataMode === "demo") {
      setDataMode("personal");
      applySnapshot(loadUserSnapshot());
      return;
    }

    persistUserSnapshot(
      createSnapshot(
        expenses,
        budget,
        weekBudgets,
        activeWeek,
        financeCycleConfig,
        wallets,
        walletSplit
      )
    );
    setDataMode("demo");
    applySnapshot(getDemoSnapshot());
  };

  const handleRefreshAi = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expenses,
          budget: budget.totalBudget,
          income: budget.income,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.insight) {
          setAiRecommendation(data.insight);
        } else {
          setAiRecommendation("Sigue ingresando tus gastos para optimizar tus presupuestos semanales de manera inteligente.");
        }
      } else {
        setAiRecommendation("Sigue ingresando tus gastos para optimizar tus presupuestos semanales de manera inteligente.");
      }
    } catch (err) {
      console.error("Failed to query API analyze endpoint:", err);
      setAiRecommendation("Sigue ingresando tus gastos para optimizar tus presupuestos semanales de manera inteligente.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSaveExpense = (
    newExpense: Omit<Expense, "id" | "date" | "status"> & {
      date?: string;
      status?: "Completado" | "Rechazado";
    }
  ): MutationResult => {
    const expenseWithId: Expense = {
      ...newExpense,
      type: newExpense.type ?? "gasto",
      id: `exp_${Date.now()}`,
      date: newExpense.date || new Date().toISOString(),
      status: newExpense.status || "Completado",
    };

    const nextWallets = applyTransaction(wallets, expenseWithId);
    if (!nextWallets) {
      const method = expenseWithId.paymentMethod ?? "efectivo";
      return {
        ok: false,
        error: `No tienes suficiente saldo en ${method}.`,
      };
    }

    setWallets(nextWallets);
    setExpenses((prev) => [expenseWithId, ...prev]);

    setTimeout(() => {
      setActiveTab("weekly");
    }, 1200);

    return { ok: true };
  };

  const handleDeleteExpense = (id: string): MutationResult => {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) {
      return { ok: false, error: "No se encontró la transacción." };
    }

    const nextWallets = revertTransaction(wallets, expense);
    if (!nextWallets) {
      return {
        ok: false,
        error: "No se puede eliminar: el saldo quedaría negativo. Ajusta el saldo manualmente primero.",
      };
    }

    setWallets(nextWallets);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    return { ok: true };
  };

  const handleUpdateBudgetConfig = (payload: {
    budget: MonthlyBudget;
    walletSplit: WalletSplit;
  }) => {
    setBudget(payload.budget);
    setWalletSplit(payload.walletSplit);

    if (walletsAreEmpty(wallets)) {
      setWallets(initWalletsFromSplit(payload.walletSplit));
    }
  };

  const handleUpdateWallets = (nextWallets: Wallets) => {
    setWallets(nextWallets);
  };

  const handleUpdateExpense = (updated: Expense): MutationResult => {
    const original = expenses.find((e) => e.id === updated.id);
    if (!original) {
      return { ok: false, error: "No se encontró la transacción." };
    }

    const nextWallets = applyEdit(wallets, original, updated);
    if (!nextWallets) {
      return {
        ok: false,
        error: "No hay saldo suficiente para guardar estos cambios.",
      };
    }

    setWallets(nextWallets);
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    return { ok: true };
  };

  const handleResetCycleExpenses = () => {
    if (dataMode !== "personal") return;

    const cycleRange = getFinanceCycleRange(new Date(), financeCycleConfig.monthStartDay);
    setExpenses((prev) => removeExpensesInCycle(prev, cycleRange));
    setWallets(initWalletsFromSplit(walletSplit));
    setActiveWeek(getSuggestedWeekOfMonth(new Date(), financeCycleConfig.monthStartDay));
    setAiRecommendation("");
  };

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd]">
      <Header
        appName="Finance+"
        isDemoMode={isDemoMode}
        onToggleDataMode={handleToggleDataMode}
      />

      {isDemoMode && (
        <div className="app-demo-banner fixed left-0 w-full z-40 px-4">
          <div className="max-w-lg mx-auto bg-[#4edea3]/10 border border-[#4edea3]/25 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-base">science</span>
            <p className="font-sans text-xs text-[#dae2fd]">
              Estás viendo <span className="font-bold text-[#4edea3]">datos de ejemplo</span>. Cambia a tus datos para empezar en blanco.
            </p>
          </div>
        </div>
      )}

      <main className={`px-4 max-w-lg mx-auto min-h-screen ${isDemoMode ? "app-main-with-banner" : "app-main"}`}>
        {activeTab === "monthly" && (
          <MonthlyDashboard
            expenses={expenses}
            budget={budget}
            wallets={wallets}
            walletSplit={walletSplit}
            onUpdateBudgetConfig={handleUpdateBudgetConfig}
            onUpdateWallets={handleUpdateWallets}
          />
        )}

        {activeTab === "weekly" && (
          <WeeklyTracking
            expenses={expenses}
            weekBudgets={weekBudgets}
            activeWeek={activeWeek}
            onActiveWeekChange={setActiveWeek}
            onUpdateWeekBudgets={setWeekBudgets}
            monthlyBudget={budget.totalBudget}
            onDeleteExpense={handleDeleteExpense}
            onUpdateExpense={handleUpdateExpense}
            financeCycleConfig={financeCycleConfig}
            onUpdateFinanceCycleConfig={setFinanceCycleConfig}
          />
        )}

        {activeTab === "add" && (
          <AddExpense
            onSaveExpense={handleSaveExpense}
            activeWeek={activeWeek}
            wallets={wallets}
          />
        )}

        {activeTab === "analysis" && (
          <AnalysisDetailed
            expenses={expenses}
            budget={budget}
            weekBudgets={weekBudgets}
            activeWeek={activeWeek}
            onActiveWeekChange={setActiveWeek}
            aiRecommendation={aiRecommendation}
            onRefreshAi={handleRefreshAi}
            isLoadingAi={isLoadingAi}
            financeCycleConfig={financeCycleConfig}
            isDemoMode={isDemoMode}
            onResetCycleExpenses={handleResetCycleExpenses}
            wallets={wallets}
            walletSplit={walletSplit}
          />
        )}
      </main>

      <nav className="app-bottom-nav safe-area-bottom fixed bottom-0 left-0 w-full z-50 rounded-t-2xl bg-[#171f33]/90 backdrop-blur-2xl border-t border-white/5 shadow-[0_-4px_20px_rgba(78,222,163,0.15)] flex justify-around items-center px-4 pt-2.5">
        <button
          onClick={() => setActiveTab("monthly")}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === "monthly"
              ? "bg-[#10b981]/20 text-[#4edea3] rounded-xl px-4 py-1.5 active:scale-95 duration-200"
              : "text-[#bbcabf] hover:text-[#4edea3]/80 active:scale-90 duration-200"
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${activeTab === "monthly" ? 1 : 0}` }}>
            dashboard
          </span>
          <span className="font-mono text-[10px] tracking-wide mt-0.5">Monthly</span>
        </button>

        <button
          onClick={() => setActiveTab("weekly")}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === "weekly"
              ? "bg-[#10b981]/20 text-[#4edea3] rounded-xl px-4 py-1.5 active:scale-95 duration-200"
              : "text-[#bbcabf] hover:text-[#4edea3]/80 active:scale-90 duration-200"
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${activeTab === "weekly" ? 1 : 0}` }}>
            calendar_view_week
          </span>
          <span className="font-mono text-[10px] tracking-wide mt-0.5">Weekly</span>
        </button>

        <button
          onClick={() => setActiveTab("add")}
          className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer ${
            activeTab === "add"
              ? "bg-gradient-to-br from-[#4edea3] to-[#10b981] text-[#002113] shadow-[0_0_15px_rgba(78,222,163,0.5)]"
              : "bg-[#171f33] border border-[#3c4a42] text-[#bbcabf] hover:text-white"
          }`}
          style={{ marginTop: "-20px" }}
        >
          <span className="material-symbols-outlined text-2xl font-extrabold select-none">
            add
          </span>
        </button>

        <button
          onClick={() => setActiveTab("analysis")}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === "analysis"
              ? "bg-[#10b981]/20 text-[#4edea3] rounded-xl px-4 py-1.5 active:scale-95 duration-200"
              : "text-[#bbcabf] hover:text-[#4edea3]/80 active:scale-90 duration-200"
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${activeTab === "analysis" ? 1 : 0}` }}>
            analytics
          </span>
          <span className="font-mono text-[10px] tracking-wide mt-0.5">Resumen</span>
        </button>
      </nav>
    </div>
  );
}
