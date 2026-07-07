import {
  Expense,
  FinanceCycleConfig,
  MonthlyBudget,
  MonthlyExportPayload,
  WeeklyBudgets,
} from "../types";
import {
  getFinanceCycleRange,
  getFinanceWeekRanges,
  isDateInRange,
} from "./week";

interface BuildMonthlyExportInput {
  expenses: Expense[];
  budget: MonthlyBudget;
  weekBudgets: WeeklyBudgets;
  financeCycleConfig: FinanceCycleConfig;
  referenceDate?: Date;
}

function getWeekForExpense(
  expenseDate: string,
  weekRanges: ReturnType<typeof getFinanceWeekRanges>
): string {
  for (const range of weekRanges) {
    if (isDateInRange(expenseDate, range.startDate, range.endDate)) {
      return String(range.week);
    }
  }
  return "unassigned";
}

export function buildMonthlyExportPayload({
  expenses,
  budget,
  weekBudgets,
  financeCycleConfig,
  referenceDate = new Date(),
}: BuildMonthlyExportInput): MonthlyExportPayload {
  const cycleRange = getFinanceCycleRange(referenceDate, financeCycleConfig.monthStartDay);
  const weekRanges = getFinanceWeekRanges(cycleRange, referenceDate);

  const cycleExpenses = expenses.filter((expense) =>
    isDateInRange(expense.date, cycleRange.startDate, cycleRange.endDate)
  );

  const byCategory: Record<string, number> = {};
  const byWeek: Record<string, number> = {};
  const byPaymentMethod: Record<string, number> = {};

  let totalExpenses = 0;

  for (const expense of cycleExpenses) {
    totalExpenses += expense.amount;
    byCategory[expense.category] = (byCategory[expense.category] ?? 0) + expense.amount;

    const weekKey = getWeekForExpense(expense.date, weekRanges);
    byWeek[weekKey] = (byWeek[weekKey] ?? 0) + expense.amount;

    const paymentMethod = expense.paymentMethod ?? "efectivo";
    byPaymentMethod[paymentMethod] = (byPaymentMethod[paymentMethod] ?? 0) + expense.amount;
  }

  return {
    exportedAt: new Date().toISOString(),
    period: {
      startDate: cycleRange.startDate,
      endDate: cycleRange.endDate,
      label: cycleRange.label,
      monthStartDay: financeCycleConfig.monthStartDay,
      weekRanges,
    },
    budget,
    weekBudgets,
    expenses: cycleExpenses,
    summary: {
      totalExpenses,
      remainingBudget: budget.totalBudget - totalExpenses,
      byCategory,
      byWeek,
      byPaymentMethod,
      transactionCount: cycleExpenses.length,
    },
  };
}

export function downloadJsonFile(payload: MonthlyExportPayload): void {
  const fileName = `finanzas-${payload.period.startDate}_${payload.period.endDate}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
