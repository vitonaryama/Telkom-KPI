import React from "react";
import { RotateCcw, RefreshCw } from "lucide-react";

export default function TrendFilterBar({
  // Filter options dari master data
  months,
  years,
  regions,
  stos,
  kpis,

  // State terpilih
  selectedMonth,
  selectedYear,
  selectedRegion,
  selectedSto,
  selectedKpi,

  // Handlers
  onMonthChange,
  onYearChange,
  onRegionChange,
  onStoChange,
  onKpiChange,
  onReset,
  onRefresh,

  // Loading state
  isRefreshing
}) {
  return (
    <div className="flex flex-wrap xl:flex-nowrap items-end gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100/60 shadow-sm">
      {/* Month */}
      <div className="flex flex-col gap-1.5 w-full xl:w-[130px]">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Bulan</label>
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="h-10 w-full text-sm font-medium border border-slate-200 rounded-lg px-3 text-slate-700 bg-white shadow-sm hover:border-slate-300 hover:shadow focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all cursor-pointer"
        >
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Year */}
      <div className="flex flex-col gap-1.5 w-full xl:w-[110px]">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Tahun</label>
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value)}
          className="h-10 w-full text-sm font-medium border border-slate-200 rounded-lg px-3 text-slate-700 bg-white shadow-sm hover:border-slate-300 hover:shadow focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all cursor-pointer"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Region */}
      <div className="flex flex-col gap-1.5 w-full xl:w-[160px]">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Region</label>
        <select
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          className="h-10 w-full text-sm font-medium border border-slate-200 rounded-lg px-3 text-slate-700 bg-white shadow-sm hover:border-slate-300 hover:shadow focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all cursor-pointer"
        >
          <option value="All Region">All Region</option>
          {regions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* STO */}
      <div className="flex flex-col gap-1.5 w-full xl:w-[180px]">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1">STO</label>
        <select
          value={selectedSto}
          onChange={(e) => onStoChange(e.target.value)}
          disabled={selectedRegion === "All Region"}
          className={`h-10 w-full text-sm font-medium border rounded-lg px-3 shadow-sm transition-all focus:outline-none
            ${selectedRegion === "All Region" 
              ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200/60" 
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:shadow focus:border-red-500 focus:ring-4 focus:ring-red-500/10 cursor-pointer"}`}
        >
          <option value="Semua STO">Semua STO</option>
          {stos.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* KPI */}
      <div className="flex flex-col gap-1.5 w-full xl:w-[220px]">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Pilih KPI</label>
        <select
          value={selectedKpi}
          onChange={(e) => onKpiChange(e.target.value)}
          className="h-10 w-full text-sm font-medium border border-slate-200 rounded-lg px-3 text-slate-700 bg-white shadow-sm hover:border-slate-300 hover:shadow focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all cursor-pointer"
        >
          {kpis.map((kpi) => (
            <option key={kpi.key} value={kpi.key}>{kpi.label}</option>
          ))}
        </select>
      </div>

      <div className="w-px h-10 bg-slate-200 mx-2 hidden xl:block mb-0.5" />

      {/* Actions */}
      <div className="flex items-center gap-3 w-full xl:w-auto">
        <button
          onClick={onReset}
          className="h-10 flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all duration-200 active:scale-[0.98] shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-100"
          title="Reset semua filter"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-10 flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 text-sm font-semibold text-white bg-slate-900 border border-transparent rounded-lg hover:bg-slate-800 hover:shadow-md transition-all duration-200 active:scale-[0.98] shadow-sm disabled:opacity-70 disabled:cursor-wait focus:outline-none focus:ring-4 focus:ring-slate-900/20"
          title="Refresh chart data"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          <span>{isRefreshing ? "Memuat..." : "Refresh"}</span>
        </button>
      </div>
    </div>
  );
}
