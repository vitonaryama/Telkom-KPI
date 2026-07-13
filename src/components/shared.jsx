import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

/* =========================================================================
   SMALL SHARED HELPERS
   ========================================================================= */

export const fmtPct = (n) => `${n.toFixed(1)}%`;

export function TrendValue({ value, target, trend }) {
  const comply = value >= target;
  const color = comply ? "text-emerald-600" : "text-red-600";
  const Arrow = trend === "up" ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${color}`}>
      {fmtPct(value)}
      <Arrow size={12} strokeWidth={2.5} />
    </span>
  );
}

export function KpiCard({ label, value, target, unit = "%" }) {
  const comply = value >= target;
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-1 shadow-sm">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value.toFixed(1)}{unit}</span>
      <span
        className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide ${
          comply ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
        }`}
      >
        {comply ? "COMPLY" : "NOT COMPLY"}
      </span>
    </div>
  );
}
