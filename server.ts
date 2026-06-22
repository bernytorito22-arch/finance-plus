import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Initialize Gemini client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini API client:", err);
  }
} else {
  console.log("No valid GEMINI_API_KEY environment variable found. Falling back to local smart insights.");
}

// Full-stack API endpoint for expense analysis
app.post("/api/analyze", async (req, res) => {
  const { expenses, budget, income, period = "monthly" } = req.body;

  if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
    return res.json({
      insight: "¡Comienza agregando algunos gastos en la pestaña Añadir! Analizaremos tus conductas de consumo para darte recomendaciones.",
      savingGoal: "Crea tu primer hábito de ahorro hoy."
    });
  }

  // Calculate some metadata for fallback or context
  const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const categories: Record<string, number> = {};
  expenses.forEach(exp => {
    const cat = exp.category || "Otros";
    categories[cat] = (categories[cat] || 0) + (exp.amount || 0);
  });

  // Sort categories by expenditure
  const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0]?.[0] || "Ninguna";
  const topCategoryAmount = sortedCategories[0]?.[1] || 0;
  const topCategoryPercent = totalSpent > 0 ? Math.round((topCategoryAmount / totalSpent) * 100) : 0;

  // Prepare fallback suggestions in Spanish in case Gemini is not initialized or fails
  const localFallbacks: Record<string, string> = {
    "Alimentación": `Tus gastos en Alimentación representan el ${topCategoryPercent}% de tus consumos ($${topCategoryAmount.toFixed(2)}). Planificar tus comidas de la semana y reducir las salidas a restaurantes te podría ahorrar hasta un 15% este mes.`,
    "Transporte": `El transporte es tu mayor egreso en este periodo con $${topCategoryAmount.toFixed(2)} (${topCategoryPercent}%). Considerar opciones compartidas o abonos mensuales podría liberar fondos para tus objetivos.`,
    "Vivienda": `Tus gastos fijos de Vivienda representan el ${topCategoryPercent}% del presupuesto ($${topCategoryAmount.toFixed(2)}). Intenta regular el uso de servicios públicos para disminuir los egresos complementarios.`,
    "Entretenimiento": `Has destinado $${topCategoryAmount.toFixed(2)} (${topCategoryPercent}%) a Entretenimiento. Reducir suscripciones innecesarias o planificar salidas de menor costo optimizaría tu ahorro semanal.`,
    "Salud": `Tus egresos en Salud son de $${topCategoryAmount.toFixed(2)} (${topCategoryPercent}%). Revisa coberturas de seguros o programas preventivos para anticiparte a gastos imprevistos.`,
    "Otros": `Has gastado $${topCategoryAmount.toFixed(2)} en categorías variables. Categorizar con mayor detalle tus movimientos te dará un mejor panorama y control financiero.`
  };

  const defaultFallback = localFallbacks[topCategory] || `Has gastado un total de $${totalSpent.toFixed(2)} este periodo. Tu mayor categoría es ${topCategory} con $${topCategoryAmount.toFixed(2)}. ¡Sigue registrando para definir un plan de optimización detallado!`;

  const budgetRatio = budget ? totalSpent / budget : 0;
  let genericAdvice = defaultFallback;
  if (budgetRatio > 0.9) {
    genericAdvice = `¡Alerta de Presupuesto! Has gastado el ${Math.round(budgetRatio * 100)}% de tu presupuesto. Considera pausar compras no esenciales de ${topCategory === "Otros" ? "gastos varios" : topCategory.toLowerCase()} por el resto de la semana.`;
  } else if (budgetRatio < 0.5 && totalSpent > 0) {
    genericAdvice = `¡Vas super bien! Has consumido solo el ${Math.round(budgetRatio * 100)}% de tu límite. Si desvías un 10% de lo restante a tu Fondo de Emergencia, consolidarás tu salud financiera más rápido.`;
  }

  // If Gemini is available, use it!
  if (ai) {
    try {
      const expensesPrompt = expenses.map(e => 
        `- Nombre: ${e.name}, Categoría: ${e.category || "Otros"}, Monto: $${e.amount}, Notas: ${e.description || "Ninguna"}`
      ).join("\n");

      const prompt = `Analiza los siguientes gastos de un usuario en su app de finanzas personales para el periodo '${period}':
Presupuesto límite: $${budget || "No definido"}
Ingresos mensuales: $${income || "No definido"}
Gastos totales de este periodo: $${totalSpent}
Gastos detallados:
${expensesPrompt}

Instrucción:
Genera una recomendación financiera concisa, accionable y motivadora de exactamente 2 oraciones en español. Dirígete de 'tú'. Menciona estadísticas específicas de sus datos reales de gasto (ej. la categoría principal '${topCategory}' que representa el ${topCategoryPercent}% de lo gastado o un ahorro recomendado). Di cosas reales, sin inventar montos exagerados. Estructura el resultado como un JSON plano con un único campo "insight" que recoga la recomendación en texto plano. Evita usar markdown dentro del JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text?.trim() || "";
      console.log("Gemini raw response:", responseText);

      try {
        const parsed = JSON.parse(responseText);
        if (parsed.insight) {
          return res.json({
            insight: parsed.insight,
            savingGoal: `Meta: Optimizar ${topCategory.toLowerCase()}`
          });
        }
      } catch (parseErr) {
        console.error("Error parsing Gemini JSON, using text fallback:", parseErr);
        // Regular expression fallback to capture if it returned plain string or malformed JSON
        if (responseText && !responseText.includes("{")) {
          return res.json({
            insight: responseText.replace(/"/g, ''),
            savingGoal: `Meta: Optimizar ${topCategory.toLowerCase()}`
          });
        }
      }
    } catch (geminiErr) {
      console.error("Failed to generate content from Gemini API:", geminiErr);
    }
  }

  // Return the calculated local fallback advice
  return res.json({
    insight: genericAdvice,
    savingGoal: `Meta: Optimizar ${topCategory.toLowerCase()}`
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
