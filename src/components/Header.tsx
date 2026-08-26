import LedgerMark from "./ui/LedgerMark";

interface HeaderProps {
  appName?: string;
  isDemoMode?: boolean;
  onToggleDataMode?: () => void;
}

export default function Header({
  appName = "Finance+",
  isDemoMode = false,
  onToggleDataMode,
}: HeaderProps) {
  const plusIndex = appName.lastIndexOf("+");
  const nameWithoutPlus = plusIndex >= 0 ? appName.slice(0, plusIndex) : appName;
  const showPlus = plusIndex >= 0;

  return (
    <header className="safe-area-top fixed top-0 left-0 w-full z-50 bg-surface border-b border-hairline flex justify-between items-center px-4 sm:px-6 py-3 transition-all gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center overflow-hidden border border-hairline select-none shrink-0 p-1.5">
          <LedgerMark className="w-full h-full" />
        </div>
        <h1 className="font-serif text-xl font-semibold tracking-tight text-paper select-none truncate">
          {nameWithoutPlus}
          {showPlus && <span className="text-sage">+</span>}
        </h1>
      </div>

      {onToggleDataMode && (
        <button
          onClick={onToggleDataMode}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer active:scale-95 ${
            isDemoMode
              ? "border-sage text-sage bg-sage/10 hover:bg-sage/15"
              : "border-hairline text-muted hover:text-paper hover:border-muted"
          }`}
          title={isDemoMode ? "Cambiar a tus datos en blanco" : "Ver datos de ejemplo"}
        >
          <span className="material-symbols-outlined text-sm">
            {isDemoMode ? "edit_note" : "science"}
          </span>
          {isDemoMode ? "Mis datos" : "Demo"}
        </button>
      )}
    </header>
  );
}
