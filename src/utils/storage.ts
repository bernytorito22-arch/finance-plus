import {
  DEMO_ACTIVE_WEEK,
  DEMO_BUDGET,
  DEMO_EXPENSES,
  DEMO_WEEK_BUDGETS,
  INITIAL_BUDGET,
  INITIAL_EXPENSES,
  INITIAL_WEEK_BUDGETS,
} from "../mockData";
import { Expense, MonthlyBudget, WeeklyBudgets } from "../types";
import { getSuggestedWeekOfMonth, WeekNumber } from "./week";

export type DataMode = "demo" | "personal";

export interface UserSnapshot {
  expenses: Expense[];
  budget: MonthlyBudget;
  weekBudgets: WeeklyBudgets;
  activeWeek: WeekNumber;
}

const STORAGE_VERSION = "3";

function readJson<T>(key: string): T | null {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getDemoSnapshot(): UserSnapshot {
  return {
    expenses: DEMO_EXPENSES,
    budget: DEMO_BUDGET,
    weekBudgets: DEMO_WEEK_BUDGETS,
    activeWeek: DEMO_ACTIVE_WEEK,
  };
}

export function getEmptySnapshot(): UserSnapshot {
  return {
    expenses: INITIAL_EXPENSES,
    budget: INITIAL_BUDGET,
    weekBudgets: INITIAL_WEEK_BUDGETS,
    activeWeek: getSuggestedWeekOfMonth(),
  };
}

export function loadUserSnapshot(): UserSnapshot {
  return {
    expenses: readJson<Expense[]>("finanzapro_user_expenses") ?? INITIAL_EXPENSES,
    budget: readJson<MonthlyBudget>("finanzapro_user_budget") ?? INITIAL_BUDGET,
    weekBudgets: readJson<WeeklyBudgets>("finanzapro_user_week_budgets") ?? INITIAL_WEEK_BUDGETS,
    activeWeek: readJson<WeekNumber>("finanzapro_user_active_week") ?? getSuggestedWeekOfMonth(),
  };
}

function saveUserSnapshot(snapshot: UserSnapshot) {
  writeJson("finanzapro_user_expenses", snapshot.expenses);
  writeJson("finanzapro_user_budget", snapshot.budget);
  writeJson("finanzapro_user_week_budgets", snapshot.weekBudgets);
  writeJson("finanzapro_user_active_week", snapshot.activeWeek);
}

function migrateLegacyStorage(): UserSnapshot | null {
  const version = localStorage.getItem("finanzapro_storage_version");
  if (version !== "2") return null;

  const legacyExpenses = readJson<Expense[]>("finanzapro_expenses");
  const legacyBudget = readJson<MonthlyBudget>("finanzapro_budget");
  const legacyWeekBudgets = readJson<WeeklyBudgets>("finanzapro_week_budgets");
  const legacyActiveWeek = readJson<WeekNumber>("finanzapro_active_week");

  const hasLegacyData = Boolean(
    (legacyExpenses && legacyExpenses.length > 0) ||
    (legacyBudget && (legacyBudget.totalBudget > 0 || legacyBudget.income > 0)) ||
    (legacyWeekBudgets && Object.values(legacyWeekBudgets).some((value) => value > 0))
  );

  if (!hasLegacyData) return null;

  const snapshot: UserSnapshot = {
    expenses: legacyExpenses ?? INITIAL_EXPENSES,
    budget: legacyBudget ?? INITIAL_BUDGET,
    weekBudgets: legacyWeekBudgets ?? INITIAL_WEEK_BUDGETS,
    activeWeek: legacyActiveWeek ?? getSuggestedWeekOfMonth(),
  };

  saveUserSnapshot(snapshot);
  return snapshot;
}

export function initializeAppData(): { mode: DataMode; snapshot: UserSnapshot } {
  localStorage.setItem("finanzapro_storage_version", STORAGE_VERSION);

  const savedMode = localStorage.getItem("finanzapro_data_mode");
  if (savedMode === "demo") {
    return { mode: "demo", snapshot: getDemoSnapshot() };
  }

  if (savedMode === "personal") {
    return { mode: "personal", snapshot: loadUserSnapshot() };
  }

  const migratedSnapshot = migrateLegacyStorage();
  if (migratedSnapshot) {
    localStorage.setItem("finanzapro_data_mode", "personal");
    return { mode: "personal", snapshot: migratedSnapshot };
  }

  localStorage.setItem("finanzapro_data_mode", "demo");
  return { mode: "demo", snapshot: getDemoSnapshot() };
}

export function persistDataMode(mode: DataMode) {
  localStorage.setItem("finanzapro_data_mode", mode);
}

export function persistUserSnapshot(snapshot: UserSnapshot) {
  saveUserSnapshot(snapshot);
}

export function createSnapshot(
  expenses: Expense[],
  budget: MonthlyBudget,
  weekBudgets: WeeklyBudgets,
  activeWeek: WeekNumber
): UserSnapshot {
  return { expenses, budget, weekBudgets, activeWeek };
}
