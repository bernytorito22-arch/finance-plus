import { resolveAnalyze, type AnalyzeRequestBody } from "../../src/utils/analyzeInsight";

interface Env {
  GEMINI_API_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as AnalyzeRequestBody;
    const result = await resolveAnalyze(body, context.env.GEMINI_API_KEY);
    return Response.json(result);
  } catch (err) {
    console.error("analyze failed", err);
    return Response.json(
      {
        insight: "No pudimos analizar ahora. Intenta de nuevo.",
        savingGoal: "Revisa tus gastos del mes",
      },
      { status: 200 }
    );
  }
};

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  return context.next();
};
