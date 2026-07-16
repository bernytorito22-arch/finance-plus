import { describe, it, expect } from "vitest";
import {
  buildAnalyzeResponse,
  parseGeminiInsightText,
} from "./analyzeInsight";

describe("buildAnalyzeResponse", () => {
  it("returns onboarding copy when expenses empty", () => {
    const r = buildAnalyzeResponse({ expenses: [] });
    expect(r.insight).toMatch(/Comienza agregando/);
    expect(r.savingGoal).toBeTruthy();
  });

  it("returns budget alert when spend exceeds 90% of budget", () => {
    const r = buildAnalyzeResponse({
      budget: 100,
      expenses: [{ name: "X", category: "Alimentación", amount: 95 }],
    });
    expect(r.insight).toMatch(/Alerta de Presupuesto/);
  });
});

describe("parseGeminiInsightText", () => {
  it("parses JSON insight field", () => {
    const r = parseGeminiInsightText(
      JSON.stringify({ insight: "Ahorra en transporte." }),
      "Transporte"
    );
    expect(r?.insight).toBe("Ahorra en transporte.");
    expect(r?.savingGoal).toMatch(/transporte/i);
  });

  it("returns null on empty string", () => {
    expect(parseGeminiInsightText("", "Otros")).toBeNull();
  });
});
