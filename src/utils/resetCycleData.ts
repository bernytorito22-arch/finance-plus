import { Expense, CycleRange } from "../types";
import { isDateInRange } from "./week";

export function removeExpensesInCycle(
  expenses: Expense[],
  cycleRange: Pick<CycleRange, "startDate" | "endDate">
): Expense[] {
  return expenses.filter(
    (e) => !isDateInRange(e.date, cycleRange.startDate, cycleRange.endDate)
  );
}
