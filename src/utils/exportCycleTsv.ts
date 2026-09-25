import { Expense, WeekRange } from "../types";
import { getPaymentMethod, getTransactionType } from "./wallet";
import { isDateInRange, toDateOnlyString } from "./week";

export const CYCLE_TSV_HEADER =
  "Ciclo\tFecha\tTipo\tNombre\tMonto\tCategoría\tMétodo\tSemana\tNota";

const ROW_BREAK = "\r\n";

function sanitizeCell(value: string): string {
  return value.replace(/[\t\r\n]/g, " ");
}

function weekForDate(date: string, weekRanges: WeekRange[]): string {
  for (const range of weekRanges) {
    if (isDateInRange(date, range.startDate, range.endDate)) {
      return String(range.week);
    }
  }
  return "sin semana";
}

type CycleTsvOptions = {
  cycleLabel: string;
  weekRanges: WeekRange[];
  includeHeader: boolean;
};

function cycleRows(expenses: Expense[], options: CycleTsvOptions): string[][] {
  const sorted = [...expenses].sort((a, b) => {
    const byDate = toDateOnlyString(new Date(a.date)).localeCompare(
      toDateOnlyString(new Date(b.date))
    );
    if (byDate !== 0) return byDate;
    return a.name.localeCompare(b.name);
  });

  return sorted.map((expense) => [
    options.cycleLabel,
    `'${toDateOnlyString(new Date(expense.date))}`,
    getTransactionType(expense),
    sanitizeCell(expense.name),
    expense.amount.toFixed(2),
    expense.category,
    getPaymentMethod(expense),
    weekForDate(expense.date, options.weekRanges),
    sanitizeCell(expense.description ?? ""),
  ]);
}

export function buildCycleTsv(expenses: Expense[], options: CycleTsvOptions): string {
  const lines: string[] = [];
  if (options.includeHeader) lines.push(CYCLE_TSV_HEADER);
  for (const row of cycleRows(expenses, options)) {
    lines.push(row.join("\t"));
  }
  if (lines.length === 0) return "";
  return `${lines.join(ROW_BREAK)}${ROW_BREAK}`;
}
