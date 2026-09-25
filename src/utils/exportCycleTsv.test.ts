import { describe, expect, it } from "vitest";
import type { Expense, WeekRange } from "../types";
import { buildCycleTsv, CYCLE_TSV_HEADER } from "./exportCycleTsv";

function expense(partial: Partial<Expense> & Pick<Expense, "name" | "amount" | "date">): Expense {
  return {
    id: partial.name,
    category: "Comida",
    description: "",
    week: 4,
    status: "Completado",
    ...partial,
  };
}

const weekRanges: WeekRange[] = [
  { week: 1, startDate: "2026-09-01", endDate: "2026-09-07", label: "1-7 sep", status: "completed" },
  { week: 2, startDate: "2026-09-08", endDate: "2026-09-14", label: "8-14 sep", status: "current" },
];

const headerLine = `${CYCLE_TSV_HEADER}\r\n`;

describe("buildCycleTsv", () => {
  it("writes the exact header and one gasto row", () => {
    const text = buildCycleTsv(
      [expense({ name: "Cafe", amount: 10, date: "2026-09-03T12:00:00", description: "Notas" })],
      { cycleLabel: "1-30 sep", weekRanges, includeHeader: true }
    );
    expect(text).toBe(`${headerLine}1-30 sep\t'2026-09-03\tgasto\tCafe\t10.00\tComida\tefectivo\t1\tNotas\r\n`);
  });

  it("marks ingreso and defaults a missing payment method to efectivo", () => {
    const text = buildCycleTsv(
      [expense({ name: "Sueldo", amount: 1250.5, date: "2026-09-10T12:00:00", type: "ingreso", category: "Ingreso" })],
      { cycleLabel: "1-30 sep", weekRanges, includeHeader: false }
    );
    expect(text.startsWith(CYCLE_TSV_HEADER)).toBe(false);
    expect(text).toBe("1-30 sep\t'2026-09-10\tingreso\tSueldo\t1250.50\tIngreso\tefectivo\t2\t\r\n");
  });

  it("sorts by date then name", () => {
    const text = buildCycleTsv(
      [
        expense({ name: "B", amount: 1, date: "2026-09-03T12:00:00" }),
        expense({ name: "A", amount: 1, date: "2026-09-10T12:00:00" }),
        expense({ name: "A", amount: 1, date: "2026-09-03T18:00:00" }),
      ],
      { cycleLabel: "1-30 sep", weekRanges, includeHeader: false }
    );
    const names = text.trim().split("\n").map((line) => line.split("\t")[3]);
    expect(names).toEqual(["A", "B", "A"]);
  });

  it("replaces tabs and line breaks in name and note with spaces", () => {
    const text = buildCycleTsv(
      [expense({ name: "Cafe\tcon\nleche\r", amount: 1, date: "2026-09-03T12:00:00", description: "linea\n2" })],
      { cycleLabel: "1-30 sep", weekRanges, includeHeader: false }
    );
    expect(text.split("\t")).toHaveLength(9);
    expect(text).toContain("Cafe con leche ");
    expect(text.endsWith("linea 2\r\n")).toBe(true);
  });

  it("uses sin semana when the date matches no range, ignoring expense.week", () => {
    const text = buildCycleTsv(
      [expense({ name: "Viejo", amount: 1, date: "2026-08-01T12:00:00", week: 2 })],
      { cycleLabel: "1-30 sep", weekRanges, includeHeader: false }
    );
    expect(text.split("\t")[7]).toBe("sin semana");
  });

  it("returns only the header, or an empty string, when there are no movements", () => {
    const withHeader = buildCycleTsv([], { cycleLabel: "1-30 sep", weekRanges, includeHeader: true });
    const rowsOnly = buildCycleTsv([], { cycleLabel: "1-30 sep", weekRanges, includeHeader: false });
    expect(withHeader).toBe(headerLine);
    expect(rowsOnly).toBe("");
  });

  it("does not repeat the header when copying rows only", () => {
    const text = buildCycleTsv(
      [expense({ name: "Cafe", amount: 10, date: "2026-09-03T12:00:00" })],
      { cycleLabel: "1-30 sep", weekRanges, includeHeader: false }
    );
    expect(text.includes("Ciclo")).toBe(false);
    expect(text.split("\r\n").filter(Boolean)).toHaveLength(1);
  });
});
