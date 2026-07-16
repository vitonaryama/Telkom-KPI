import { useState, useMemo, useEffect, useCallback } from "react";
import TrendChart from "./TrendChart.jsx";
import TrendFilterBar from "./TrendFilterBar.jsx";
import { KpiCard, Skeleton } from "./shared.jsx";
import {
  TREND_RAW_DATA, TREND_MONTHS, STO_MAP, REGION_COLORS, KPI_OPTIONS
} from "../data/mockData.js";
import { getKpiTrend } from "../services/api.js";

const INDO_MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const MONTH_MAP = {
  "Januari": "Jan", "Februari": "Feb", "Maret": "Mar", "April": "Apr",
  "Mei": "May", "Juni": "Jun", "Juli": "Jul", "Agustus": "Aug",
  "September": "Sep", "Oktober": "Oct", "November": "Nov", "Desember": "Dec"
};
const REVERSE_MONTH_MAP = Object.fromEntries(Object.entries(MONTH_MAP).map(([k, v]) => [v, k]));

// Map frontend kpiKey -> backend kpiName
const KPI_NAME_MAP = {
  serviceAvailability: "Service Availability",
  assuranceGuarantee: "Assurance Guarantee",
  ttr3JamD: "TTR 3 Diamond",
  ttr6Jam: "TTR 6 Platinum",
  ttr12Jam: "TTR 12 Gold",
  ttr24Jam: "TTR 24 Non HVC",
  ttr3JamM: "TTR 3 Manja",
  sqm: "SQM Close",
};

const defaultMonthEng = TREND_MONTHS[0].split(" ")[0];
const defaultYear = TREND_MONTHS[0].split(" ")[1];
const defaultMonthIndo = REVERSE_MONTH_MAP[defaultMonthEng] || "Oktober";
const AVAILABLE_YEARS = Array.from(new Set(TREND_MONTHS.map(m => m.split(" ")[1])));

export default function TrendMonitoring() {
  const [selectedMonth, setSelectedMonth] = useState(defaultMonthIndo);
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [region, setRegion] = useState("All Region");
  const [sto, setSto] = useState("Semua STO");
  const [kpiKey, setKpiKey] = useState(KPI_OPTIONS[0].key);
  const [hiddenLines, setHiddenLines] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Real-data state
  const [realData, setRealData] = useState(null);   // array from API or null
  const [realLoading, setRealLoading] = useState(false);
  const [usingRealData, setUsingRealData] = useState(false);

  const month = `${MONTH_MAP[selectedMonth]} ${selectedYear}`;

  useEffect(() => { setSto("Semua STO"); }, [region]);

  const availableRegions = Object.keys(STO_MAP);
  const availableStos = region === "All Region" ? [] : STO_MAP[region];
  const activeKpi = KPI_OPTIONS.find(k => k.key === kpiKey);

  // Fetch real trend data saat region atau STO dipilih
  useEffect(() => {
    if (region === "All Region") {
      setRealData(null);
      setUsingRealData(false);
      return;
    }

    const kpiName = KPI_NAME_MAP[kpiKey];
    const areaTarget = sto !== "Semua STO"
      ? sto.replace("STO ", "")  // "STO PKL" -> "PKL"
      : region.toUpperCase();    // "Pekalongan" -> "PEKALONGAN"

    if (!kpiName) return;

    setRealLoading(true);
    getKpiTrend(kpiName, areaTarget, 8)
      .then((result) => {
        if (result.data && result.data.length > 0) {
          setRealData(result.data);
          setUsingRealData(true);
        } else {
          setRealData(null);
          setUsingRealData(false);
        }
      })
      .catch(() => {
        setRealData(null);
        setUsingRealData(false);
      })
      .finally(() => setRealLoading(false));
  }, [region, sto, kpiKey, refreshTrigger]);

  const handleReset = useCallback(() => {
    setSelectedMonth(defaultMonthIndo);
    setSelectedYear(defaultYear);
    setRegion("All Region");
    setSto("Semua STO");
    setKpiKey(KPI_OPTIONS[0].key);
    setHiddenLines(new Set());
    setRealData(null);
    setUsingRealData(false);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
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

  // Build chart data — pakai real data jika tersedia, fallback ke mock
  const { chartData, lines } = useMemo(() => {
    if (usingRealData && realData && realData.length > 0) {
      const entityLabel = sto !== "Semua STO" ? sto : region;
      const color = REGION_COLORS[entityLabel] || "#2563eb";
      const activeLines = [{ key: entityLabel, name: entityLabel, color }];

      const data = realData.map((d) => ({
        date: d.periode_akhir ? new Date(d.periode_akhir).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : `Batch ${d.id}`,
        [entityLabel]: d.achieved_pct,
        Target: activeKpi.target,
      })).reverse(); // Dari lama ke baru

      return { chartData: data, lines: activeLines };
    }

    // Mock data fallback
    const rawMonth = TREND_RAW_DATA[month];
    if (!rawMonth) return { chartData: [], lines: [] };
    const dates = rawMonth.dates;
    const entityData = rawMonth.data;

    let entitiesToDisplay;
    if (region === "All Region") {
      entitiesToDisplay = availableRegions;
    } else {
      entitiesToDisplay = sto === "Semua STO" ? [region, ...STO_MAP[region]] : [sto];
    }

    const activeLines = entitiesToDisplay.map(ent => ({
      key: ent, name: ent, color: REGION_COLORS[ent] || "#64748b"
    }));

    const data = dates.map((d, index) => {
      const point = { date: d, Target: activeKpi.target };
      activeLines.forEach(line => {
        const val = entityData[line.key]?.[kpiKey]?.[index];
        if (val !== undefined) point[line.key] = val;
      });
      return point;
    });

    return { chartData: data, lines: activeLines };
  }, [month, region, sto, kpiKey, activeKpi.target, availableRegions, refreshTrigger, usingRealData, realData]);

  const stats = useMemo(() => {
    const allValues = [];
    chartData.forEach(point => {
      lines.forEach(line => {
        if (!hiddenLines.has(line.key) && point[line.key] !== undefined) {
          allValues.push(point[line.key]);
        }
      });
    });
    if (allValues.length === 0) return { avg: 0, max: 0, min: 0 };
    return {
      max: Math.max(...allValues),
      min: Math.min(...allValues),
      avg: allValues.reduce((a, b) => a + b, 0) / allValues.length,
    };
  }, [chartData, lines, hiddenLines]);

  const showingReal = usingRealData && realData && realData.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="border-b border-gray-100 p-6 bg-gradient-to-b from-white to-gray-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight">Trend Monitoring</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Pantau pergerakan performa KPI berdasarkan waktu
              {showingReal && (
                <span className="ml-2 text-emerald-600 font-semibold">• Real Data ({realData.length} batch)</span>
              )}
              {!showingReal && region !== "All Region" && !realLoading && (
                <span className="ml-2 text-yellow-600 font-semibold">• Mock Data (belum ada data real)</span>
              )}
            </p>
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
          isRefreshing={isRefreshing || realLoading}
        />
      </div>

      <div className="px-6 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard label="AVERAGE" value={stats.avg} target={activeKpi.target} />
        <KpiCard label="HIGHEST" value={stats.max} target={activeKpi.target} />
        <KpiCard label="LOWEST" value={stats.min} target={activeKpi.target} />
      </div>

      <div className="p-6 relative min-h-[400px]">
        {(isRefreshing || realLoading) && (
          <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-[2px] flex items-end justify-between p-10 rounded-b-xl gap-4 pb-16">
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
