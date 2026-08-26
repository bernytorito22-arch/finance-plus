interface LedgerMarkProps {
  className?: string;
  title?: string;
}

/** Ledger Fold: F as book spine + cover, sage bookmark with plus. */
export default function LedgerMark({ className = "", title = "Finance+" }: LedgerMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {/* Bookmark behind the middle arm */}
      <path fill="#6B7A5A" d="M40 14h9v30.5L44.5 50 40 44.5V14Z" />
      <path
        fill="#16130F"
        fillRule="evenodd"
        d="M43.1 31.2h2.8v1.5h-2.8v2.8h-1.5v-2.8h-2.8v-1.5h2.8v-2.8h1.5v2.8Z"
        clipRule="evenodd"
      />
      {/* Spine */}
      <rect x="16" y="12" width="12" height="40" rx="2" fill="#F2EDE4" />
      {/* Top cover */}
      <rect x="16" y="12" width="30" height="11" rx="2" fill="#F2EDE4" />
      {/* Middle arm of F */}
      <rect x="28" y="31" width="16" height="8" rx="1.25" fill="#F2EDE4" />
      {/* Page lines */}
      <path
        stroke="#16130F"
        strokeWidth="1.1"
        strokeLinecap="round"
        d="M20 14.6h20M20 17.1h20M20 19.6h16"
      />
    </svg>
  );
}
