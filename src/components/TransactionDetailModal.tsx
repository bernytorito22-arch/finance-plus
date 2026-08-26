import { useState } from "react";
import { CATEGORIES_CONFIG } from "../mockData";
import { Expense, PaymentMethod } from "../types";
import { getTransactionType } from "../utils/wallet";
import type { MutationResult } from "../types";
import Money from "./ui/Money";
import SectionLabel from "./ui/SectionLabel";
import Row from "./ui/Row";
import Button from "./ui/Button";
import { Field, TextInput, SelectInput } from "./ui/Field";

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

const textareaBase =
  "w-full bg-transparent border-0 border-b border-hairline pb-2.5 pt-1 text-paper placeholder:text-muted/60 focus:border-sage focus:ring-0 text-base resize-none";

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
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/80"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-surface border border-hairline rounded-t-2xl sm:rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg text-paper">
            {isIngreso ? "Detalle de ingreso" : "Detalle de gasto"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-paper transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="text-center py-2 space-y-1">
          <Money
            amount={parseFloat(amount || "0")}
            variant={isIngreso ? "positive" : "hero"}
            showSign
            className="text-4xl font-semibold"
          />
          <p className="text-xs text-muted">{formatDate(transaction.date)}</p>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <Field label="Nombre">
              <TextInput
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Monto">
              <TextInput
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            {!isIngreso && (
              <Field label="Categoría">
                <SelectInput
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES_CONFIG.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </SelectInput>
              </Field>
            )}
            <div className="space-y-2">
              <SectionLabel>Método</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                {(["efectivo", "tarjeta"] as PaymentMethod[]).map((method) => (
                  <Button
                    key={method}
                    variant={paymentMethod === method ? "outline" : "ghost"}
                    onClick={() => setPaymentMethod(method)}
                    className="capitalize py-2"
                  >
                    {method}
                  </Button>
                ))}
              </div>
            </div>
            <Field label="Descripción">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className={textareaBase}
              />
            </Field>
          </div>
        ) : (
          <div>
            <Row>
              <span className="text-sm text-muted flex-1">Nombre</span>
              <span className="text-sm text-paper">{transaction.name}</span>
            </Row>
            {!isIngreso && (
              <Row>
                <span className="text-sm text-muted flex-1">Categoría</span>
                <span className="text-sm text-paper">{transaction.category}</span>
              </Row>
            )}
            <Row>
              <span className="text-sm text-muted flex-1">Método</span>
              <span className="text-sm text-paper capitalize">{transaction.paymentMethod ?? "efectivo"}</span>
            </Row>
            <Row>
              <span className="text-sm text-muted flex-1">Semana</span>
              <span className="text-sm text-paper">{transaction.week}</span>
            </Row>
            <Row noBorder>
              <span className="text-sm text-muted flex-1">Estado</span>
              <span className="text-sm text-paper">{transaction.status}</span>
            </Row>
            {transaction.description && (
              <p className="text-sm text-muted italic pt-2">"{transaction.description}"</p>
            )}
          </div>
        )}

        {error && <p className="text-xs text-clay">{error}</p>}

        <div className="flex flex-col gap-2 pt-2">
          {isEditing ? (
            <>
              <Button fullWidth onClick={handleSave}>
                Guardar
              </Button>
              <Button variant="ghost" fullWidth onClick={resetForm}>
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" fullWidth onClick={() => setIsEditing(true)}>
                Editar
              </Button>
              {onDelete && (
                <Button
                  variant="destructive"
                  fullWidth
                  onClick={() => {
                    const result = onDelete(transaction.id);
                    if (result.ok) {
                      onClose();
                    } else if (result.ok === false) {
                      setError(result.error);
                    }
                  }}
                >
                  Eliminar
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
