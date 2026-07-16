export type AnalyzeExpense = {
  name?: string;
  category?: string;
  amount?: number;
  description?: string;
};

export type AnalyzeRequestBody = {
  expenses?: AnalyzeExpense[];
  budget?: number;
  income?: number;
  period?: string;
};

export type AnalyzeResponse = {
  insight: string;
  savingGoal: string;
};

export type AnalyzeMeta = {
  totalSpent: number;
  topCategory: string;
  topCategoryAmount: number;
  topCategoryPercent: number;
};

export function getAnalyzeMeta(body: AnalyzeRequestBody): AnalyzeMeta {
  const expenses = body.expenses ?? [];
  const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const categories: Record<string, number> = {};

  expenses.forEach((exp) => {
    const cat = exp.category || "Otros";
    categories[cat] = (categories[cat] || 0) + (exp.amount || 0);
  });

  const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0]?.[0] || "Ninguna";
  const topCategoryAmount = sortedCategories[0]?.[1] || 0;
  const topCategoryPercent =
    totalSpent > 0 ? Math.round((topCategoryAmount / totalSpent) * 100) : 0;

  return { totalSpent, topCategory, topCategoryAmount, topCategoryPercent };
}

export function buildAnalyzeResponse(body: AnalyzeRequestBody): AnalyzeResponse {
  const { expenses, budget } = body;

  if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
    return {
      insight:
        "¡Comienza agregando algunos gastos en la pestaña Añadir! Analizaremos tus conductas de consumo para darte recomendaciones.",
      savingGoal: "Crea tu primer hábito de ahorro hoy.",
    };
  }

  const meta = getAnalyzeMeta(body);
  const { totalSpent, topCategory, topCategoryAmount, topCategoryPercent } =
    meta;

  const localFallbacks: Record<string, string> = {
    Alimentación: `Tus gastos en Alimentación representan el ${topCategoryPercent}% de tus consumos ($${topCategoryAmount.toFixed(2)}). Planificar tus comidas de la semana y reducir las salidas a restaurantes te podría ahorrar hasta un 15% este mes.`,
    Transporte: `El transporte es tu mayor egreso en este periodo con $${topCategoryAmount.toFixed(2)} (${topCategoryPercent}%). Considerar opciones compartidas o abonos mensuales podría liberar fondos para tus objetivos.`,
    Vivienda: `Tus gastos fijos de Vivienda representan el ${topCategoryPercent}% del presupuesto ($${topCategoryAmount.toFixed(2)}). Intenta regular el uso de servicios públicos para disminuir los egresos complementarios.`,
    Entretenimiento: `Has destinado $${topCategoryAmount.toFixed(2)} (${topCategoryPercent}%) a Entretenimiento. Reducir suscripciones innecesarias o planificar salidas de menor costo optimizaría tu ahorro semanal.`,
    Salud: `Tus egresos en Salud son de $${topCategoryAmount.toFixed(2)} (${topCategoryPercent}%). Revisa coberturas de seguros o programas preventivos para anticiparte a gastos imprevistos.`,
    Otros: `Has gastado $${topCategoryAmount.toFixed(2)} en categorías variables. Categorizar con mayor detalle tus movimientos te dará un mejor panorama y control financiero.`,
  };

  const defaultFallback =
    localFallbacks[topCategory] ||
    `Has gastado un total de $${totalSpent.toFixed(2)} este periodo. Tu mayor categoría es ${topCategory} con $${topCategoryAmount.toFixed(2)}. ¡Sigue registrando para definir un plan de optimización detallado!`;

  const budgetRatio = budget ? totalSpent / budget : 0;
  let genericAdvice = defaultFallback;

  if (budgetRatio > 0.9) {
    genericAdvice = `¡Alerta de Presupuesto! Has gastado el ${Math.round(budgetRatio * 100)}% de tu presupuesto. Considera pausar compras no esenciales de ${topCategory === "Otros" ? "gastos varios" : topCategory.toLowerCase()} por el resto de la semana.`;
  } else if (budgetRatio < 0.5 && totalSpent > 0) {
    genericAdvice = `¡Vas super bien! Has consumido solo el ${Math.round(budgetRatio * 100)}% de tu límite. Si desvías un 10% de lo restante a tu Fondo de Emergencia, consolidarás tu salud financiera más rápido.`;
  }

  return {
    insight: genericAdvice,
    savingGoal: `Meta: Optimizar ${topCategory.toLowerCase()}`,
  };
}

export function buildGeminiPrompt(
  body: AnalyzeRequestBody,
  meta: AnalyzeMeta
): string {
  const { expenses = [], budget, income, period = "monthly" } = body;
  const { totalSpent, topCategory, topCategoryPercent } = meta;

  const expensesPrompt = expenses
    .map(
      (e) =>
        `- Nombre: ${e.name}, Categoría: ${e.category || "Otros"}, Monto: $${e.amount}, Notas: ${e.description || "Ninguna"}`
    )
    .join("\n");

  return `Analiza los siguientes gastos de un usuario en su app de finanzas personales para el periodo '${period}':
Presupuesto límite: $${budget || "No definido"}
Ingresos mensuales: $${income || "No definido"}
Gastos totales de este periodo: $${totalSpent}
Gastos detallados:
${expensesPrompt}

Instrucción:
Genera una recomendación financiera concisa, accionable y motivadora de exactamente 2 oraciones en español. Dirígete de 'tú'. Menciona estadísticas específicas de sus datos reales de gasto (ej. la categoría principal '${topCategory}' que representa el ${topCategoryPercent}% de lo gastado o un ahorro recomendado). Di cosas reales, sin inventar montos exagerados. Estructura el resultado como un JSON plano con un único campo "insight" que recoga la recomendación en texto plano. Evita usar markdown dentro del JSON.`;
}

export function parseGeminiInsightText(
  responseText: string,
  topCategory: string
): AnalyzeResponse | null {
  const trimmed = responseText.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as { insight?: string };
    if (parsed.insight) {
      return {
        insight: parsed.insight,
        savingGoal: `Meta: Optimizar ${topCategory.toLowerCase()}`,
      };
    }
  } catch {
    if (!trimmed.includes("{")) {
      return {
        insight: trimmed.replace(/"/g, ""),
        savingGoal: `Meta: Optimizar ${topCategory.toLowerCase()}`,
      };
    }
  }

  return null;
}

export async function resolveAnalyze(
  body: AnalyzeRequestBody,
  apiKey?: string
): Promise<AnalyzeResponse> {
  const local = buildAnalyzeResponse(body);

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return local;
  }

  if (!body.expenses || body.expenses.length === 0) {
    return local;
  }

  const meta = getAnalyzeMeta(body);
  const prompt = buildGeminiPrompt(body, meta);
  const { callGeminiInsight } = await import("./callGeminiInsight");
  const responseText = await callGeminiInsight(apiKey, prompt);

  if (responseText) {
    const parsed = parseGeminiInsightText(responseText, meta.topCategory);
    if (parsed) return parsed;
  }

  return local;
}
