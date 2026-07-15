import React from "react";

export default function TrendLegend({ payload, hiddenLines, onToggle }) {
  // Hanya tampilkan legend untuk data series, jangan target (target akan tetap)
  const seriesPayload = payload?.filter((entry) => entry.dataKey !== "Target") || [];

  if (seriesPayload.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-4 px-4">
      {seriesPayload.map((entry) => {
        const isHidden = hiddenLines.has(entry.dataKey);
        return (
          <button
            key={entry.dataKey}
            onClick={() => onToggle(entry.dataKey)}
            className="flex items-center gap-2 group transition-opacity duration-200"
            style={{ opacity: isHidden ? 0.4 : 1 }}
          >
            <span
              className="inline-block w-3 h-3 rounded-sm transition-transform group-hover:scale-110"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
              {entry.value}
            </span>
          </button>
        );
      })}
    </div>
  );
}
