import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "ghost" | "destructive" | "outline";

export type ButtonProps = {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-sage text-ink hover:bg-sage-strong active:scale-[0.98] font-medium",
  ghost: "bg-transparent text-muted hover:text-paper active:opacity-80",
  destructive: "bg-transparent text-clay hover:text-clay/90 active:opacity-80",
  outline:
    "bg-transparent border border-hairline text-paper hover:border-muted active:opacity-80",
};

export default function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm transition-all duration-200",
        "disabled:opacity-40 disabled:pointer-events-none",
        variantClasses[variant],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
