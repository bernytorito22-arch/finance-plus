import { Expense, PaymentMethod, TransactionType, WalletSplit, Wallets } from "../types";

const SPLIT_TOLERANCE = 0.01;

export function getTransactionType(tx: Pick<Expense, "type">): TransactionType {
  return tx.type ?? "gasto";
}

export function getPaymentMethod(tx: Pick<Expense, "paymentMethod">): PaymentMethod {
  return tx.paymentMethod ?? "efectivo";
}

export function isValidSplit(split: WalletSplit, income: number): boolean {
  if (split.tarjeta < 0 || split.efectivo < 0) {
    return false;
  }

  return Math.abs(split.tarjeta + split.efectivo - income) <= SPLIT_TOLERANCE;
}

export function defaultSplitFromIncome(income: number): WalletSplit {
  return { tarjeta: 0, efectivo: income };
}

export function initWalletsFromSplit(split: WalletSplit): Wallets {
  return { tarjeta: split.tarjeta, efectivo: split.efectivo };
}

export function canAfford(
  wallets: Wallets,
  method: PaymentMethod,
  amount: number
): boolean {
  return wallets[method] >= amount;
}

export function applyTransaction(
  wallets: Wallets,
  tx: Pick<Expense, "type" | "amount" | "paymentMethod">
): Wallets | null {
  const type = getTransactionType(tx);
  const method = getPaymentMethod(tx);

  if (type === "ingreso") {
    return {
      ...wallets,
      [method]: wallets[method] + tx.amount,
    };
  }

  if (!canAfford(wallets, method, tx.amount)) {
    return null;
  }

  return {
    ...wallets,
    [method]: wallets[method] - tx.amount,
  };
}

export function revertTransaction(
  wallets: Wallets,
  tx: Pick<Expense, "type" | "amount" | "paymentMethod">
): Wallets | null {
  const type = getTransactionType(tx);
  const method = getPaymentMethod(tx);

  if (type === "gasto") {
    return {
      ...wallets,
      [method]: wallets[method] + tx.amount,
    };
  }

  if (wallets[method] < tx.amount) {
    return null;
  }

  return {
    ...wallets,
    [method]: wallets[method] - tx.amount,
  };
}

export function applyEdit(
  wallets: Wallets,
  before: Pick<Expense, "type" | "amount" | "paymentMethod">,
  after: Pick<Expense, "type" | "amount" | "paymentMethod">
): Wallets | null {
  const reverted = revertTransaction(wallets, before);
  if (!reverted) {
    return null;
  }

  return applyTransaction(reverted, after);
}

export function buildDemoWallets(
  split: WalletSplit,
  expenses: Expense[]
): Wallets {
  return expenses.reduce<Wallets>((current, expense) => {
    const next = applyTransaction(current, {
      type: getTransactionType(expense),
      amount: expense.amount,
      paymentMethod: getPaymentMethod(expense),
    });
    return next ?? current;
  }, initWalletsFromSplit(split));
}
