import { useState } from "react";
import { CATEGORIES_CONFIG } from "../mockData";
import { Expense, PaymentMethod } from "../types";
import { getTransactionType } from "../utils/wallet";
import type { MutationResult } from "../types";

interface TransactionDetailModalProps {
  transaction: Expense;
  onClose: () => void;
  onSave: (expense: Expense) => MutationResult;
  onDelete?: (id: string) => MutationResult;
}

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const day = String(date.getDate()).padStart(2, "0");
    const month = months[date.getMonth()];
    const hours = String(date.getHours()).padStart(2, "0");
    const mins = String(date.getMinutes()).padStart(2, "0");
    return `${day} ${month}, ${hours}:${mins}`;
  } catch {
    return dateStr;
  }
}

export default function TransactionDetailModal({
  transaction,
  onClose,
  onSave,
  onDelete,
}: TransactionDetailModalProps) {
  const isIngreso = getTransactionType(transaction) === "ingreso";
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(transaction.name);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [category, setCategory] = useState(transaction.category);
  const [description, setDescription] = useState(transaction.description);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    transaction.paymentMethod ?? "efectivo"
  );

  const resetForm = () => {
    setName(transaction.name);
    setAmount(transaction.amount.toString());
    setCategory(transaction.category);
    setDescription(transaction.description);
    setPaymentMethod(transaction.paymentMethod ?? "efectivo");
    setError(null);
    setIsEditing(false);
  };

  const handleSave = () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Ingresa un monto válido mayor a 0.");
      return;
    }

    if (!isIngreso && !name.trim()) {
      setError("El nombre es requerido.");
      return;
    }

    const updated: Expense = {
      ...transaction,
      name: isIngreso ? (name.trim() || "Ingreso") : name.trim(),
      amount: numericAmount,
      category: isIngreso ? "Ingreso" : category,
      description: description.trim(),
      paymentMethod,
    };

    const result = onSave(updated);
    if (result.ok === false) {
      setError(result.error);
      return;
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#060e20]/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 space-y-5 animate-fade-in relative border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-sans text-lg font-bold text-[#dae2fd]">
            {isIngreso ? "Detalle de ingreso" : "Detalle de gasto"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#bbcabf] hover:text-white transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="text-center py-2">
          <p className={`font-sans text-4xl font-bold ${isIngreso ? "text-[#4edea3]" : "text-[#dae2fd]"}`}>
            {isIngreso ? "+" : "-"}${parseFloat(amount || "0").toFixed(2)}
          </p>
          <p className="font-mono text-xs text-[#bbcabf] mt-1">{formatDate(transaction.date)}</p>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="font-sans text-xs text-[#bbcabf]">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 bg-[#171f33]/70 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white"
              />
            </div>
            <div>
              <label className="font-sans text-xs text-[#bbcabf]">Monto</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full mt-1 bg-[#171f33]/70 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white"
              />
            </div>
            {!isIngreso && (
              <div>
                <label className="font-sans text-xs text-[#bbcabf]">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full mt-1 bg-[#171f33]/70 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white"
                >
                  {CATEGORIES_CONFIG.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="font-sans text-xs text-[#bbcabf]">Método</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {(["efectivo", "tarjeta"] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 rounded-xl text-sm border capitalize cursor-pointer ${
                      paymentMethod === method
                        ? "border-[#4edea3] text-[#4edea3] bg-[#4edea3]/10"
                        : "border-white/10 text-[#bbcabf]"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-sans text-xs text-[#bbcabf]">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full mt-1 bg-[#171f33]/70 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <p><span className="text-[#bbcabf]">Nombre:</span> <span className="text-[#dae2fd]">{transaction.name}</span></p>
            {!isIngreso && (
              <p><span className="text-[#bbcabf]">Categoría:</span> <span className="text-[#dae2fd]">{transaction.category}</span></p>
            )}
            <p><span className="text-[#bbcabf]">Método:</span> <span className="text-[#dae2fd] capitalize">{transaction.paymentMethod ?? "efectivo"}</span></p>
            <p><span className="text-[#bbcabf]">Semana:</span> <span className="text-[#dae2fd]">{transaction.week}</span></p>
            <p><span className="text-[#bbcabf]">Estado:</span> <span className="text-[#dae2fd]">{transaction.status}</span></p>
            {transaction.description && (
              <p className="text-[#bbcabf] italic">"{transaction.description}"</p>
            )}
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2 pt-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-white/5 border border-white/5 text-[#dae2fd] text-xs font-semibold py-2.5 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 bg-gradient-to-br from-[#4edea3] to-[#10b981] text-[#002113] text-xs font-bold py-2.5 rounded-xl cursor-pointer"
              >
                Guardar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-white/5 border border-white/5 text-[#dae2fd] text-xs font-semibold py-2.5 rounded-xl cursor-pointer"
              >
                Editar
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    const result = onDelete(transaction.id);
                    if (result.ok) {
                      onClose();
                    } else if (result.ok === false) {
                      setError(result.error);
                    }
                  }}
                  className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold py-2.5 rounded-xl cursor-pointer"
                >
                  Eliminar
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
