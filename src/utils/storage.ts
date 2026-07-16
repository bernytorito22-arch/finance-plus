import {
  DEMO_ACTIVE_WEEK,
  DEMO_BUDGET,
  DEMO_EXPENSES,
  DEMO_WALLET_SPLIT,
  DEMO_WALLETS,
  DEMO_WEEK_BUDGETS,
  INITIAL_BUDGET,
  INITIAL_EXPENSES,
  INITIAL_WEEK_BUDGETS,
} from "../mockData";
import {
  Expense,
  FinanceCycleConfig,
  MonthlyBudget,
  WalletSplit,
  Wallets,
  WeeklyBudgets,
} from "../types";
import { clampMonthStartDay, getSuggestedWeekOfMonth, WeekNumber } from "./week";
import { defaultSplitFromIncome, initWalletsFromSplit } from "./wallet";

export type DataMode = "demo" | "personal";

export interface UserSnapshot {
  expenses: Expense[];
  budget: MonthlyBudget;
  weekBudgets: WeeklyBudgets;
  activeWeek: WeekNumber;
  financeCycleConfig: FinanceCycleConfig;
  wallets: Wallets;
  walletSplit: WalletSplit;
}

const STORAGE_VERSION = "5";

export const DEFAULT_FINANCE_CYCLE_CONFIG: FinanceCycleConfig = {
  monthStartDay: 1,
};

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

function loadFinanceCycleConfig(): FinanceCycleConfig {
  const saved = readJson<FinanceCycleConfig>("finanzapro_user_cycle_config");
  if (!saved || typeof saved.monthStartDay !== "number") {
    return DEFAULT_FINANCE_CYCLE_CONFIG;
  }

  return {
    monthStartDay: clampMonthStartDay(saved.monthStartDay),
  };
}

function resolveWalletFields(
  budget: MonthlyBudget,
  wallets: Wallets | null,
  walletSplit: WalletSplit | null
): { wallets: Wallets; walletSplit: WalletSplit } {
  const split = walletSplit ?? defaultSplitFromIncome(budget.income);
  const resolvedWallets = wallets ?? initWalletsFromSplit(split);
  return { wallets: resolvedWallets, walletSplit: split };
}

export function getDemoSnapshot(): UserSnapshot {
  return {
    expenses: DEMO_EXPENSES,
    budget: DEMO_BUDGET,
    weekBudgets: DEMO_WEEK_BUDGETS,
    activeWeek: DEMO_ACTIVE_WEEK,
    financeCycleConfig: DEFAULT_FINANCE_CYCLE_CONFIG,
    wallets: DEMO_WALLETS,
    walletSplit: DEMO_WALLET_SPLIT,
  };
}

export function getEmptySnapshot(): UserSnapshot {
  const walletSplit = defaultSplitFromIncome(INITIAL_BUDGET.income);
  return {
    expenses: INITIAL_EXPENSES,
    budget: INITIAL_BUDGET,
    weekBudgets: INITIAL_WEEK_BUDGETS,
    activeWeek: getSuggestedWeekOfMonth(),
    financeCycleConfig: DEFAULT_FINANCE_CYCLE_CONFIG,
    wallets: initWalletsFromSplit(walletSplit),
    walletSplit,
  };
}

export function loadUserSnapshot(): UserSnapshot {
  const financeCycleConfig = loadFinanceCycleConfig();
  const budget = readJson<MonthlyBudget>("finanzapro_user_budget") ?? INITIAL_BUDGET;
  const walletsFromStorage = readJson<Wallets>("finanzapro_user_wallets");
  const walletSplitFromStorage = readJson<WalletSplit>("finanzapro_user_wallet_split");
  const { wallets, walletSplit } = resolveWalletFields(
    budget,
    walletsFromStorage,
    walletSplitFromStorage
  );

  return {
    expenses: readJson<Expense[]>("finanzapro_user_expenses") ?? INITIAL_EXPENSES,
    budget,
    weekBudgets: readJson<WeeklyBudgets>("finanzapro_user_week_budgets") ?? INITIAL_WEEK_BUDGETS,
    activeWeek: readJson<WeekNumber>("finanzapro_user_active_week")
      ?? getSuggestedWeekOfMonth(new Date(), financeCycleConfig.monthStartDay),
    financeCycleConfig,
    wallets,
    walletSplit,
  };
}

function saveUserSnapshot(snapshot: UserSnapshot) {
  writeJson("finanzapro_user_expenses", snapshot.expenses);
  writeJson("finanzapro_user_budget", snapshot.budget);
  writeJson("finanzapro_user_week_budgets", snapshot.weekBudgets);
  writeJson("finanzapro_user_active_week", snapshot.activeWeek);
  writeJson("finanzapro_user_cycle_config", snapshot.financeCycleConfig);
  writeJson("finanzapro_user_wallets", snapshot.wallets);
  writeJson("finanzapro_user_wallet_split", snapshot.walletSplit);
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

  const budget = legacyBudget ?? INITIAL_BUDGET;
  const walletSplit = defaultSplitFromIncome(budget.income);

  const snapshot: UserSnapshot = {
    expenses: legacyExpenses ?? INITIAL_EXPENSES,
    budget,
    weekBudgets: legacyWeekBudgets ?? INITIAL_WEEK_BUDGETS,
    activeWeek: legacyActiveWeek ?? getSuggestedWeekOfMonth(),
    financeCycleConfig: DEFAULT_FINANCE_CYCLE_CONFIG,
    wallets: initWalletsFromSplit(walletSplit),
    walletSplit,
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
  activeWeek: WeekNumber,
  financeCycleConfig: FinanceCycleConfig,
  wallets: Wallets,
  walletSplit: WalletSplit
): UserSnapshot {
  return {
    expenses,
    budget,
    weekBudgets,
    activeWeek,
    financeCycleConfig,
    wallets,
    walletSplit,
  };
}
