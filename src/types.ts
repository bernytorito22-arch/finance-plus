export type TransactionStatus = 'Completado' | 'Rechazado';
export type PaymentMethod = 'efectivo' | 'tarjeta';
export type TransactionType = 'gasto' | 'ingreso';

export interface Wallets {
  tarjeta: number;
  efectivo: number;
}

export interface WalletSplit {
  tarjeta: number;
  efectivo: number;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO string 2026-10-xx
  week: number; // 1, 2, 3, 4
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  type?: TransactionType;
}

export type MutationResult = { ok: true } | { ok: false; error: string };

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  icon: string; // Material Symbol icon name like house, flight
}

export interface MonthlyBudget {
  totalBudget: number;
  income: number;
}

export interface WeeklyBudgets {
  1: number;
  2: number;
  3: number;
  4: number;
}

export interface FinanceCycleConfig {
  monthStartDay: number;
}

export interface CycleRange {
  startDate: string;
  endDate: string;
  label: string;
  fileSlug: string;
}

export type WeekRangeStatus = 'completed' | 'current' | 'upcoming';

export interface WeekRange {
  week: 1 | 2 | 3 | 4;
  startDate: string;
  endDate: string;
  label: string;
  status: WeekRangeStatus;
}

export interface MonthlyExportSummary {
  totalExpenses: number;
  remainingBudget: number;
  byCategory: Record<string, number>;
  byWeek: Record<string, number>;
  byPaymentMethod: Record<string, number>;
  transactionCount: number;
}

export interface MonthlyExportPayload {
  exportedAt: string;
  period: {
    startDate: string;
    endDate: string;
    label: string;
    monthStartDay: number;
    weekRanges: WeekRange[];
  };
  budget: MonthlyBudget;
  weekBudgets: WeeklyBudgets;
  wallets: Wallets;
  walletSplit: WalletSplit;
  expenses: Expense[];
  summary: MonthlyExportSummary;
}
