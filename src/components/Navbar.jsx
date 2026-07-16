import { useState, useRef, useEffect } from "react";
import { Bell, Clock, User, X, CheckCircle2, AlertCircle } from "lucide-react";

/**
 * Navbar — header dengan notifikasi dropdown dan clock
 */
export default function Navbar({ title, subtitle, user, notifications = [] }) {
  const [showNotif, setShowNotif] = useState(false);
  const [showClock, setShowClock] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [readIds, setReadIds] = useState(new Set());
  const notifRef = useRef(null);
  const clockRef = useRef(null);

  // Update jam setiap detik
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (clockRef.current && !clockRef.current.contains(e.target)) setShowClock(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const clockStr = currentTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = currentTime.toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  return (
    <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-20">
      <div>
        <h1 className="text-base font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-5">
        {/* Notifikasi */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotif((s) => !s); setShowClock(false); }}
            className="text-gray-400 hover:text-gray-600 relative p-1"
            aria-label="Notifikasi"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">Notifikasi</span>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-red-600 hover:underline">
                      Tandai semua dibaca
                    </button>
                  )}
                  <button onClick={() => setShowNotif(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">Tidak ada notifikasi</div>
                ) : (
                  notifications.map((n) => {
                    const isRead = readIds.has(n.id);
                    return (
                      <button
                        key={n.id}
                        onClick={() => setReadIds((prev) => new Set([...prev, n.id]))}
                        className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors ${!isRead ? "bg-blue-50/50" : ""}`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {n.type === "error"
                            ? <AlertCircle size={15} className="text-red-500" />
                            : <CheckCircle2 size={15} className="text-emerald-500" />}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-800">{n.msg}</p>
                          {n.time && <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>}
                        </div>
                        {!isRead && <span className="ml-auto shrink-0 w-2 h-2 rounded-full bg-red-500 mt-1.5" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Jam real-time */}
        <div className="relative" ref={clockRef}>
          <button
            onClick={() => { setShowClock((s) => !s); setShowNotif(false); }}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Jam sekarang"
          >
            <Clock size={18} />
          </button>
          {showClock && (
            <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-gray-200 px-5 py-4 min-w-[160px] text-center">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{clockStr}</p>
              <p className="text-xs text-gray-400 mt-1">{dateStr}</p>
            </div>
          )}
        </div>

        {/* User info */}
        <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <User size={16} className="text-red-600" />
          </div>
          <div className="leading-tight hidden sm:block">
            <p className="text-xs font-semibold text-gray-800">{user?.name}</p>
            <p className="text-[11px] text-gray-400">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
