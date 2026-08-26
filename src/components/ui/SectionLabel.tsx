import type { ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  className?: string;
}

export default function SectionLabel({ children, className = "" }: SectionLabelProps) {
  return (
    <p
      className={`text-[10px] font-medium uppercase tracking-[0.14em] text-muted ${className}`.trim()}
    >
      {children}
    </p>
  );
}
