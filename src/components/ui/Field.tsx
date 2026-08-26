import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import SectionLabel from "./SectionLabel";

export type FieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function Field({ label, children, className = "" }: FieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

const inputBase =
  "w-full bg-transparent border-0 border-b border-hairline pb-2.5 pt-1 text-paper placeholder:text-muted/60 focus:border-sage focus:ring-0 text-base";

export function TextInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputBase} ${className}`.trim()} {...props} />;
}

export function SelectInput({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${inputBase} ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}
