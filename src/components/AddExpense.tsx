import React, { useState, useEffect } from "react";
import { CATEGORIES_CONFIG } from "../mockData";
import { Expense, PaymentMethod, TransactionType, Wallets } from "../types";
import { WeekNumber } from "../utils/week";
import { canAfford } from "../utils/wallet";
import { MutationResult } from "../types";
import SectionLabel from "./ui/SectionLabel";
import Button from "./ui/Button";
import { Field, TextInput, SelectInput } from "./ui/Field";

interface AddExpenseProps {
  onSaveExpense: (
    expense: Omit<Expense, "id" | "date" | "status"> & {
      date?: string;
      status?: "Completado" | "Rechazado";
    }
  ) => MutationResult;
  activeWeek?: WeekNumber;
  wallets: Wallets;
}

const textareaBase =
  "w-full bg-transparent border-0 border-b border-hairline pb-2.5 pt-1 text-paper placeholder:text-muted/60 focus:border-sage focus:ring-0 text-base resize-none";

const chipBase =
  "py-3 px-3 rounded-xl text-sm border transition-all cursor-pointer flex items-center justify-center gap-2";
const chipInactive =
  "bg-transparent border-hairline text-muted hover:border-muted hover:text-paper";
const chipActive = "bg-transparent border-sage text-paper";

export default function AddExpense({ onSaveExpense, activeWeek = 1, wallets }: AddExpenseProps) {
  const [entryType, setEntryType] = useState<TransactionType>("gasto");
  const [amount, setAmount] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [category, setCategory] = useState<string>("Seleccionar categoría");
  const [description, setDescription] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<number>(activeWeek);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    setSelectedWeek(activeWeek);
  }, [activeWeek]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setToastMessage("Por favor ingresa un monto válido mayor a 0.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    if (entryType === "gasto" && !name.trim()) {
      setToastMessage("El nombre del gasto es requerido.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    const catToSave = category === "Seleccionar categoría" ? "Otros" : category;

    if (entryType === "gasto" && !canAfford(wallets, paymentMethod, numericAmount)) {
      setToastMessage(`No tienes suficiente saldo en ${paymentMethod}.`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    const result = onSaveExpense({
      type: entryType,
      name: entryType === "ingreso" ? (name.trim() || "Ingreso") : name.trim(),
      amount: numericAmount,
      category: entryType === "ingreso" ? "Ingreso" : catToSave,
      description: description.trim(),
      week: selectedWeek,
      paymentMethod,
      date: new Date().toISOString(),
    });

    if (result.ok === false) {
      setToastMessage(result.error);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // Clear form and show success
    setAmount("");
    setName("");
    setCategory("Seleccionar categoría");
    setDescription("");
    setSelectedWeek(activeWeek);
    setPaymentMethod("efectivo");

    setToastMessage(entryType === "ingreso" ? "¡Ingreso guardado exitosamente!" : "¡Gasto guardado exitosamente!");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const isSuccessToast = toastMessage.includes("exitosamente");

  return (
    <div className="space-y-6">
      {showToast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl flex items-center gap-3 ${
            isSuccessToast
              ? "bg-surface-raised border border-hairline text-sage"
              : "bg-clay-surface border border-clay/30 text-clay"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {isSuccessToast ? "check_circle" : "info"}
          </span>
          <span className="text-sm">{toastMessage}</span>
        </div>
      )}

      <div>
        <h2 className="font-serif text-2xl font-semibold text-paper mb-1">
          {entryType === "gasto" ? "Añadir Gasto" : "Añadir Ingreso"}
        </h2>
        <p className="text-muted text-sm">
          {entryType === "gasto"
            ? "Registra tus movimientos financieros con precisión."
            : "Agrega dinero a tarjeta o efectivo sin afectar el presupuesto."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(["gasto", "ingreso"] as TransactionType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setEntryType(type)}
            className={`py-2.5 px-3 rounded-xl text-sm transition-all cursor-pointer capitalize ${
              entryType === type
                ? "bg-sage text-ink font-medium"
                : "border border-hairline text-muted hover:text-paper"
            }`}
          >
            {type === "gasto" ? "Gasto" : "Ingreso"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex flex-col items-center py-6 space-y-3">
          <SectionLabel>
            {entryType === "gasto" ? "Monto del Gasto" : "Monto del Ingreso"}
          </SectionLabel>
          <div className="flex items-baseline justify-center w-full max-w-[280px] gap-1">
            <span className="font-serif text-4xl sm:text-5xl text-sage select-none">$</span>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              className="bg-transparent border-none text-center font-serif text-4xl sm:text-5xl font-semibold text-paper w-full focus:ring-0 placeholder:text-muted/40 tabular-nums"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d*\.?\d*$/.test(val)) {
                  setAmount(val);
                }
              }}
              required
            />
          </div>
        </div>

        <div className="space-y-5 border-t border-hairline pt-6">
          <Field label={entryType === "gasto" ? "Nombre del gasto *" : "Nombre (opcional)"}>
            <TextInput
              type="text"
              placeholder={
                entryType === "gasto"
                  ? "Ej. Supermercado, Alquiler, Restaurante..."
                  : "Ej. Quincena, Transferencia..."
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={entryType === "gasto"}
            />
          </Field>

          {entryType === "gasto" && (
            <Field label="Categoría">
              <SelectInput
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Seleccionar categoría" disabled>
                  Seleccionar categoría
                </option>
                {CATEGORIES_CONFIG.map((catConfig) => (
                  <option key={catConfig.name} value={catConfig.name}>
                    {catConfig.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
          )}

          <div className="space-y-2">
            <SectionLabel>
              {entryType === "gasto" ? "Método de pago" : "Destino"}
            </SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "efectivo" as PaymentMethod, label: "Efectivo", icon: "payments" },
                  { value: "tarjeta" as PaymentMethod, label: "Tarjeta", icon: "credit_card" },
                ] as const
              ).map((method) => (
                <button
                  type="button"
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`${chipBase} ${
                    paymentMethod === method.value ? chipActive : chipInactive
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{method.icon}</span>
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {entryType === "gasto" && (
            <div className="space-y-2">
              <SectionLabel>Semana de Registro</SectionLabel>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((wk) => (
                  <button
                    type="button"
                    key={wk}
                    onClick={() => setSelectedWeek(wk)}
                    className={`py-2 px-2 rounded-xl text-xs border transition-all cursor-pointer font-mono ${
                      selectedWeek === wk
                        ? "border-sage text-paper"
                        : "border-hairline text-muted hover:border-muted hover:text-paper"
                    }`}
                  >
                    Semana {wk}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Field label="Descripción (Opcional)">
            <textarea
              className={textareaBase}
              placeholder="Detalles adicionales..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </div>

        <div className="pt-2 space-y-3">
          <Button type="submit" fullWidth className="py-4 text-base gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            {entryType === "gasto" ? "Guardar Gasto" : "Guardar Ingreso"}
          </Button>
          <p className="text-center font-mono text-xs text-muted">
            Los datos se cifran localmente antes de sincronizarse.
          </p>
        </div>
      </form>
    </div>
  );
}
