import React from "react";
import { Bell, Clock, User } from "lucide-react";

export default function Navbar({ title, subtitle, user }) {
  return (
    <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-base font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-5">
        <button className="text-gray-400 hover:text-gray-600 relative">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
        </button>
        <button className="text-gray-400 hover:text-gray-600">
          <Clock size={18} />
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <User size={16} className="text-red-600" />
          </div>
          <div className="leading-tight hidden sm:block">
            <p className="text-xs font-semibold text-gray-800">{user.name}</p>
            <p className="text-[11px] text-gray-400">{user.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
