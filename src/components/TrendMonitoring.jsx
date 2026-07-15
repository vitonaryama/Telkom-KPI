import React, { useState, useMemo, useEffect, useCallback } from "react";
import TrendChart from "./TrendChart.jsx";
import TrendFilterBar from "./TrendFilterBar.jsx";
import { KpiCard, Skeleton } from "./shared.jsx";
import { 
  TREND_RAW_DATA, TREND_MONTHS, STO_MAP, REGION_COLORS, KPI_OPTIONS 
} from "../data/mockData.js";

const INDO_MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const MONTH_MAP = {
  "Januari": "Jan", "Februari": "Feb", "Maret": "Mar", "April": "Apr",
  "Mei": "May", "Juni": "Jun", "Juli": "Jul", "Agustus": "Aug",
  "September": "Sep", "Oktober": "Oct", "November": "Nov", "Desember": "Dec"
};
const REVERSE_MONTH_MAP = Object.fromEntries(Object.entries(MONTH_MAP).map(([k, v]) => [v, k]));

const defaultMonthEng = TREND_MONTHS[0].split(" ")[0]; // "Oct"
const defaultYear = TREND_MONTHS[0].split(" ")[1]; // "2024"
const defaultMonthIndo = REVERSE_MONTH_MAP[defaultMonthEng] || "Oktober";

const AVAILABLE_YEARS = Array.from(new Set(TREND_MONTHS.map(m => m.split(" ")[1])));

export default function TrendMonitoring() {
  // === Filter State ===
  const [selectedMonth, setSelectedMonth] = useState(defaultMonthIndo);
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [region, setRegion] = useState("All Region");
  const [sto, setSto] = useState("Semua STO");
  const [kpiKey, setKpiKey] = useState(KPI_OPTIONS[0].key);

  // === UI State ===
  const [hiddenLines, setHiddenLines] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Re-combine month & year for internal data fetching
  const month = `${MONTH_MAP[selectedMonth]} ${selectedYear}`;

  // Reset STO dropdown if Region changes
  useEffect(() => {
    setSto("Semua STO");
  }, [region]);

  // Derived options for dropdowns
  const availableRegions = Object.keys(STO_MAP);
  const availableStos = region === "All Region" ? [] : STO_MAP[region];
  const activeKpi = KPI_OPTIONS.find(k => k.key === kpiKey);

  // === Handlers ===
  const handleReset = useCallback(() => {
    setSelectedMonth(defaultMonthIndo);
    setSelectedYear(defaultYear);
    setRegion("All Region");
    setSto("Semua STO");
    setKpiKey(KPI_OPTIONS[0].key);
    setHiddenLines(new Set());
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate network delay for fetching fresh data
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
      setIsRefreshing(false);
    }, 600);
  }, []);

  const toggleLine = useCallback((dataKey) => {
    setHiddenLines((prev) => {
      const next = new Set(prev);
      if (next.has(dataKey)) next.delete(dataKey);
      else next.add(dataKey);
      return next;
    });
  }, []);

  // === Data Transformation ===
  // Memproses data berdasarkan filter: (Month, Region, STO, KPI)
  const { chartData, lines } = useMemo(() => {
    // Ketergantungan ke refreshTrigger memaksa useMemo re-evaluate meskipun filter sama.
    // Di real app, di sini akan fetch ke backend atau membaca ulang Excel data.
    const _forceRefresh = refreshTrigger;

    const rawMonth = TREND_RAW_DATA[month];
    if (!rawMonth) return { chartData: [], lines: [] };

    const dates = rawMonth.dates;
    const entityData = rawMonth.data; // { "Pekalongan": { serviceAvailability: [...] }, ... }

    // Tentukan entity mana saja yang akan ditampilkan sebagai garis di chart
    let entitiesToDisplay = [];
    if (region === "All Region") {
      // Tampilkan semua region parent
      entitiesToDisplay = availableRegions;
    } else {
      // Region tertentu dipilih
      if (sto === "Semua STO") {
        // Tampilkan semua STO di region tsb + parent Region
        entitiesToDisplay = [region, ...STO_MAP[region]];
      } else {
        // Tampilkan hanya 1 STO
        entitiesToDisplay = [sto];
      }
    }

    // Bangun object `{ key, name, color }` untuk dikirim ke TrendChart
    const activeLines = entitiesToDisplay.map(ent => ({
      key: ent,
      name: ent,
      color: REGION_COLORS[ent] || "#64748b"
    }));

    // Bangun chartData array untuk Recharts
    // Format: [ { date: "01 Oct", "Pekalongan": 92.5, "Tegal": 88.0, Target: 90 }, ... ]
    const data = dates.map((d, index) => {
      const point = { date: d, Target: activeKpi.target };
      activeLines.forEach(line => {
        const val = entityData[line.key]?.[kpiKey]?.[index];
        if (val !== undefined) point[line.key] = val;
      });
      return point;
    });

    return { chartData: data, lines: activeLines };
  }, [month, region, sto, kpiKey, activeKpi.target, availableRegions, refreshTrigger]);

  const stats = useMemo(() => {
    let allValues = [];
    chartData.forEach(point => {
      lines.forEach(line => {
        if (!hiddenLines.has(line.key) && point[line.key] !== undefined) {
          allValues.push(point[line.key]);
        }
      });
    });

    if (allValues.length === 0) return { avg: 0, max: 0, min: 0 };
    
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length;

    return { avg, max, min };
  }, [chartData, lines, hiddenLines]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header & Filter Area */}
      <div className="border-b border-gray-100 p-6 bg-gradient-to-b from-white to-gray-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight">Trend Monitoring</h3>
            <p className="text-xs text-gray-500 mt-0.5">Pantau pergerakan performa KPI berdasarkan waktu</p>
          </div>
        </div>

        <TrendFilterBar
          months={INDO_MONTHS}
          years={AVAILABLE_YEARS}
          regions={availableRegions}
          stos={availableStos}
          kpis={KPI_OPTIONS}
          
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          selectedRegion={region}
          selectedSto={sto}
          selectedKpi={kpiKey}
          
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          onRegionChange={setRegion}
          onStoChange={setSto}
          onKpiChange={setKpiKey}
          
          onReset={handleReset}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      </div>

      {/* Summary Statistics */}
      <div className="px-6 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard label="AVERAGE" value={stats.avg} target={activeKpi.target} />
        <KpiCard label="HIGHEST" value={stats.max} target={activeKpi.target} />
        <KpiCard label="LOWEST" value={stats.min} target={activeKpi.target} />
      </div>

      {/* Chart Area */}
      <div className="p-6 relative min-h-[400px]">
        {/* Loading Overlay Skeleton */}
        {isRefreshing && (
          <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-[2px] flex items-end justify-between p-10 rounded-b-xl transition-all duration-300 gap-4 pb-16">
            <Skeleton className="w-full h-[40%]" />
            <Skeleton className="w-full h-[70%]" />
            <Skeleton className="w-full h-[30%]" />
            <Skeleton className="w-full h-[90%]" />
            <Skeleton className="w-full h-[50%]" />
            <Skeleton className="w-full h-[80%]" />
          </div>
        )}

        <TrendChart
          data={chartData}
          lines={lines}
          target={activeKpi.target}
          hiddenLines={hiddenLines}
          onToggleLine={toggleLine}
          kpiLabel={activeKpi.label}
          avg={stats.avg}
        />
      </div>
    </div>
  );
}
