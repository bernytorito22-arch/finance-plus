import { useState, useEffect } from "react";
import { Expense } from "../types";
import { CATEGORIES_CONFIG } from "../mockData";

interface AnalysisDetailedProps {
  expenses: Expense[];
  aiRecommendation?: string;
  onRefreshAi?: () => void;
  isLoadingAi?: boolean;
}

type PeriodType = "Semana" | "Mes" | "Año";

export default function AnalysisDetailed({ 
  expenses, 
  aiRecommendation, 
  onRefreshAi,
  isLoadingAi 
}: AnalysisDetailedProps) {
  const [period, setPeriod] = useState<PeriodType>("Semana");
  const [expandedCard, setExpandedCard] = useState<Record<string, boolean>>({});

  const toggleExpand = (cardKey: string) => {
    setExpandedCard(prev => ({ ...prev, [cardKey]: !prev[cardKey] }));
  };
  
  // Total Spent calculations based on selected period
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Dynamically compute the top spending category
  const categorySpent: Record<string, number> = {};
  expenses.forEach(e => {
    categorySpent[e.category] = (categorySpent[e.category] || 0) + e.amount;
  });

  const sortedCategories = Object.entries(categorySpent).sort((a, b) => b[1] - a[1]);
  const topCategoryName = sortedCategories[0]?.[0] || "Ninguna";
  const topCategoryAmount = sortedCategories[0]?.[1] || 0;

  // Let's create mock relative data for other filters
  const selectedSpent = period === "Semana" 
    ? totalSpent * 0.45 
    : period === "Mes" 
      ? totalSpent 
      : totalSpent * 12.4;

  const selectedSaving = period === "Semana"
    ? 450.00
    : period === "Mes"
      ? 1840.00
      : 28400.00;

  const selectedComparisonPercent = period === "Semana" ? "10% menos" : period === "Mes" ? "12.5% menos" : "12.4% menos";
  const selectedComparisonText = period === "Semana" ? "que la semana pasada" : period === "Mes" ? "que el mes anterior" : "vs año 2025";
  const progressRatio = period === "Semana" ? 65 : period === "Mes" ? 44 : 22.6;
  const progressGoalText = period === "Semana" ? "65% de tu meta semanal" : period === "Mes" ? "82% usado de tu presupuesto" : "Sasa de Ahorro: 22.6%";

  // Trigger web suggestions automatically on load
  useEffect(() => {
    if (!aiRecommendation && onRefreshAi) {
      onRefreshAi();
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header & Time Filter */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-sans text-2xl font-bold text-[#dae2fd] mb-1">Análisis Detallado</h2>
          <p className="text-[#bbcabf] font-sans text-sm">Resumen de comportamiento financiero</p>
        </div>
        
        <div className="flex bg-[#171f33] p-1 rounded-xl self-center sm:self-auto border border-white/5 shadow-inner">
          {(["Semana", "Mes", "Año"] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 font-mono text-xs rounded-lg transition-all cursor-pointer ${
                period === p
                  ? "bg-[#4edea3] text-[#003824] font-bold shadow-lg"
                  : "text-[#bbcabf] hover:text-[#dae2fd]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* Dynamic Insights Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Gasto Total */}
        <div 
          onClick={() => toggleExpand("gasto")}
          className="glass-card p-4 sm:p-5 rounded-xl flex flex-col justify-between overflow-hidden relative min-w-0 cursor-pointer hover:border-white/15 active:scale-[0.99] transition-all"
          title={expandedCard["gasto"] ? "Click para contraer" : "Click para ver completo"}
        >
          <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-7xl font-light">account_balance_wallet</span>
          </div>
          <div className="relative z-10 min-w-0">
            <span className="text-[#bbcabf] font-mono text-[11px] uppercase tracking-wider block mb-1 truncate">
              {period === "Semana" ? "Gasto Estimado" : period === "Mes" ? "Gasto Total" : "Gasto Anual"}
            </span>
            <div className="flex items-baseline gap-1 mt-1 min-w-0">
              <span 
                className={`font-sans font-black text-[#dae2fd] transition-all duration-300 w-full selection:bg-transparent ${
                  expandedCard["gasto"] 
                    ? "text-sm sm:text-base break-all whitespace-normal block" 
                    : "text-lg sm:text-xl md:text-xl lg:text-2xl truncate block"
                }`}
              >
                ${selectedSpent.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[#4edea3] relative z-10 min-w-0">
            <span className="material-symbols-outlined text-[18px] shrink-0">trending_down</span>
            <span className="font-mono text-xs truncate">{selectedComparisonPercent} {selectedComparisonText}</span>
          </div>
        </div>

        {/* Card 2: Ahorro Estimado */}
        <div 
          onClick={() => toggleExpand("ahorro")}
          className="glass-card p-4 sm:p-5 rounded-xl flex flex-col justify-between min-w-0 cursor-pointer hover:border-white/15 active:scale-[0.99] transition-all"
          title={expandedCard["ahorro"] ? "Click para contraer" : "Click para ver completo"}
        >
          <div className="min-w-0">
            <span className="text-[#bbcabf] font-mono text-[11px] uppercase tracking-wider block mb-1 truncate">Ahorro Estimado</span>
            <div className="flex items-baseline gap-1 mt-1 min-w-0">
              <span 
                className={`font-sans font-black text-[#dae2fd] transition-all duration-300 w-full selection:bg-transparent ${
                  expandedCard["ahorro"] 
                    ? "text-sm sm:text-base break-all whitespace-normal block" 
                    : "text-lg sm:text-xl md:text-xl lg:text-2xl truncate block"
                }`}
              >
                ${selectedSaving.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="mt-4 min-w-0">
            <div className="w-full bg-[#171f33] h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#4edea3] h-full chart-bar-glow transition-all duration-1000" 
                style={{ width: `${progressRatio}%` }}
              ></div>
            </div>
            <p className="font-mono text-[10px] text-[#bbcabf] mt-1.5 truncate">{progressGoalText}</p>
          </div>
        </div>

        {/* Card 3: Categoría Top */}
        <div 
          onClick={() => toggleExpand("top")}
          className="glass-card p-4 sm:p-5 rounded-xl flex flex-col justify-between min-w-0 cursor-pointer hover:border-white/15 active:scale-[0.99] transition-all"
          title={expandedCard["top"] ? "Click para contraer" : "Click para ver completo"}
        >
          <div className="min-w-0">
            <span className="text-[#bbcabf] font-mono text-[11px] uppercase tracking-wider block mb-1 truncate">Categoría Top</span>
            <div className="flex items-baseline gap-1 mt-1 min-w-0">
              <span 
                className={`font-sans font-black text-[#dae2fd] transition-all duration-300 w-full selection:bg-transparent ${
                  expandedCard["top"] 
                    ? "text-sm sm:text-base break-all whitespace-normal block" 
                    : "text-lg sm:text-xl md:text-xl lg:text-2xl truncate block"
                }`}
              >
                {topCategoryName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-red-400 min-w-0">
            <span className="material-symbols-outlined text-[18px] shrink-0">warning</span>
            <span className="font-mono text-xs truncate">
              ${topCategoryAmount.toFixed(2)} consumido ({period === "Semana" ? "+5% en ocio" : "Verifica tu meta"})
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Bento Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Weekly double Bar SVG Chart */}
        <div className="lg:col-span-8 glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-sans text-md font-bold text-[#dae2fd]">Comparativa {period === "Semana" ? "Semanal" : period === "Mes" ? "Mensual" : "Anual"}</h3>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4edea3]/40"></div>
                <span className="text-[10px] font-mono text-[#bbcabf]">Anterior</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4edea3] chart-bar-glow"></div>
                <span className="text-[10px] font-mono text-[#bbcabf]">Actual</span>
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-2 px-2 pb-2">
            {period === "Semana" ? (
              // Weekdays graph
              [
                { day: "L", past: 60, current: 45 },
                { day: "M", past: 40, current: 70 },
                { day: "X", past: 85, current: 30 },
                { day: "J", past: 55, current: 80 },
                { day: "V", past: 90, current: 95 },
                { day: "S", past: 30, current: 60 },
                { day: "D", past: 20, current: 15 },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="w-full flex items-end justify-center gap-1 h-44 relative">
                    <div 
                      className="w-2 bg-[#4edea3]/20 rounded-t-sm transition-all group-hover:bg-[#4edea3]/40" 
                      style={{ height: `${item.past}%` }}
                      title={`Pasada: ${item.past}%`}
                    ></div>
                    <div 
                      className="w-2 bg-[#4edea3] rounded-t-sm transition-all chart-bar-glow" 
                      style={{ height: `${item.current}%` }}
                      title={`Actual: ${item.current}%`}
                    ></div>
                  </div>
                  <span className="text-[10px] font-mono text-[#bbcabf] font-bold">{item.day}</span>
                </div>
              ))
            ) : period === "Mes" ? (
              // Weeks graph
              [
                { label: "Sm 1", past: 50, current: 65 },
                { label: "Sm 2", past: 75, current: 45 },
                { label: "Sm 3", past: 0, current: 90 },
                { label: "Sm 4", past: 0, current: 30 },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="w-full flex items-end justify-center gap-2 h-44 relative">
                    <div 
                      className="w-3 bg-[#4edea3]/20 rounded-t-sm transition-all group-hover:bg-[#4edea3]/40" 
                      style={{ height: `${item.past}%` }}
                    ></div>
                    <div 
                      className="w-3 bg-[#4edea3] rounded-t-sm transition-all chart-bar-glow" 
                      style={{ height: `${item.current}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-mono text-[#bbcabf] font-bold">{item.label}</span>
                </div>
              ))
            ) : (
              // Months trend graph
              [
                { label: "ENE", h: "45%" },
                { label: "FEB", h: "55%" },
                { label: "MAR", h: "40%" },
                { label: "APR", h: "75%", high: true },
                { label: "MAY", h: "50%" },
                { label: "JUN", h: "65%" },
                { label: "JUL", h: "60%" },
                { label: "AUG", h: "35%" },
                { label: "SEP", h: "90%" },
                { label: "OCT", h: "55%" },
                { label: "NOV", h: "70%" },
                { label: "DEC", h: "50%" },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                  <div className="w-full flex items-end justify-center h-44 relative">
                    <div 
                      className={`w-1.5 rounded-t-md transition-all ${item.high ? 'bg-[#4edea3] shadow-[0_0_12px_#4edea3]' : 'bg-[#4edea3]/40 group-hover:bg-[#4edea3]/60'}`}
                      style={{ height: item.h }}
                    ></div>
                  </div>
                  <span className="text-[8px] font-mono text-[#bbcabf] truncate">{item.label}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Breakdown Sidebar list */}
        <div className="lg:col-span-4 glass-card p-5 rounded-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-sans text-md font-bold text-[#dae2fd]">Desglose de Distribución</h3>
            <div className="space-y-2">
              {CATEGORIES_CONFIG.map((catConfig) => {
                const total = categorySpent[catConfig.name] || 0;
                return (
                  <div key={catConfig.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors gap-2 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-lg ${catConfig.bgColor} flex items-center justify-center ${catConfig.textColor} shrink-0`}>
                        <span className="material-symbols-outlined text-base">{catConfig.icon}</span>
                      </div>
                      <span className="font-sans text-sm text-[#dae2fd] truncate flex-1 max-w-[120px]" title={catConfig.name}>{catConfig.name}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#dae2fd] shrink-0">
                      ${total.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <button className="w-full mt-4 py-2 bg-transparent border border-[#3c4a42] rounded-xl font-mono text-xs text-[#bbcabf] hover:bg-white/5 active:scale-98 transition-all cursor-pointer">
            Ver desglose completo
          </button>
        </div>
      </section>

      {/* Dynamic Automated Smart AI Insights */}
      <section className="glass-card p-5 rounded-xl border-l-4 border-[#4edea3] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4edea3]/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none"></div>
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
                className="material-symbols-outlined text-xs text-[#4edea3] hover:text-[#dae2fd] active:scale-90 transition-all cursor-pointer select-none"
                title="Generar nueva recomendación"
              >
                refresh
              </button>
            </div>

            {isLoadingAi ? (
              <div className="space-y-2 py-1">
                <div className="h-3 bg-white/5 rounded animate-pulse w-full"></div>
                <div className="h-3 bg-white/5 rounded animate-pulse w-4/5"></div>
              </div>
            ) : (
              <p className="font-sans text-xs text-[#bbcabf] leading-relaxed">
                {aiRecommendation || "¡Finance+ está analizando tus consumos...! Haz clic en el botón de recarga arriba para obtener tu diagnóstico personalizado."}
              </p>
            )}

            <div className="pt-2 flex gap-4 font-mono text-xs font-bold text-[#4edea3]">
              <button className="hover:underline hover:text-white transition-all cursor-pointer">
                Ver plan de ahorro
              </button>
              <button className="text-[#bbcabf] hover:text-white transition-all cursor-pointer">
                Descartar
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
