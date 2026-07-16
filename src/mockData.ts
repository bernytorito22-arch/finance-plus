import { Expense, MonthlyBudget, WalletSplit, WeeklyBudgets } from "./types";
import { WeekNumber } from "./utils/week";
import { buildDemoWallets } from "./utils/wallet";

function demoDate(daysAgo: number, hour = 12, minute = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export const INITIAL_BUDGET: MonthlyBudget = {
  totalBudget: 0,
  income: 0,
};

export const INITIAL_WEEK_BUDGETS: WeeklyBudgets = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
};

export const INITIAL_EXPENSES: Expense[] = [];

export const DEMO_BUDGET: MonthlyBudget = {
  totalBudget: 2500,
  income: 3200,
};

export const DEMO_WEEK_BUDGETS: WeeklyBudgets = {
  1: 600,
  2: 650,
  3: 625,
  4: 625,
};

export const DEMO_ACTIVE_WEEK: WeekNumber = 2;

export const DEMO_WALLET_SPLIT: WalletSplit = {
  tarjeta: 0,
  efectivo: 3200,
};

export const DEMO_EXPENSES: Expense[] = [
  {
    id: "demo_1",
    name: "Supermercado",
    amount: 92.4,
    category: "Alimentación",
    description: "",
    date: demoDate(18, 10, 30),
    week: 1,
    status: "Completado",
    paymentMethod: "tarjeta",
    type: "gasto",
  },
  {
    id: "demo_2",
    name: "Uber al trabajo",
    amount: 18.5,
    category: "Transporte",
    description: "",
    date: demoDate(16, 8, 15),
    week: 1,
    status: "Completado",
    paymentMethod: "tarjeta",
    type: "gasto",
  },
  {
    id: "demo_3",
    name: "Café y desayuno",
    amount: 12.75,
    category: "Alimentación",
    description: "",
    date: demoDate(14, 9, 0),
    week: 1,
    status: "Completado",
    paymentMethod: "efectivo",
    type: "gasto",
  },
  {
    id: "demo_4",
    name: "Renta apartamento",
    amount: 850,
    category: "Vivienda",
    description: "Pago mensual de alquiler correspondiente al mes en curso.",
    date: demoDate(10, 14, 0),
    week: 2,
    status: "Completado",
    paymentMethod: "tarjeta",
    type: "gasto",
  },
  {
    id: "demo_5",
    name: "Cena con amigos",
    amount: 45.9,
    category: "Ocio",
    description: "Restaurante italiano — compartimos entrada, pasta y postre. Incluye propina.",
    date: demoDate(8, 21, 30),
    week: 2,
    status: "Completado",
    paymentMethod: "tarjeta",
    type: "gasto",
  },
  {
    id: "demo_6",
    name: "Farmacia",
    amount: 24.3,
    category: "Salud",
    description: "",
    date: demoDate(6, 17, 45),
    week: 2,
    status: "Completado",
    paymentMethod: "efectivo",
    type: "gasto",
  },
  {
    id: "demo_7",
    name: "Gasolina",
    amount: 38,
    category: "Transporte",
    description: "",
    date: demoDate(4, 7, 20),
    week: 2,
    status: "Completado",
    paymentMethod: "tarjeta",
    type: "gasto",
  },
  {
    id: "demo_8",
    name: "Ropa deportiva",
    amount: 67.99,
    category: "Compras",
    description: "",
    date: demoDate(2, 16, 10),
    week: 2,
    status: "Completado",
    paymentMethod: "tarjeta",
    type: "gasto",
  },
  {
    id: "demo_9",
    name: "Mercado local",
    amount: 31.2,
    category: "Alimentación",
    description: "",
    date: demoDate(1, 11, 0),
    week: 3,
    status: "Completado",
    paymentMethod: "efectivo",
    type: "gasto",
  },
];

export const DEMO_WALLETS = buildDemoWallets(DEMO_WALLET_SPLIT, DEMO_EXPENSES);

// Reusable categories config
export const CATEGORIES_CONFIG = [
  { name: "Alimentación", icon: "restaurant", bgColor: "bg-primary/20", textColor: "text-primary", dotColor: "bg-primary" },
  { name: "Transporte", icon: "commute", bgColor: "bg-secondary/20", textColor: "text-secondary", dotColor: "bg-secondary" },
  { name: "Vivienda", icon: "home", bgColor: "bg-primary-container/20", textColor: "text-primary-container", dotColor: "bg-emerald-400" },
  { name: "Ocio", icon: "sports_esports", bgColor: "bg-tertiary-container/20", textColor: "text-tertiary", dotColor: "bg-tertiary" },
  { name: "Salud", icon: "vaccines", bgColor: "bg-red-500/10", textColor: "text-red-400", dotColor: "bg-red-400" },
  { name: "Compras", icon: "shopping_cart", bgColor: "bg-yellow-500/10", textColor: "text-yellow-400", dotColor: "bg-yellow-400" },
  { name: "Otros", icon: "more_horiz", bgColor: "bg-surface-container-highest", textColor: "text-on-surface-variant", dotColor: "bg-gray-400" }
];
