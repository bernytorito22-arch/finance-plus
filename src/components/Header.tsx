import financeLogo from "../assets/images/finance_app_logo_1781383907195.jpg";

interface HeaderProps {
  appName?: string;
  avatarUrl?: string;
  isDemoMode?: boolean;
  onToggleDataMode?: () => void;
}

export default function Header({
  appName = "Finance+",
  avatarUrl,
  isDemoMode = false,
  onToggleDataMode,
}: HeaderProps) {
  const defaultAvatar = financeLogo;

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#171f33]/60 backdrop-blur-xl border-b border-white/10 shadow-sm flex justify-between items-center px-4 sm:px-6 py-3 transition-all gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-[#2d3449] flex items-center justify-center overflow-hidden border border-white/20 select-none shrink-0">
          <img
            alt="Logo"
            className="w-full h-full object-cover"
            src={avatarUrl || defaultAvatar}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultAvatar;
            }}
          />
        </div>
        <h1 className="font-sans text-xl font-bold tracking-tight text-[#4edea3] hover:opacity-90 cursor-pointer select-none truncate">
          {appName}
        </h1>
      </div>

      {onToggleDataMode && (
        <button
          onClick={onToggleDataMode}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 ${
            isDemoMode
              ? "bg-[#4edea3]/10 border-[#4edea3]/40 text-[#4edea3] hover:bg-[#4edea3]/20"
              : "bg-white/5 border-white/10 text-[#bbcabf] hover:text-[#dae2fd] hover:bg-white/10"
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
