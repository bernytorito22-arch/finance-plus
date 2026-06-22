import { Expense, Goal, MonthlyBudget } from "./types";

export const INITIAL_BUDGET: MonthlyBudget = {
  totalBudget: 4250.00,
  income: 6120.00
};

export const INITIAL_GOALS: Goal[] = [
  {
    id: "g1",
    name: "Fondo Casa",
    target: 4000,
    current: 3000,
    icon: "house"
  },
  {
    id: "g2",
    name: "Viaje Japón",
    target: 2500,
    current: 800,
    icon: "flight"
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  // Semana 1 Expenses (Sum up to $1,240.50 exactly in total spent)
  {
    id: "w1-1",
    name: "Supermercado Central",
    amount: 154.20,
    category: "Alimentación",
    description: "Compra semanal de víveres",
    date: "2026-10-04T14:30:00Z",
    week: 1,
    status: "Rechazado"
  },
  {
    id: "w1-2",
    name: "Gasolinera Shell",
    amount: 65.00,
    category: "Transporte",
    description: "Carga de combustible",
    date: "2026-10-03T09:15:00Z",
    week: 1,
    status: "Completado"
  },
  {
    id: "w1-3",
    name: "La Parrilla de Juan",
    amount: 42.50,
    category: "Ocio",
    description: "Cena de fin de semana",
    date: "2026-10-02T21:00:00Z",
    week: 1,
    status: "Completado"
  },
  {
    id: "w1-4",
    name: "Alquiler y Servicios",
    amount: 600.00,
    category: "Vivienda",
    description: "Pago parcial de expensas y luz",
    date: "2026-10-01T08:00:00Z",
    week: 1,
    status: "Completado"
  },
  {
    id: "w1-5",
    name: "Suscripción Cloud y Software",
    amount: 28.80,
    category: "Otros",
    description: "Suscripciones mensuales recurrentes",
    date: "2026-10-01T10:15:00Z",
    week: 1,
    status: "Completado"
  },
  {
    id: "w1-6",
    name: "Zapatos Deportivos Nike",
    amount: 350.00,
    category: "Compras",
    description: "Equipamiento para correr",
    date: "2026-10-03T16:00:00Z",
    week: 1,
    status: "Completado"
  },
  // Semana 2 Expenses (Sum to $890.20 as in screens)
  {
    id: "w2-1",
    name: "Mercado Local y Carnicería",
    amount: 120.50,
    category: "Alimentación",
    description: "Carnes y verduras frescas",
    date: "2026-10-11T12:00:00Z",
    week: 2,
    status: "Completado"
  },
  {
    id: "w2-2",
    name: "Tarjeta de Metro",
    amount: 30.00,
    category: "Transporte",
    description: "Recarga abono mensual",
    date: "2026-10-08T08:30:00Z",
    week: 2,
    status: "Completado"
  },
  {
    id: "w2-3",
    name: "Suscripción Netflix & Spotify",
    amount: 25.00,
    category: "Ocio",
    description: "Egresos digitales entretenimiento",
    date: "2026-10-09T01:00:00Z",
    week: 2,
    status: "Completado"
  },
  {
    id: "w2-4",
    name: "Farmacia San Juan",
    amount: 85.00,
    category: "Salud",
    description: "Multivitamínicos y analgésicos",
    date: "2026-10-10T15:45:00Z",
    week: 2,
    status: "Completado"
  },
  {
    id: "w2-5",
    name: "Cena Sushi Premium",
    amount: 130.00,
    category: "Ocio",
    description: "Celebración especial",
    date: "2026-10-12T20:30:00Z",
    week: 2,
    status: "Completado"
  },
  {
    id: "w2-6",
    name: "Pago de Alquiler",
    amount: 500.00,
    category: "Vivienda",
    description: "Abono mensual arrendamiento",
    date: "2026-10-07T09:00:00Z",
    week: 2,
    status: "Completado"
  }
];

// Reusable categories config for selector and design accents
export const CATEGORIES_CONFIG = [
  { name: "Alimentación", icon: "restaurant", bgColor: "bg-primary/20", textColor: "text-primary", dotColor: "bg-primary" },
  { name: "Transporte", icon: "commute", bgColor: "bg-secondary/20", textColor: "text-secondary", dotColor: "bg-secondary" },
  { name: "Vivienda", icon: "home", bgColor: "bg-primary-container/20", textColor: "text-primary-container", dotColor: "bg-emerald-400" },
  { name: "Ocio", icon: "sports_esports", bgColor: "bg-tertiary-container/20", textColor: "text-tertiary", dotColor: "bg-tertiary" },
  { name: "Salud", icon: "vaccines", bgColor: "bg-red-500/10", textColor: "text-red-400", dotColor: "bg-red-400" },
  { name: "Compras", icon: "shopping_cart", bgColor: "bg-yellow-500/10", textColor: "text-yellow-400", dotColor: "bg-yellow-400" },
  { name: "Otros", icon: "more_horiz", bgColor: "bg-surface-container-highest", textColor: "text-on-surface-variant", dotColor: "bg-gray-400" }
];
