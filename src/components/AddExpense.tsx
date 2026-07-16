import React, { useState, useEffect } from "react";
import { CATEGORIES_CONFIG } from "../mockData";
import { Expense, PaymentMethod, TransactionType, Wallets } from "../types";
import { WeekNumber } from "../utils/week";
import { canAfford } from "../utils/wallet";
import { MutationResult } from "../types";

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

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#171f33] border border-[#4edea3]/30 text-[#dae2fd] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-[#4edea3]">info</span>
          <span className="text-sm font-sans">{toastMessage}</span>
        </div>
      )}

      {/* Hero Section */}
      <div>
        <h2 className="font-sans text-2xl font-bold text-[#dae2fd] mb-1">
          {entryType === "gasto" ? "Añadir Gasto" : "Añadir Ingreso"}
        </h2>
        <p className="text-[#bbcabf] font-sans text-sm">
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
            className={`py-2.5 px-3 rounded-xl font-sans text-sm border transition-all cursor-pointer capitalize ${
              entryType === type
                ? "bg-[#4edea3]/10 border-[#4edea3] text-[#4edea3]"
                : "bg-[#060e20] border-[#3c4a42] text-[#bbcabf] hover:border-[#bbcabf]/30"
            }`}
          >
            {type === "gasto" ? "Gasto" : "Ingreso"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Large Amount Input (Hero Input) */}
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 primary-gradient"></div>
          <label className="font-mono text-xs text-[#bbcabf] uppercase tracking-wider mb-2 select-none">
            {entryType === "gasto" ? "Monto del Gasto" : "Monto del Ingreso"}
          </label>
          <div className="flex items-baseline justify-center w-full max-w-[240px]">
            <span className="text-[#4edea3] font-sans text-5xl font-bold mr-1 select-none">$</span>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              className="bg-transparent border-none text-center font-sans text-5xl font-bold text-[#dae2fd] w-full focus:ring-0 placeholder:text-[#2d3449]"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                // Allow only decimal values
                const val = e.target.value;
                if (val === "" || /^\d*\.?\d*$/.test(val)) {
                  setAmount(val);
                }
              }}
              required
            />
          </div>
        </div>

        {/* Main Form Box */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          {/* Expense Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-sm font-semibold text-[#dae2fd] ml-1">
              {entryType === "gasto" ? "Nombre del gasto *" : "Nombre (opcional)"}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#bbcabf] text-xl select-none">
                shopping_cart
              </span>
              <input
                type="text"
                className="w-full bg-[#060e20] border border-[#3c4a42] rounded-xl py-3 pl-11 pr-4 text-sm text-[#dae2fd] transition-all focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3]/20"
                placeholder={entryType === "gasto" ? "Ej. Supermercado, Alquiler, Restaurante..." : "Ej. Quincena, Transferencia..."}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={entryType === "gasto"}
              />
            </div>
          </div>

          {entryType === "gasto" && (
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-sm font-semibold text-[#dae2fd] ml-1">
              Categoría
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#bbcabf] text-xl select-none">
                category
              </span>
              <select
                className="w-full bg-[#060e20] border border-[#3c4a42] rounded-xl py-3 pl-11 pr-10 text-sm text-[#dae2fd] transition-all appearance-none focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3]/20 cursor-pointer"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Seleccionar categoría" disabled>Seleccionar categoría</option>
                {CATEGORIES_CONFIG.map((catConfig) => (
                  <option key={catConfig.name} value={catConfig.name}>
                    {catConfig.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#bbcabf] pointer-events-none select-none text-xl">
                expand_more
              </span>
            </div>
          </div>
          )}

          {/* Payment Method */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-sm font-semibold text-[#dae2fd] ml-1">
              {entryType === "gasto" ? "Método de pago" : "Destino"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "efectivo" as PaymentMethod, label: "Efectivo", icon: "payments" },
                { value: "tarjeta" as PaymentMethod, label: "Tarjeta", icon: "credit_card" },
              ]).map((method) => (
                <button
                  type="button"
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`py-3 px-3 rounded-xl font-sans text-sm border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    paymentMethod === method.value
                      ? method.value === "efectivo"
                        ? "bg-[#4edea3]/10 border-[#4edea3] text-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.15)]"
                        : "bg-[#adc6ff]/10 border-[#adc6ff] text-[#adc6ff] shadow-[0_0_12px_rgba(173,198,255,0.15)]"
                      : "bg-[#060e20] border-[#3c4a42] text-[#bbcabf] hover:border-[#bbcabf]/30"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{method.icon}</span>
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {entryType === "gasto" && (
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-sm font-semibold text-[#dae2fd] ml-1">
              Semana de Registro
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((wk) => (
                <button
                  type="button"
                  key={wk}
                  onClick={() => setSelectedWeek(wk)}
                  className={`py-2 px-3 rounded-lg font-mono text-xs border transition-all cursor-pointer ${
                    selectedWeek === wk
                      ? "bg-[#4edea3]/10 border-[#4edea3] text-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.15)]"
                      : "bg-[#060e20] border-[#3c4a42] text-[#bbcabf] hover:border-[#bbcabf]/30"
                  }`}
                >
                  Semana {wk}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-sm font-semibold text-[#dae2fd] ml-1">
              Descripción (Opcional)
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-4 text-[#bbcabf] text-xl select-none">
                description
              </span>
              <textarea
                className="w-full bg-[#060e20] border border-[#3c4a42] rounded-xl py-3 pl-11 pr-4 text-sm text-[#dae2fd] transition-all resize-none focus:border-[#4edea3] focus:ring-1 focus:ring-[#4edea3]/20"
                placeholder="Detalles adicionales..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full primary-gradient text-[#003824] font-sans font-bold py-4 rounded-2xl shadow-[0_8px_24px_rgba(78,222,163,0.2)] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
          >
            <span className="material-symbols-outlined font-black">check_circle</span>
            {entryType === "gasto" ? "Guardar Gasto" : "Guardar Ingreso"}
          </button>
          <p className="text-center mt-3 font-mono text-xs text-[#bbcabf]">
            Los datos se cifran localmente antes de sincronizarse.
          </p>
        </div>
      </form>
    </div>
  );
}
