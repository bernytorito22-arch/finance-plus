import { useState, useEffect } from "react";
import Header from "./components/Header";
import MonthlyDashboard from "./components/MonthlyDashboard";
import WeeklyTracking from "./components/WeeklyTracking";
import AddExpense from "./components/AddExpense";
import AnalysisDetailed from "./components/AnalysisDetailed";
import { INITIAL_EXPENSES, INITIAL_BUDGET, INITIAL_GOALS } from "./mockData";
import { Expense, Goal, MonthlyBudget } from "./types";

type ActiveTab = "monthly" | "weekly" | "add" | "analysis";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const saved = localStorage.getItem("finanzapro_active_tab");
      return (saved as ActiveTab) || "add";
    } catch {
      return "add";
    }
  });

  useEffect(() => {
    localStorage.setItem("finanzapro_active_tab", activeTab);
  }, [activeTab]);

  // Load state from localStorage on init, fallback to default mock data
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem("finanzapro_expenses");
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [budget, setBudget] = useState<MonthlyBudget>(() => {
    try {
      const saved = localStorage.getItem("finanzapro_budget");
      return saved ? JSON.parse(saved) : INITIAL_BUDGET;
    } catch {
      return INITIAL_BUDGET;
    }
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem("finanzapro_goals");
      return saved ? JSON.parse(saved) : INITIAL_GOALS;
    } catch {
      return INITIAL_GOALS;
    }
  });

  const [aiRecommendation, setAiRecommendation] = useState<string>("");
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("finanzapro_expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem("finanzapro_budget", JSON.stringify(budget));
  }, [budget]);

  useEffect(() => {
    localStorage.setItem("finanzapro_goals", JSON.stringify(goals));
  }, [goals]);

  // Request real-time financial tips from server proxying Gemini model!
  const handleRefreshAi = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expenses: expenses,
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

  // Add standard new transaction
  const handleSaveExpense = (newExpense: Omit<Expense, "id" | "date" | "status"> & { date?: string; status?: "Completado" | "Rechazado" }) => {
    const expenseWithId: Expense = {
      ...newExpense,
      id: `exp_${Date.now()}`,
      date: newExpense.date || new Date().toISOString(),
      status: newExpense.status || "Completado"
    };

    setExpenses((prev) => [expenseWithId, ...prev]);

    // Also update dynamic goals if some expense category is housing/rent, let's simulate
    if (newExpense.category === "Vivienda") {
      setGoals((prev) =>
        prev.map((g) => {
          if (g.name === "Fondo Casa") {
            // Add progress
            const updatedCurrent = Math.min(g.target, g.current + newExpense.amount * 0.1);
            return { ...g, current: Math.round(updatedCurrent) };
          }
          return g;
        })
      );
    }

    // Move search to tracking to let them see results immediately
    setTimeout(() => {
      setActiveTab("weekly");
    }, 1200);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd]">
      {/* Top Main Navigation Shell */}
      <Header appName="Finance+" />

      {/* Main Single screen visual viewport content */}
      <main className="pt-24 pb-32 px-4 max-w-lg mx-auto min-h-screen">
        {activeTab === "monthly" && (
          <MonthlyDashboard 
            expenses={expenses} 
            budget={budget} 
            goals={goals} 
            onUpdateBudget={setBudget}
          />
        )}

        {activeTab === "weekly" && (
          <WeeklyTracking 
            expenses={expenses} 
            onDeleteExpense={handleDeleteExpense} 
          />
        )}

        {activeTab === "add" && (
          <AddExpense 
            onSaveExpense={handleSaveExpense} 
          />
        )}

        {activeTab === "analysis" && (
          <AnalysisDetailed 
            expenses={expenses} 
            aiRecommendation={aiRecommendation}
            onRefreshAi={handleRefreshAi}
            isLoadingAi={isLoadingAi}
          />
        )}
      </main>

      {/* Bottom Navigation Shell (Predictive mapping with exact match for high visual polish) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 rounded-t-2xl bg-[#171f33]/90 backdrop-blur-2xl border-t border-white/5 shadow-[0_-4px_20px_rgba(78,222,163,0.15)] flex justify-around items-center px-4 pb-6 pt-2.5">
        {/* Monthly Tab */}
        <button
          onClick={() => setActiveTab("monthly")}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === "monthly"
              ? "bg-[#10b981]/20 text-[#4edea3] rounded-xl px-4 py-1.5 active:scale-95 duration-200"
              : "text-[#bbcabf] hover:text-[#4edea3]/80 active:scale-90 duration-200"
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${activeTab === 'monthly' ? 1 : 0}` }}>
            dashboard
          </span>
          <span className="font-mono text-[10px] tracking-wide mt-0.5">Monthly</span>
        </button>

        {/* Weekly Tab */}
        <button
          onClick={() => setActiveTab("weekly")}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === "weekly"
              ? "bg-[#10b981]/20 text-[#4edea3] rounded-xl px-4 py-1.5 active:scale-95 duration-200"
              : "text-[#bbcabf] hover:text-[#4edea3]/80 active:scale-90 duration-200"
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${activeTab === 'weekly' ? 1 : 0}` }}>
            calendar_view_week
          </span>
          <span className="font-mono text-[10px] tracking-wide mt-0.5">Weekly</span>
        </button>

        {/* Floating Centered Add Button */}
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

        {/* Analysis Tab */}
        <button
          onClick={() => setActiveTab("analysis")}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === "analysis"
              ? "bg-[#10b981]/20 text-[#4edea3] rounded-xl px-4 py-1.5 active:scale-95 duration-200"
              : "text-[#bbcabf] hover:text-[#4edea3]/80 active:scale-90 duration-200"
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${activeTab === 'analysis' ? 1 : 0}` }}>
            analytics
          </span>
          <span className="font-mono text-[10px] tracking-wide mt-0.5">Analysis</span>
        </button>
      </nav>
    </div>
  );
}
