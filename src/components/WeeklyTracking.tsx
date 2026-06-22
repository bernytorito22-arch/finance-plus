import { useState } from "react";
import { Expense } from "../types";
import { CATEGORIES_CONFIG } from "../mockData";

interface WeeklyTrackingProps {
  expenses: Expense[];
  onDeleteExpense?: (id: string) => void;
}

export default function WeeklyTracking({ expenses, onDeleteExpense }: WeeklyTrackingProps) {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  // Budgets defined for weeks in standard screens
  const weekBudgets: Record<number, number> = {
    1: 2000.00,
    2: 1109.80,
    3: 1850.00,
    4: 1850.00,
  };

  // Calculate stats per week
  const calculateWeekSpent = (weekNum: number) => {
    return expenses
      .filter((e) => e.week === weekNum)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const weekExpenses = expenses.filter((e) => e.week === selectedWeek);

  // Simple format helper
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
      <div>
        <h2 className="font-sans text-2xl font-bold text-[#dae2fd] mb-1">Seguimiento Semanal</h2>
        <p className="text-[#bbcabf] font-sans text-sm">Resumen de tus gastos de Octubre por semana.</p>
      </div>

      {/* Weekly summary cards swipeable / grid layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((wk) => {
          const spent = calculateWeekSpent(wk);
          const limit = weekBudgets[wk];
          const isSelected = selectedWeek === wk;
          const isPending = wk > 2 && spent === 0;

          // Progress calculation
          const ratio = Math.min(100, isPending ? 0 : Math.round((spent / limit) * 100));

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
                  {wk <= 2 ? "check_circle" : isSelected ? "schedule" : "lock"}
                </span>
              </div>

              <div className="mb-3">
                <div className="font-mono text-[10px] text-[#bbcabf] uppercase tracking-wider mb-0.5">
                  {wk <= 2 ? "Gastado" : "Pendiente"}
                </div>
                <div className={`font-sans text-lg font-extrabold ${isPending ? "text-[#bbcabf]/50" : "text-[#dae2fd]"}`}>
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
                <span>{wk <= 2 ? "Presupuesto" : "Estimado"}</span>
                <span className="text-[#dae2fd]">${limit.toLocaleString("es-ES", { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Transactions Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="font-sans text-lg font-bold text-[#dae2fd]">
            Transacciones Semana {selectedWeek}
          </h3>
          <span className="text-[#4edea3] font-mono text-xs font-bold hover:underline cursor-pointer">
            Ver Todo
          </span>
        </div>

        {/* Locked states for week 3 & 4 if empty */}
        {selectedWeek > 2 && weekExpenses.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-[#bbcabf]">
            <span className="material-symbols-outlined text-4xl mb-2 text-[#bbcabf]/70">lock</span>
            <p className="text-sm">Datos no disponibles aún para la Semana {selectedWeek}</p>
            <p className="text-xs text-[#bbcabf]/60 mt-1">
              Agrega gastos en la pestaña <span className="text-[#4edea3] font-bold">Añadir</span> indicando esta semana para desbloquear.
            </p>
          </div>
        ) : weekExpenses.length === 0 ? (
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
                      {expense.description && (
                        <p className="font-sans text-[11px] text-[#bbcabf]/60 italic mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                          "{expense.description}"
                        </p>
                      )}
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
                        className="material-symbols-outlined text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-500/10 cursor-pointer ml-1 text-base"
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

      {/* Dynamic Savings Insight Banner card */}
      <div className="glass-card rounded-2xl p-5 flex items-center gap-5 border-[#4edea3]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4edea3]/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none"></div>
        <div className="w-14 h-14 rounded-full bg-[#4edea3]/10 flex items-center justify-center text-[#4edea3] shrink-0">
          <span className="material-symbols-outlined text-3xl font-light">trending_down</span>
        </div>
        <div className="space-y-0.5">
          <h4 className="font-sans text-sm font-bold text-[#dae2fd]">Ahorro detectado</h4>
          <p className="font-sans text-xs text-[#bbcabf] leading-relaxed">
            Esta semana has gastado un <span className="text-[#4edea3] font-bold">12% menos</span> en alimentación comparado con la media. ¡Sigue así!
          </p>
        </div>
      </div>
    </div>
  );
}
