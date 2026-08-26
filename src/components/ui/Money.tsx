import { ReactNode } from "react";

interface MoneyProps {
  amount: number | string;
  prefix?: string;
  variant?: "default" | "hero" | "positive" | "negative";
  className?: string;
  showSign?: boolean;
}

function formatAmount(amount: number | string): string {
  if (typeof amount === "string") return amount;
  return amount.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Money({
  amount,
  prefix = "$",
  variant = "default",
  className = "",
  showSign = false,
}: MoneyProps) {
  const numericAmount = typeof amount === "number" ? amount : parseFloat(amount);
  const formatted = formatAmount(amount);
  const sign =
    showSign && !Number.isNaN(numericAmount)
      ? numericAmount > 0
        ? "+"
        : numericAmount < 0
          ? "−"
          : ""
      : "";

  const variantClasses: Record<typeof variant, string> = {
    default: "font-mono tabular-nums text-paper",
    hero: "font-serif tabular-nums text-paper",
    positive: "font-mono tabular-nums text-sage",
    negative: "font-mono tabular-nums text-paper",
  };

  return (
    <span className={`${variantClasses[variant]} ${className}`.trim()}>
      {sign}
      {prefix} {formatted.replace("-", "")}
    </span>
  );
}

export function MoneyRow({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between py-3 border-b border-hairline last:border-b-0 ${className}`}
    >
      <span className="text-sm text-muted">{label}</span>
      {children}
    </div>
  );
}
