import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TrendValue } from "./shared.jsx";
import { TARGETS } from "../data/mockData.js";

export default function ExpandableRow({ row, expanded, onToggle }) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            {row.witel}
            <span className="text-[11px] font-normal text-gray-400 bg-gray-200 rounded px-1.5 py-0.5">
              {row.stos.length} STO
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm"><TrendValue value={row.metrics.availability} target={TARGETS.availability} trend={row.trend.availability} /></td>
        <td className="px-4 py-3 text-sm"><TrendValue value={row.metrics.assurance} target={TARGETS.assurance} trend={row.trend.assurance} /></td>
        <td className="px-4 py-3 text-sm"><TrendValue value={row.metrics.ttr3} target={TARGETS.ttr3} trend={row.trend.ttr3} /></td>
        <td className="px-4 py-3 text-sm"><TrendValue value={row.metrics.ttr6Jam} target={TARGETS.ttr6Jam} trend={row.trend.ttr3} /></td>
        <td className="px-4 py-3 text-sm"><TrendValue value={row.metrics.ttr12Jam} target={TARGETS.ttr12Jam} trend={row.trend.ttr3} /></td>
        <td className="px-4 py-3 text-sm"><TrendValue value={row.metrics.ttr24Jam} target={TARGETS.ttr24Jam} trend={row.trend.ttr3} /></td>
        <td className="px-4 py-3 text-sm"><TrendValue value={row.metrics.ttr3JamM} target={TARGETS.ttr3JamM} trend={row.trend.ttr3} /></td>
        <td className="px-4 py-3 text-sm"><TrendValue value={row.metrics.sqm} target={TARGETS.sqm} trend={row.trend.sqm} /></td>
      </tr>
      {expanded &&
        row.stos.map((sto) => (
          <tr key={sto.nama} className="border-b border-gray-100 hover:bg-gray-50/60">
            <td className="px-4 py-2.5 pl-11 text-sm text-gray-600">{sto.nama}</td>
            <td className="px-4 py-2.5 text-sm"><TrendValue value={sto.metrics.availability} target={TARGETS.availability} trend={sto.trend.availability} /></td>
            <td className="px-4 py-2.5 text-sm"><TrendValue value={sto.metrics.assurance} target={TARGETS.assurance} trend={sto.trend.assurance} /></td>
            <td className="px-4 py-2.5 text-sm"><TrendValue value={sto.metrics.ttr3} target={TARGETS.ttr3} trend={sto.trend.ttr3} /></td>
            <td className="px-4 py-2.5 text-sm"><TrendValue value={sto.metrics.ttr6Jam} target={TARGETS.ttr6Jam} trend={sto.trend.ttr3} /></td>
            <td className="px-4 py-2.5 text-sm"><TrendValue value={sto.metrics.ttr12Jam} target={TARGETS.ttr12Jam} trend={sto.trend.ttr3} /></td>
            <td className="px-4 py-2.5 text-sm"><TrendValue value={sto.metrics.ttr24Jam} target={TARGETS.ttr24Jam} trend={sto.trend.ttr3} /></td>
            <td className="px-4 py-2.5 text-sm"><TrendValue value={sto.metrics.ttr3JamM} target={TARGETS.ttr3JamM} trend={sto.trend.ttr3} /></td>
            <td className="px-4 py-2.5 text-sm"><TrendValue value={sto.metrics.sqm} target={TARGETS.sqm} trend={sto.trend.sqm} /></td>
          </tr>
        ))}
    </>
  );
}
