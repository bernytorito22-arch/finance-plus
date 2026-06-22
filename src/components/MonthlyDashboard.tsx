import { useState } from "react";
import { Expense, MonthlyBudget } from "../types";
import { CATEGORIES_CONFIG } from "../mockData";

interface MonthlyDashboardProps {
  expenses: Expense[];
  budget: MonthlyBudget;
  onUpdateBudget?: (budget: MonthlyBudget) => void;
}

export default function MonthlyDashboard({ expenses, budget, onUpdateBudget }: MonthlyDashboardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTotalBudget, setEditTotalBudget] = useState("");
  const [editIncome, setEditIncome] = useState("");

  // Calculations
  const totalIncome = budget.income;
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBudget = budget.totalBudget - totalExpenses;
  const budgetPercentage = budget.totalBudget > 0
    ? Math.min(100, Math.round((totalExpenses / budget.totalBudget) * 100))
    : 0;
  const incomeBarWidth = totalIncome > 0
    ? Math.min(100, Math.round((totalExpenses / totalIncome) * 100))
    : 0;

  // Category percentage calculation
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const categoriesWithPercentage = CATEGORIES_CONFIG.map((cat) => {
    const total = categoryTotals[cat.name] || 0;
    const percentage = totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0;
    return {
      ...cat,
      total,
      percentage,
    };
  }).filter((c) => c.total > 0);

  // SVG parameters for standard 100x100 donut
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate relative offsets for categories to draw sequential arcs
  let accumulatedPercent = 0;
  const donutArcs = categoriesWithPercentage
    .filter(c => c.total > 0)
    .map((cat) => {
      const pct = (cat.total / totalExpenses) * 100;
      const strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
      accumulatedPercent += pct;
      return {
        ...cat,
        strokeDasharray,
        strokeDashoffset,
      };
    });

  const cashTotal = expenses
    .filter((e) => (e.paymentMethod ?? "efectivo") === "efectivo")
    .reduce((sum, e) => sum + e.amount, 0);
  const cardTotal = expenses
    .filter((e) => e.paymentMethod === "tarjeta")
    .reduce((sum, e) => sum + e.amount, 0);
  const paymentTotal = cashTotal + cardTotal;
  const cashPercent = paymentTotal > 0 ? Math.round((cashTotal / paymentTotal) * 100) : 0;
  const cardPercent = paymentTotal > 0 ? 100 - cashPercent : 0;
  const paymentRadius = 35;
  const paymentCircumference = 2 * Math.PI * paymentRadius;
  const cashArcLength = (cashPercent / 100) * paymentCircumference;
  const cardArcLength = (cardPercent / 100) * paymentCircumference;

  return (
    <div className="space-y-6">
      {/* Hero Header Section */}
      <section className="text-center space-y-2 py-4">
        <p className="font-mono text-xs text-[#bbcabf] tracking-wider uppercase">Presupuesto Mensual Restante</p>
        <div className="flex items-center justify-center gap-2">
          <h2 className="font-sans text-4xl sm:text-5xl font-extrabold text-[#4edea3] tracking-tight pl-6">
            ${remainingBudget.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          {onUpdateBudget && (
            <button 
              onClick={() => {
                setEditTotalBudget(budget.totalBudget.toString());
                setEditIncome(budget.income.toString());
                setIsEditing(true);
              }}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-[#4edea3] flex items-center justify-center border border-white/5 transition-all cursor-pointer"
              title="Ajustar presupuesto e ingresos"
            >
              <span className="material-symbols-outlined text-sm font-semibold">tune</span>
            </button>
          )}
        </div>
      </section>

      {/* Balance Overview Card - Grid */}
      <section className="glass-card rounded-2xl p-4 sm:p-5 grid grid-cols-2 gap-3 sm:gap-4 relative overflow-hidden">
        <div className="space-y-1 relative z-10 min-w-0">
          <p className="font-mono text-[11px] text-[#bbcabf] uppercase tracking-wide truncate">Ingresos</p>
          <p className="font-sans text-base sm:text-lg md:text-xl font-bold text-[#4edea3] truncate" title={`$${totalIncome.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`}>
            ${totalIncome.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
          </p>
            <div className="h-1.5 bg-[#171f33] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.5)] transition-all duration-700"
              style={{ width: `${incomeBarWidth}%` }}
            ></div>
          </div>
        </div>
        
        <div className="space-y-1 relative z-10 border-l border-white/10 pl-3 sm:pl-4 min-w-0">
          <p className="font-mono text-[11px] text-[#bbcabf] uppercase tracking-wide truncate">Gastos</p>
          <p className="font-sans text-base sm:text-lg md:text-xl font-bold text-[#dae2fd] truncate" title={`$${totalExpenses.toLocaleString("es-ES", { minimumFractionDigits: 2 })}`}>
            ${totalExpenses.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
          </p>
          <div className="h-1.5 bg-[#171f33] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#adc6ff] shadow-[0_0_8px_rgba(173,198,255,0.5)] transition-all duration-700" 
              style={{ width: `${Math.min(100, budgetPercentage)}%` }}
            ></div>
          </div>
        </div>
      </section>

      {/* Circular Expense Distribution Graph */}
      <section className="glass-card rounded-2xl p-5">
        <h3 className="font-sans text-lg font-bold text-[#dae2fd] mb-4">Distribución</h3>

        <div className="flex flex-col items-center sm:flex-row sm:justify-around gap-6">
          {/* Animated Donut Chart */}
          <div className="relative w-[180px] h-[180px]">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#171f33"
                strokeWidth="10"
              />
              
              {totalExpenses === 0 ? (
                // Draw fallback gray circle if no expenses
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="#2d3449"
                  strokeWidth="10"
                />
              ) : (
                /* Dynamic colored arcs */
                donutArcs.map((arc, idx) => {
                  // Fallback color mapping to hex values
                  const strokeColor = 
                    arc.name === "Alimentación" ? "#4edea3" :
                    arc.name === "Transporte" ? "#adc6ff" :
                    arc.name === "Vivienda" ? "#10b981" :
                    arc.name === "Ocio" ? "#c0c1ff" :
                    arc.name === "Salud" ? "#ffb4ab" :
                    arc.name === "Compras" ? "#facc15" : "#94a3b8";

                  return (
                    <circle
                      key={idx}
                      className="transition-all duration-1000"
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke={strokeColor}
                      strokeWidth="10"
                      strokeDasharray={arc.strokeDasharray}
                      strokeDashoffset={arc.strokeDashoffset}
                      strokeLinecap="round"
                    />
                  );
                })
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-xs text-[#bbcabf] uppercase tracking-wide">Límite</span>
              <span className="font-sans text-2xl font-black text-[#dae2fd]">{budgetPercentage}%</span>
            </div>
          </div>

          {/* Color Indicators Legends */}
          <div className="space-y-3 w-full sm:w-auto">
            {categoriesWithPercentage.length === 0 ? (
              <p className="font-sans text-sm text-[#bbcabf]/70 text-center sm:text-left">
                Sin gastos registrados aún
              </p>
            ) : (
              categoriesWithPercentage.map((cat, idx) => {
              const bgIndicator = 
                cat.name === "Alimentación" ? "bg-[#4edea3]" :
                cat.name === "Transporte" ? "bg-[#adc6ff]" :
                cat.name === "Vivienda" ? "bg-[#10b981]" :
                cat.name === "Ocio" ? "bg-[#c0c1ff]" :
                cat.name === "Salud" ? "bg-[#ffb4ab]" :
                cat.name === "Compras" ? "bg-[#facc15]" : "bg-[#94a3b8]";

              const neonGlow = 
                cat.name === "Alimentación" ? "shadow-[0_0_10px_rgba(78,222,163,0.4)]" :
                cat.name === "Transporte" ? "shadow-[0_0_10px_rgba(173,198,255,0.4)]" :
                "shadow-sm";

              return (
                <div key={idx} className="flex items-center gap-3 min-w-0">
                  <div className={`w-3 h-3 rounded-full ${bgIndicator} ${neonGlow} shrink-0`} />
                  <span className="font-sans text-sm text-[#dae2fd] flex-1 min-w-[90px] truncate" title={cat.name}>{cat.name}</span>
                  <span className="font-mono text-xs text-[#bbcabf] font-semibold text-right shrink-0">
                    {cat.percentage}%
                  </span>
                </div>
              );
            })
            )}
          </div>
        </div>
      </section>

      {/* Payment Method Breakdown */}
      <section className="glass-card rounded-2xl p-5">
        <h3 className="font-sans text-lg font-bold text-[#dae2fd] mb-4">Efectivo vs Tarjeta</h3>

        <div className="flex flex-col items-center sm:flex-row sm:justify-around gap-6">
          <div className="relative w-[180px] h-[180px]">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={paymentRadius}
                fill="transparent"
                stroke="#171f33"
                strokeWidth="10"
              />
              {paymentTotal === 0 ? (
                <circle
                  cx="50"
                  cy="50"
                  r={paymentRadius}
                  fill="transparent"
                  stroke="#2d3449"
                  strokeWidth="10"
                />
              ) : (
                <>
                  {cashTotal > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={paymentRadius}
                      fill="transparent"
                      stroke="#4edea3"
                      strokeWidth="10"
                      strokeDasharray={`${cashArcLength} ${paymentCircumference}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  )}
                  {cardTotal > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={paymentRadius}
                      fill="transparent"
                      stroke="#adc6ff"
                      strokeWidth="10"
                      strokeDasharray={`${cardArcLength} ${paymentCircumference}`}
                      strokeDashoffset={-cashArcLength}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  )}
                </>
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-xs text-[#bbcabf] uppercase tracking-wide">Total</span>
              <span className="font-sans text-lg font-black text-[#dae2fd]">
                ${paymentTotal.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="space-y-4 w-full sm:w-auto">
            <div className="space-y-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-3 h-3 rounded-full bg-[#4edea3] shadow-[0_0_10px_rgba(78,222,163,0.4)] shrink-0" />
                <span className="font-sans text-sm text-[#dae2fd] flex-1">Efectivo</span>
                <span className="font-mono text-xs text-[#bbcabf] font-semibold">{cashPercent}%</span>
              </div>
              <div className="h-2 bg-[#171f33] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.5)] transition-all duration-700"
                  style={{ width: `${cashPercent}%` }}
                />
              </div>
              <p className="font-mono text-sm font-bold text-[#4edea3]">
                ${cashTotal.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-3 h-3 rounded-full bg-[#adc6ff] shadow-[0_0_10px_rgba(173,198,255,0.4)] shrink-0" />
                <span className="font-sans text-sm text-[#dae2fd] flex-1">Tarjeta</span>
                <span className="font-mono text-xs text-[#bbcabf] font-semibold">{cardPercent}%</span>
              </div>
              <div className="h-2 bg-[#171f33] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#adc6ff] shadow-[0_0_8px_rgba(173,198,255,0.5)] transition-all duration-700"
                  style={{ width: `${cardPercent}%` }}
                />
              </div>
              <p className="font-mono text-sm font-bold text-[#adc6ff]">
                ${cardTotal.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {paymentTotal === 0 && (
              <p className="font-sans text-sm text-[#bbcabf]/70 text-center sm:text-left">
                Registra gastos indicando el método de pago
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Budget and Income configuration modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#060e20]/85 backdrop-blur-md">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 space-y-5 animate-fade-in relative border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <h3 className="font-sans text-lg font-bold text-[#dae2fd] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4edea3]">tune</span>
                Ajustes de Presupuesto
              </h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-[#bbcabf] hover:text-white transition-all cursor-pointer w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/5"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="font-sans text-xs text-[#bbcabf] leading-relaxed">
              Define tu presupuesto límite de gastos permitidos para el mes actual e introduce tus ingresos mensuales estimados.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const numBudget = parseFloat(editTotalBudget);
              const numIncome = parseFloat(editIncome);
              if (!isNaN(numBudget) && !isNaN(numIncome) && onUpdateBudget) {
                onUpdateBudget({
                  totalBudget: numBudget,
                  income: numIncome
                });
                setIsEditing(false);
              }
            }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] text-[#bbcabf] uppercase tracking-wider block">Presupuesto Máximo Mensual</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-sans text-sm text-[#bbcabf] select-none">$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={editTotalBudget}
                    onChange={(e) => setEditTotalBudget(e.target.value)}
                    className="w-full bg-[#171f33]/70 border border-white/10 rounded-xl py-2.5 pl-8 pr-4 font-sans text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#4edea3] focus:border-[#4edea3] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[10px] text-[#bbcabf] uppercase tracking-wider block">Ingresos del Mes</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-sans text-sm text-[#bbcabf] select-none">$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={editIncome}
                    onChange={(e) => setEditIncome(e.target.value)}
                    className="w-full bg-[#171f33]/70 border border-white/10 rounded-xl py-2.5 pl-8 pr-4 font-sans text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#4edea3] focus:border-[#4edea3] transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 text-[#dae2fd] text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-gradient-to-br from-[#4edea3] to-[#10b981] hover:brightness-105 active:scale-[0.98] text-[#002113] text-xs font-bold py-2.5 rounded-xl shadow-[0_4px_12px_rgba(78,222,163,0.3)] transition-all cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
