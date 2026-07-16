import { describe, expect, it } from "vitest";
import type { Expense, Wallets } from "../types";
import {
  applyEdit,
  applyTransaction,
  canAfford,
  getPaymentMethod,
  getTransactionType,
  initWalletsFromSplit,
  isValidSplit,
  revertTransaction,
} from "./wallet";

const baseWallets: Wallets = { tarjeta: 500, efectivo: 200 };

describe("getTransactionType", () => {
  it("defaults missing type to gasto", () => {
    expect(getTransactionType({})).toBe("gasto");
  });

  it("returns ingreso when set", () => {
    expect(getTransactionType({ type: "ingreso" })).toBe("ingreso");
  });
});

describe("getPaymentMethod", () => {
  it("defaults missing paymentMethod to efectivo", () => {
    expect(getPaymentMethod({})).toBe("efectivo");
  });

  it("returns tarjeta when set", () => {
    expect(getPaymentMethod({ paymentMethod: "tarjeta" })).toBe("tarjeta");
  });
});

describe("isValidSplit", () => {
  it("accepts any non-negative tarjeta and efectivo", () => {
    expect(isValidSplit({ tarjeta: 2048, efectivo: 740 })).toBe(true);
    expect(isValidSplit({ tarjeta: 700, efectivo: 200 })).toBe(true);
  });

  it("rejects negative amounts", () => {
    expect(isValidSplit({ tarjeta: -1, efectivo: 100 })).toBe(false);
    expect(isValidSplit({ tarjeta: 100, efectivo: -1 })).toBe(false);
  });
});

describe("initWalletsFromSplit", () => {
  it("copies split values into wallets", () => {
    expect(initWalletsFromSplit({ tarjeta: 700, efectivo: 300 })).toEqual({
      tarjeta: 700,
      efectivo: 300,
    });
  });
});

describe("canAfford", () => {
  it("returns true when balance covers amount", () => {
    expect(canAfford(baseWallets, "efectivo", 200)).toBe(true);
  });

  it("returns false when balance is insufficient", () => {
    expect(canAfford(baseWallets, "efectivo", 201)).toBe(false);
  });
});

describe("applyTransaction", () => {
  const gasto = (overrides: Partial<Expense> = {}) => ({
    type: "gasto" as const,
    amount: 50,
    paymentMethod: "efectivo" as const,
    ...overrides,
  });

  it("subtracts gasto from efectivo when affordable", () => {
    const result = applyTransaction(baseWallets, gasto({ amount: 50 }));
    expect(result).toEqual({ tarjeta: 500, efectivo: 150 });
  });

  it("returns null when gasto exceeds balance", () => {
    expect(applyTransaction(baseWallets, gasto({ amount: 201 }))).toBeNull();
  });

  it("adds ingreso to tarjeta", () => {
    const result = applyTransaction(baseWallets, {
      type: "ingreso",
      amount: 100,
      paymentMethod: "tarjeta",
    });
    expect(result).toEqual({ tarjeta: 600, efectivo: 200 });
  });

  it("treats legacy expense without type as gasto", () => {
    const result = applyTransaction(baseWallets, {
      amount: 10,
      paymentMethod: "efectivo",
    });
    expect(result).toEqual({ tarjeta: 500, efectivo: 190 });
  });
});

describe("revertTransaction", () => {
  it("adds back gasto to wallet", () => {
    const result = revertTransaction(
      { tarjeta: 500, efectivo: 150 },
      { type: "gasto", amount: 50, paymentMethod: "efectivo" }
    );
    expect(result).toEqual({ tarjeta: 500, efectivo: 200 });
  });

  it("subtracts ingreso from wallet when balance allows", () => {
    const result = revertTransaction(
      { tarjeta: 600, efectivo: 200 },
      { type: "ingreso", amount: 100, paymentMethod: "tarjeta" }
    );
    expect(result).toEqual({ tarjeta: 500, efectivo: 200 });
  });

  it("returns null when reverting ingreso would make balance negative", () => {
    const result = revertTransaction(
      { tarjeta: 50, efectivo: 200 },
      { type: "ingreso", amount: 100, paymentMethod: "tarjeta" }
    );
    expect(result).toBeNull();
  });
});

describe("applyEdit", () => {
  it("updates gasto amount when wallet allows", () => {
    const result = applyEdit(
      { tarjeta: 500, efectivo: 200 },
      { type: "gasto", amount: 50, paymentMethod: "efectivo" },
      { type: "gasto", amount: 80, paymentMethod: "efectivo" }
    );
    expect(result).toEqual({ tarjeta: 500, efectivo: 170 });
  });

  it("changes payment method by reverting and applying", () => {
    const result = applyEdit(
      { tarjeta: 500, efectivo: 150 },
      { type: "gasto", amount: 50, paymentMethod: "efectivo" },
      { type: "gasto", amount: 50, paymentMethod: "tarjeta" }
    );
    expect(result).toEqual({ tarjeta: 450, efectivo: 200 });
  });

  it("returns null when edit would overdraw wallet", () => {
    const result = applyEdit(
      { tarjeta: 500, efectivo: 100 },
      { type: "gasto", amount: 50, paymentMethod: "efectivo" },
      { type: "gasto", amount: 200, paymentMethod: "efectivo" }
    );
    expect(result).toBeNull();
  });
});
