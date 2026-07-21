import { RotateCcw, RefreshCw } from "lucide-react";

const BULAN_NAMES = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

/**
 * TrendFilterBar — Filter untuk Trend Monitoring
 * Filter: Granularitas (Mingguan/Bulanan/Semua), Bulan, Tahun, Region, STO, KPI
 */
export default function TrendFilterBar({
  regions,
  stos,
  kpis,
  availableYears,   // [2024, 2025, 2026, ...]

  selectedGranularity,
  selectedYear,
  selectedMonth,
  selectedRegion,
  selectedSto,
  selectedKpi,

  onGranularityChange,
  onYearChange,
  onMonthChange,
  onRegionChange,
  onStoChange,
  onKpiChange,
  onReset,
  onRefresh,

  isRefreshing,
  dataMode,       // "real" | "mock" | "loading" | "empty"
  batchCount,
}) {
  const modeLabel = {
    real:    { text: "Real Data",   dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    mock:    { text: "Mock Data",   dot: "bg-yellow-500",  cls: "bg-yellow-50  text-yellow-700  border-yellow-200" },
    loading: { text: "Memuat...",   dot: "bg-blue-400 animate-pulse", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    empty:   { text: "Tidak ada data", dot: "bg-gray-400", cls: "bg-gray-50 text-gray-600 border-gray-200" },
  }[dataMode] || { text: "", dot: "", cls: "" };

  return (
    <div className="space-y-3">
      {/* Status badge */}
      {modeLabel.text && (
        <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${modeLabel.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${modeLabel.dot}`} />
          {modeLabel.text}
          {dataMode === "real" && batchCount > 0 && (
            <span className="opacity-70">({batchCount} data)</span>
          )}
        </div>
      )}

      <div className="flex flex-wrap xl:flex-nowrap items-end gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100/60 shadow-sm">

        {/* Granularitas */}
        <div className="flex flex-col gap-1.5 w-full xl:w-[160px]">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Granularitas</label>
          <select
            value={selectedGranularity}
            onChange={(e) => onGranularityChange(e.target.value)}
            className="h-10 w-full text-sm font-medium border border-slate-200 rounded-lg px-3 text-slate-700 bg-white shadow-sm hover:border-slate-300 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all cursor-pointer"
          >
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
            <option value="all">Semua Periode</option>
          </select>
        </div>

        {/* Tahun */}
        <div className="flex flex-col gap-1.5 w-full xl:w-[110px]">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Tahun</label>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="h-10 w-full text-sm font-medium border border-slate-200 rounded-lg px-3 text-slate-700 bg-white shadow-sm hover:border-slate-300 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all cursor-pointer"
          >
            <option value={0}>Semua</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Bulan */}
        <div className="flex flex-col gap-1.5 w-full xl:w-[140px]">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Bulan</label>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(parseInt(e.target.value))}
            disabled={selectedGranularity === "monthly" ? false : selectedYear === 0}
            className={`h-10 w-full text-sm font-medium border rounded-lg px-3 shadow-sm transition-all focus:outline-none
              ${selectedYear === 0 && selectedGranularity !== "monthly"
                ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200/60"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 cursor-pointer"}`}
          >
            <option value={0}>Semua</option>
            {BULAN_NAMES.map((b, i) => <option key={i+1} value={i+1}>{b}</option>)}
          </select>
        </div>

        <div className="w-px h-10 bg-slate-200 mx-1 hidden xl:block mb-0.5" />

        {/* Region */}
        <div className="flex flex-col gap-1.5 w-full xl:w-[150px]">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Region</label>
          <select
            value={selectedRegion}
            onChange={(e) => onRegionChange(e.target.value)}
            className="h-10 w-full text-sm font-medium border border-slate-200 rounded-lg px-3 text-slate-700 bg-white shadow-sm hover:border-slate-300 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all cursor-pointer"
          >
            <option value="All Region">All Region</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* STO */}
        <div className="flex flex-col gap-1.5 w-full xl:w-[160px]">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1">STO</label>
          <select
            value={selectedSto}
            onChange={(e) => onStoChange(e.target.value)}
            disabled={selectedRegion === "All Region"}
            className={`h-10 w-full text-sm font-medium border rounded-lg px-3 shadow-sm transition-all focus:outline-none
              ${selectedRegion === "All Region"
                ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200/60"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 cursor-pointer"}`}
          >
            <option value="Semua STO">Semua STO</option>
            {stos.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* KPI */}
        <div className="flex flex-col gap-1.5 w-full xl:flex-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Pilih KPI</label>
          <select
            value={selectedKpi}
            onChange={(e) => onKpiChange(e.target.value)}
            className="h-10 w-full text-sm font-medium border border-slate-200 rounded-lg px-3 text-slate-700 bg-white shadow-sm hover:border-slate-300 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all cursor-pointer"
          >
            {kpis.map(kpi => <option key={kpi.key} value={kpi.key}>{kpi.label}</option>)}
          </select>
        </div>

        <div className="w-px h-10 bg-slate-200 mx-1 hidden xl:block mb-0.5" />

        {/* Actions */}
        <div className="flex items-center gap-2 w-full xl:w-auto shrink-0">
          <button
            onClick={onReset}
            className="h-10 flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-[0.98] shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-100"
            title="Reset semua filter"
          >
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-10 flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all active:scale-[0.98] shadow-sm disabled:opacity-70 disabled:cursor-wait focus:outline-none focus:ring-4 focus:ring-slate-900/20"
            title="Refresh data"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Memuat..." : "Refresh"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
