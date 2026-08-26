import type { HTMLAttributes, ReactNode } from "react";

export type RowProps = {
  children: ReactNode;
  onClick?: () => void;
  noBorder?: boolean;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "onClick">;

export default function Row({
  children,
  onClick,
  className = "",
  noBorder = false,
  ...props
}: RowProps) {
  const borderClass = noBorder ? "" : "border-b border-hairline last:border-b-0";
  const interactiveClass = onClick ? "cursor-pointer active:opacity-80" : "";

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`flex items-center gap-3 py-3.5 ${borderClass} ${interactiveClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
