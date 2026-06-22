export type TransactionStatus = 'Completado' | 'Rechazado';
export type PaymentMethod = 'efectivo' | 'tarjeta';

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
}

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
