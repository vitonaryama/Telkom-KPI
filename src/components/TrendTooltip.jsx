import React from "react";

/**
 * TrendTooltip — Custom Recharts tooltip
 * Props (dari Recharts): active, payload, label
 * Props (custom):        kpiLabel, seriesColors
 */
export default function TrendTooltip({ active, payload, label, kpiLabel, seriesColors }) {
  if (!active || !payload || payload.length === 0) return null;

  const dataEntries = payload.filter((p) => p.dataKey !== "Target" && p.value != null);
  const targetEntry = payload.find((p) => p.dataKey === "Target");

  return (
    <div
      className="bg-white border border-gray-100 rounded-xl shadow-xl py-3 px-3.5 min-w-[170px]"
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
    >
      {/* Header */}
      <div className="mb-2 pb-2 border-b border-gray-100">
        <p className="text-[11px] font-bold text-gray-800 leading-tight">{label}</p>
        <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{kpiLabel}</p>
      </div>

      {/* Series values */}
      <div className="flex flex-col gap-1.5">
        {dataEntries.map((entry) => {
          const color = seriesColors?.[entry.dataKey] ?? entry.color ?? "#6366f1";
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[11px] text-gray-600 truncate">{entry.name}</span>
              </div>
              <span
                className="text-[11px] font-bold tabular-nums flex-shrink-0"
                style={{ color }}
              >
                {typeof entry.value === "number" ? `${entry.value.toFixed(1)}%` : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Target */}
      {targetEntry && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between gap-5">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-4 border-t-2 border-dashed border-gray-400 flex-shrink-0" />
            <span className="text-[11px] text-gray-400">Target</span>
          </div>
          <span className="text-[11px] font-bold text-gray-400 tabular-nums">
            {targetEntry.value}%
          </span>
        </div>
      )}
    </div>
  );
}
