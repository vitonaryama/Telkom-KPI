import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { TrendValue } from "./shared.jsx";
import { TARGETS } from "../data/mockData.js";

export default function ExpandableRow({ row, expanded, onToggle, stoLoading }) {
  const label = row.witel || row.area || "—";
  const metrics = row.metrics || {};
  const trend = row.trend || {};
  const stos = row.stos || [];

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            {label}
            {stos.length > 0 && (
              <span className="text-[11px] font-normal text-gray-400 bg-gray-200 rounded px-1.5 py-0.5">
                {stos.length} STO
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-sm"><TrendValue value={metrics.availability ?? 0} target={TARGETS.availability} trend={trend.availability} /></td>
        <td className="px-4 py-3 text-sm"><TrendValue value={metrics.assurance ?? 0} target={TARGETS.assurance} trend={trend.assurance} /></td>
        <td className="px-4 py-3 text-sm"><TrendValue value={metrics.ttr3 ?? 0} target={TARGETS.ttr3} trend={trend.ttr3} /></td>
        <td className="px-4 py-3 text-sm"><TrendValue value={metrics.ttr6Jam ?? 0} target={TARGETS.ttr6Jam} trend={trend.ttr6Jam} /></td>
        <td className="px-4 py-3 text-sm"><TrendValue value={metrics.ttr12Jam ?? 0} target={TARGETS.ttr12Jam} trend={trend.ttr12Jam} /></td>
        <td className="px-4 py-3 text-sm"><TrendValue value={metrics.ttr24Jam ?? 0} target={TARGETS.ttr24Jam} trend={trend.ttr24Jam} /></td>
        <td className="px-4 py-3 text-sm"><TrendValue value={metrics.ttr3JamM ?? 0} target={TARGETS.ttr3JamM} trend={trend.ttr3JamM} /></td>
        <td className="px-4 py-3 text-sm"><TrendValue value={metrics.sqm ?? 0} target={TARGETS.sqm} trend={trend.sqm} /></td>
      </tr>
      {expanded && stoLoading && (
        <tr className="border-b border-gray-100">
          <td colSpan={9} className="px-4 py-3 pl-11 text-xs text-gray-400 flex items-center gap-2">
            <Loader2 size={13} className="animate-spin inline" /> Memuat data STO...
          </td>
        </tr>
      )}
      {expanded && !stoLoading && stos.length === 0 && (
        <tr className="border-b border-gray-100">
          <td colSpan={9} className="px-4 py-2.5 pl-11 text-xs text-gray-400 italic">
            Data STO per area tidak tersedia.
          </td>
        </tr>
      )}
      {expanded &&
        stos.map((sto) => {
          const stoMetrics = sto.metrics || {};
          const stoTrend = sto.trend || {};
          return (
            <tr key={sto.nama} className="border-b border-gray-100 hover:bg-gray-50/60">
              <td className="px-4 py-2.5 pl-11 text-sm text-gray-600">{sto.nama}</td>
              <td className="px-4 py-2.5 text-sm"><TrendValue value={stoMetrics.availability ?? 0} target={TARGETS.availability} trend={stoTrend.availability} /></td>
              <td className="px-4 py-2.5 text-sm"><TrendValue value={stoMetrics.assurance ?? 0} target={TARGETS.assurance} trend={stoTrend.assurance} /></td>
              <td className="px-4 py-2.5 text-sm"><TrendValue value={stoMetrics.ttr3 ?? 0} target={TARGETS.ttr3} trend={stoTrend.ttr3} /></td>
              <td className="px-4 py-2.5 text-sm"><TrendValue value={stoMetrics.ttr6Jam ?? 0} target={TARGETS.ttr6Jam} trend={stoTrend.ttr6Jam} /></td>
              <td className="px-4 py-2.5 text-sm"><TrendValue value={stoMetrics.ttr12Jam ?? 0} target={TARGETS.ttr12Jam} trend={stoTrend.ttr12Jam} /></td>
              <td className="px-4 py-2.5 text-sm"><TrendValue value={stoMetrics.ttr24Jam ?? 0} target={TARGETS.ttr24Jam} trend={stoTrend.ttr24Jam} /></td>
              <td className="px-4 py-2.5 text-sm"><TrendValue value={stoMetrics.ttr3JamM ?? 0} target={TARGETS.ttr3JamM} trend={stoTrend.ttr3JamM} /></td>
              <td className="px-4 py-2.5 text-sm"><TrendValue value={stoMetrics.sqm ?? 0} target={TARGETS.sqm} trend={stoTrend.sqm} /></td>
            </tr>
          );
        })}
    </>
  );
}
