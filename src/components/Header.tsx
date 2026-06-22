import { useState } from "react";
import financeLogo from "../assets/images/finance_app_logo_1781383907195.jpg";

interface HeaderProps {
  appName?: string;
  avatarUrl?: string;
}

export default function Header({ appName = "Finance+", avatarUrl }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Fondo Casa alcanzó el 75% de la combinación esperada.", time: "Hace 10 min", read: false },
    { id: 2, text: "Gasto inusualmente bajo detectado en Alimentación esta semana.", time: "Hace 2 horas", read: false },
    { id: 3, text: "Alerta de Presupuesto: Has agotado el 44% de tu cuota mensual.", time: "Ayer", read: true },
  ]);

  const defaultAvatar = financeLogo;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#171f33]/60 backdrop-blur-xl border-b border-white/10 shadow-sm flex justify-between items-center px-6 py-3 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#2d3449] flex items-center justify-center overflow-hidden border border-white/20 select-none">
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
        <h1 className="font-sans text-xl font-bold tracking-tight text-[#4edea3] hover:opacity-90 cursor-pointer select-none">
          {appName}
        </h1>
      </div>

      <div className="relative">
        <button
          id="btn-notifications"
          onClick={() => setShowNotifications(!showNotifications)}
          className="material-symbols-outlined text-[#4edea3] hover:opacity-80 transition-opacity active:scale-95 duration-200 cursor-pointer relative p-1.5 rounded-full hover:bg-white/5"
        >
          notifications
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#0b1326] animate-pulse"></span>
          )}
        </button>

        {showNotifications && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowNotifications(false)}
            />
            <div className="absolute right-0 mt-2 w-80 bg-[#171f33] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all">
              <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-semibold text-[#dae2fd] text-sm">Notificaciones</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead} 
                    className="text-xs text-[#4edea3] hover:underline"
                  >
                    Marcar leídas
                  </button>
                )}
              </div>
              <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-[#bbcabf]">
                    No tienes notificaciones por el momento.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 transition-colors hover:bg-white/5 ${!notif.read ? 'bg-primary-container/5' : ''}`}
                    >
                      <p className="text-xs text-[#dae2fd] leading-relaxed">{notif.text}</p>
                      <span className="text-[10px] text-[#bbcabf] font-mono mt-1 block">{notif.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
