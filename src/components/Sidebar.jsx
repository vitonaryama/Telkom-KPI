import React from "react";
import { Gauge, FileUp, LogOut, Radio } from "lucide-react";

export default function Sidebar({ page, setPage, onLogout }) {
  const items = [
    { key: "dashboard", label: "Performance KPI", icon: Gauge },
    { key: "upload", label: "Upload Excel", icon: FileUp },
  ];
  return (
    <aside className="w-60 shrink-0 bg-slate-950 text-slate-300 flex flex-col min-h-screen">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
          <Radio size={18} className="text-white" />
        </div>
        <div className="leading-tight">
          <p className="font-bold text-white text-sm">Telkom Network</p>
          <p className="text-[11px] text-slate-500 tracking-wide">OPERATIONS</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ key, label, icon: Icon }) => {
          const active = page === key;
          return (
            <button
              key={key}
              onClick={() => setPage(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-red-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </nav>
      <button
        onClick={onLogout}
        className="mx-3 mb-4 flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-900 hover:text-slate-200 transition-colors"
      >
        <LogOut size={16} /> Keluar
      </button>
      <div className="px-5 py-3 border-t border-slate-800 text-[11px] text-slate-600">
        V. 2.4.0-Stable
      </div>
    </aside>
  );
}
