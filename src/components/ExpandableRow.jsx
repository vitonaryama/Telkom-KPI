import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { TrendValue } from "./shared.jsx";
import { TARGETS } from "../data/mockData.js";

const KPI_NAMES = {
  availability: "Service Availability",
  assurance: "Assurance Guarantee",
  ttr3: "TTR 3 Diamond",
  ttr6Jam: "TTR 6 Platinum",
  ttr12Jam: "TTR 12 Gold",
  ttr24Jam: "TTR 24 Non HVC",
  ttr3JamM: "TTR 3 Manja",
  sqm: "SQM Close"
};

export default function ExpandableRow({ row, expanded, onToggle, stoLoading, onCellClick }) {
  const label = row.witel || row.area || "—";
  const metrics = row.metrics || {};
  const trend = row.trend || {};
  const stos = row.stos || [];

  const handleCellClick = (e, key, sto = null) => {
    e.stopPropagation();
    if (onCellClick) {
      onCellClick({
        kpiName: KPI_NAMES[key],
        area: label,
        sto: sto
      });
    }
  };

  const Cell = ({ kpiKey, m, t, sto = null, isAreaRow = false }) => (
    <td 
      className={`px-4 ${isAreaRow ? 'py-3' : 'py-2.5'} text-sm cursor-pointer hover:bg-gray-200 transition-colors group`}
      onClick={(e) => handleCellClick(e, kpiKey, sto)}
      title={`Klik untuk melihat detail tiket problem ${KPI_NAMES[kpiKey]}`}
    >
      <TrendValue value={m[kpiKey] ?? 0} target={TARGETS[kpiKey]} trend={t[kpiKey]} />
    </td>
  );

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
        <Cell kpiKey="availability" m={metrics} t={trend} isAreaRow={true} />
        <Cell kpiKey="assurance" m={metrics} t={trend} isAreaRow={true} />
        <Cell kpiKey="ttr3" m={metrics} t={trend} isAreaRow={true} />
        <Cell kpiKey="ttr6Jam" m={metrics} t={trend} isAreaRow={true} />
        <Cell kpiKey="ttr12Jam" m={metrics} t={trend} isAreaRow={true} />
        <Cell kpiKey="ttr24Jam" m={metrics} t={trend} isAreaRow={true} />
        <Cell kpiKey="ttr3JamM" m={metrics} t={trend} isAreaRow={true} />
        <Cell kpiKey="sqm" m={metrics} t={trend} isAreaRow={true} />
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
          // Ekstrak nama asli STO (hilangkan kata 'STO ' di depannya)
          const stoId = sto.nama.replace("STO ", "");
          return (
            <tr key={sto.nama} className="border-b border-gray-100 hover:bg-gray-50/60">
              <td className="px-4 py-2.5 pl-11 text-sm text-gray-600">{sto.nama}</td>
              <Cell kpiKey="availability" m={stoMetrics} t={stoTrend} sto={stoId} />
              <Cell kpiKey="assurance" m={stoMetrics} t={stoTrend} sto={stoId} />
              <Cell kpiKey="ttr3" m={stoMetrics} t={stoTrend} sto={stoId} />
              <Cell kpiKey="ttr6Jam" m={stoMetrics} t={stoTrend} sto={stoId} />
              <Cell kpiKey="ttr12Jam" m={stoMetrics} t={stoTrend} sto={stoId} />
              <Cell kpiKey="ttr24Jam" m={stoMetrics} t={stoTrend} sto={stoId} />
              <Cell kpiKey="ttr3JamM" m={stoMetrics} t={stoTrend} sto={stoId} />
              <Cell kpiKey="sqm" m={stoMetrics} t={stoTrend} sto={stoId} />
            </tr>
          );
        })}
    </>
  );
}
