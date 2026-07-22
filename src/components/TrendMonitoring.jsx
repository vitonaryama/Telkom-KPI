import { useState, useMemo, useEffect, useCallback } from "react";
import TrendChart from "./TrendChart.jsx";
import TrendFilterBar from "./TrendFilterBar.jsx";
import { KpiCard, Skeleton } from "./shared.jsx";
import { STO_MAP, REGION_COLORS, KPI_OPTIONS, TREND_RAW_DATA, TREND_MONTHS } from "../data/mockData.js";
import { getKpiTrend, getKpiTrendAll } from "../services/api.js";

// Map frontend kpiKey → backend kpiName
const KPI_NAME_MAP = {
  serviceAvailability: "Service Availability",
  assuranceGuarantee:  "Assurance Guarantee",
  ttr3JamD:            "TTR 3 Diamond",
  ttr6Jam:             "TTR 6 Platinum",
  ttr12Jam:            "TTR 12 Gold",
  ttr24Jam:            "TTR 24 Non HVC",
  ttr3JamM:            "TTR 3 Manja",
  sqm:                 "SQM Close",
};

const AREAS = ["Pekalongan", "Tegal", "Pemalang", "Brebes"];

// Format label sumbu X dari periode_akhir
function formatPeriodeLabel(periodeAkhir, periodeAwal) {
  if (!periodeAkhir) return "?";
  try {
    const end   = new Date(periodeAkhir);
    const start = periodeAwal ? new Date(periodeAwal) : null;
    if (start) {
      const startFmt = start.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      const endFmt   = end.toLocaleDateString("id-ID",   { day: "2-digit", month: "short", year: "2-digit" });
      return `${startFmt}–${endFmt}`;
    }
    return end.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "2-digit" });
  } catch {
    return String(periodeAkhir).slice(0, 10);
  }
}

// Mock fallback menggunakan TREND_RAW_DATA dari mockData
const MONTH_MAP_ENG = {
  "Januari":"Jan","Februari":"Feb","Maret":"Mar","April":"Apr",
  "Mei":"May","Juni":"Jun","Juli":"Jul","Agustus":"Aug",
  "September":"Sep","Oktober":"Oct","November":"Nov","Desember":"Dec",
};
const AVAILABLE_MOCK_MONTHS = ["Oktober","November","Desember","Januari"];
const AVAILABLE_MOCK_YEARS  = Array.from(new Set(TREND_MONTHS.map(m => m.split(" ")[1])));

function buildMockChartData(region, sto, kpiKey, activeKpi) {
  const month = `${MONTH_MAP_ENG["Oktober"]} ${AVAILABLE_MOCK_YEARS[0]}`;
  const rawMonth = TREND_RAW_DATA[month];
  if (!rawMonth) return { chartData: [], lines: [] };
  const dates      = rawMonth.dates;
  const entityData = rawMonth.data;

  let entities;
  if (region === "All Region") {
    entities = AREAS;
  } else if (sto !== "Semua STO") {
    entities = [sto];
  } else {
    entities = [region, ...(STO_MAP[region] || [])];
  }

  const activeLines = entities.map(ent => ({
    key: ent, name: ent, color: REGION_COLORS[ent] || "#64748b",
  }));

  const data = dates.map((d, i) => {
    const point = { date: d, Target: activeKpi.target };
    activeLines.forEach(line => {
      const val = entityData[line.key]?.[kpiKey]?.[i];
      if (val !== undefined) point[line.key] = val;
    });
    return point;
  });

  return { chartData: data, lines: activeLines };
}

export default function TrendMonitoring() {
  const [region,   setRegion]   = useState("All Region");
  const [sto,      setSto]      = useState("Semua STO");
  const [kpiKey,   setKpiKey]   = useState(KPI_OPTIONS[0].key);
  const [granularity, setGranularity] = useState("all");
  const [year,     setYear]     = useState(0);
  const [month,    setMonth]    = useState(0);
  const [hiddenLines, setHiddenLines] = useState(new Set());

  // Real data
  const [rawData,      setRawData]      = useState(null);   // null = belum fetch / tidak ada
  const [dataLoading,  setDataLoading]  = useState(false);
  const [dataError,    setDataError]    = useState(null);
  const [refreshKey,   setRefreshKey]   = useState(0);
  const [availableYears, setAvailableYears] = useState([2024, 2025, 2026]);

  // Load available years from backend
  useEffect(() => {
    import("../services/api.js").then(({ getAvailablePeriods }) => {
      getAvailablePeriods()
        .then((result) => {
          if (result.success && result.data && result.data.length > 0) {
            const years = result.data.map(p => p.year);
            const uniqueYears = [...new Set(years)].sort((a, b) => b - a);
            setAvailableYears(uniqueYears);
          }
        })
        .catch((err) => {
          console.error("Failed to load available periods:", err);
          // Keep fallback hardcoded years [2024, 2025, 2026] if API fails
        });
    });
  }, []); // Run once on mount

  const availableRegions = Object.keys(STO_MAP);
  const availableStos    = region === "All Region" ? [] : (STO_MAP[region] || []);
  const activeKpi        = KPI_OPTIONS.find(k => k.key === kpiKey) || KPI_OPTIONS[0];
  const kpiName          = KPI_NAME_MAP[kpiKey];

  // Reset STO ketika region berubah
  useEffect(() => { setSto("Semua STO"); }, [region]);

  // ── Fetch data dari backend ────────────────────────────────────────────────
  useEffect(() => {
    if (!kpiName) return;

    setDataLoading(true);
    setDataError(null);

    const isAllRegion = region === "All Region";
    const limit = 50; // Ambil max data, filter via year/month

    let fetchPromise;

    if (isAllRegion) {
      // Semua 4 area sekaligus
      fetchPromise = getKpiTrendAll(kpiName, granularity, year, month, limit);
    } else {
      // Area tertentu
      const areaParam = region.toUpperCase();
      fetchPromise = getKpiTrend(kpiName, areaParam, granularity, year, month, limit);
    }

    fetchPromise
      .then(result => {
        let data = result.data || [];
        
        // Filter berdasarkan year & month jika dipilih
        if (year > 0) {
          data = data.filter(row => {
            const rowYear = new Date(row.periode_akhir).getFullYear();
            return rowYear === year;
          });
        }
        if (month > 0) {
          data = data.filter(row => {
            const rowMonth = new Date(row.periode_akhir).getMonth() + 1;
            return rowMonth === month;
          });
        }
        
        setRawData(data.length > 0 ? data : null);
      })
      .catch(err => {
        console.error("Trend fetch error:", err);
        setDataError(err.message);
        setRawData(null);
      })
      .finally(() => setDataLoading(false));
  }, [region, sto, kpiKey, year, month, refreshKey, kpiName, granularity]);

  // ── Build chart data ───────────────────────────────────────────────────────
  const { chartData, lines, dataMode, batchCount } = useMemo(() => {
    // Real data tersedia
    if (rawData && rawData.length > 0) {
      const isAllRegion = region === "All Region";

      if (isAllRegion) {
        // rawData punya field `area` — kumpulkan per area
        const areaMap = {};
        rawData.forEach(row => {
          const areaKey = row.area; // PEKALONGAN, TEGAL, dll (uppercase dari DB)
          if (!areaMap[areaKey]) areaMap[areaKey] = [];
          areaMap[areaKey].push(row);
        });

        // Kumpulkan semua batch_id unik sebagai sumbu X
        const batchIds = [...new Set(rawData.map(r => r.id))].sort((a, b) => a - b);
        const batchMeta = {};
        rawData.forEach(r => { batchMeta[r.id] = r; });

        const activeAreas = Object.keys(areaMap);

        const chartDataBuilt = batchIds.map(bid => {
          const meta  = batchMeta[bid];
          const point = {
            date:   formatPeriodeLabel(meta?.periode_akhir, meta?.periode_awal),
            Target: parseFloat(activeKpi.target),
          };
          activeAreas.forEach(area => {
            const row = areaMap[area]?.find(r => r.id === bid);
            if (row) {
              const displayLabel = area.charAt(0) + area.slice(1).toLowerCase(); // PEKALONGAN → Pekalongan
              point[displayLabel] = parseFloat(row.achieved_pct) || 0;
            }
          });
          return point;
        });

        const linesBuilt = activeAreas.map(area => {
          const label = area.charAt(0) + area.slice(1).toLowerCase();
          return {
            key:   label,
            name:  label,
            color: REGION_COLORS[label] || REGION_COLORS[area] || "#64748b",
          };
        });

        return {
          chartData: chartDataBuilt,
          lines: linesBuilt,
          dataMode: "real",
          batchCount: batchIds.length,
        };

      } else {
        // Satu area — rawData array of { id, periode_awal, periode_akhir, achieved_pct, target_pct, available_stos, WIRADESA, ... }
        const entityLabel = region; // "Pekalongan"
        const avgLabel = `${entityLabel} (Rata-rata Area)`;
        
        let activeStos = [];
        if (sto === "Semua STO") {
          // Kumpulkan semua STO unik dari semua batch
          const stoSet = new Set();
          rawData.forEach(r => {
            if (r.available_stos) r.available_stos.forEach(s => stoSet.add(s));
          });
          activeStos = Array.from(stoSet);
        } else {
          activeStos = [sto];
        }

        const chartDataBuilt = rawData.map(row => {
          const point = {
            date:           formatPeriodeLabel(row.periode_akhir, row.periode_awal),
            Target:         parseFloat(row.target_pct || activeKpi.target),
            batchId:        row.id,
            isAchieved:     row.is_achieved,
          };
          
          if (sto === "Semua STO") {
            point[avgLabel] = parseFloat(row.achieved_pct) || 0;
          }

          activeStos.forEach(s => {
            const searchStr = s.replace(/^STO\s+/i, "");
            const backendKey = Object.keys(row).find(k => k.toLowerCase() === searchStr.toLowerCase());
            if (backendKey && row[backendKey] !== undefined) {
              point[s] = parseFloat(row[backendKey]);
            }
          });

          return point;
        });

        const linesBuilt = [];
        
        // Generate warna acak/teratur untuk STO jika belum ada di REGION_COLORS
        const generateColor = (str) => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
        };

        if (sto === "Semua STO") {
          linesBuilt.push({
            key:   avgLabel,
            name:  avgLabel,
            color: REGION_COLORS[entityLabel] || "#2563eb",
          });
        }
        
        activeStos.forEach(s => {
          linesBuilt.push({
            key:   s,
            name:  s,
            color: REGION_COLORS[s] || generateColor(s),
          });
        });

        return {
          chartData: chartDataBuilt,
          lines: linesBuilt,
          dataMode: "real",
          batchCount: rawData.length,
        };
      }
    }

    // Fallback ke mock data
    if (dataLoading) {
      return { chartData: [], lines: [], dataMode: "loading", batchCount: 0 };
    }

    const mock = buildMockChartData(region, sto, kpiKey, activeKpi);
    return { ...mock, dataMode: "mock", batchCount: 0 };

  }, [rawData, region, sto, kpiKey, activeKpi, dataLoading]);

  // ── Stats (avg/max/min) ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const vals = [];
    chartData.forEach(point => {
      lines.forEach(line => {
        if (!hiddenLines.has(line.key) && typeof point[line.key] === "number") {
          vals.push(point[line.key]);
        }
      });
    });
    if (vals.length === 0) return { avg: 0, max: 0, min: 0 };
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { avg, max, min };
  }, [chartData, lines, hiddenLines]);

  const handleReset = useCallback(() => {
    setRegion("All Region");
    setSto("Semua STO");
    setKpiKey(KPI_OPTIONS[0].key);
    setGranularity("all");
    setYear(0);
    setMonth(0);
    setHiddenLines(new Set());
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const toggleLine = useCallback((key) => {
    setHiddenLines(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">

      {/* Header + Filter */}
      <div className="border-b border-gray-100 p-6 bg-gradient-to-b from-white to-gray-50/50">
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900 tracking-tight">Trend Monitoring</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Pergerakan KPI lintas periode upload — setiap titik mewakili satu batch data
          </p>
        </div>

        <TrendFilterBar
          regions={availableRegions}
          stos={availableStos}
          kpis={KPI_OPTIONS}
          availableYears={availableYears}
          
          selectedGranularity={granularity}
          selectedYear={year}
          selectedMonth={month}
          selectedRegion={region}
          selectedSto={sto}
          selectedKpi={kpiKey}
          
          onGranularityChange={setGranularity}
          onYearChange={setYear}
          onMonthChange={setMonth}
          onRegionChange={setRegion}
          onStoChange={setSto}
          onKpiChange={setKpiKey}
          onReset={handleReset}
          onRefresh={handleRefresh}
          
          isRefreshing={dataLoading}
          dataMode={dataLoading ? "loading" : dataMode}
          batchCount={batchCount}
        />

        {dataError && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            Gagal memuat data: {dataError}
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="px-6 pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="RATA-RATA"  value={stats.avg} target={activeKpi.target} />
        <KpiCard label="TERTINGGI"  value={stats.max} target={activeKpi.target} />
        <KpiCard label="TERENDAH"   value={stats.min} target={activeKpi.target} />
      </div>


      {/* Chart */}
      <div className="p-6 relative min-h-[400px]">
        {dataLoading && (
          <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-[2px] flex items-end justify-between p-10 rounded-b-xl gap-4 pb-16">
            {[40, 70, 30, 90, 50, 80].map((h, i) => (
              <Skeleton key={i} className="w-full" style={{ height: h + "%" }} />
            ))}
          </div>
        )}

        {!dataLoading && chartData.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <span className="text-4xl grayscale opacity-60">📊</span>
            <p className="text-sm font-semibold text-gray-600">Belum ada data trend</p>
            <p className="text-xs text-gray-400 text-center max-w-xs">
              Upload file CSV dengan periode yang berbeda untuk melihat pergerakan KPI antar periode.
            </p>
          </div>
        )}

        {!dataLoading && chartData.length > 0 && (
          <TrendChart
            data={chartData}
            lines={lines}
            target={activeKpi.target}
            hiddenLines={hiddenLines}
            onToggleLine={toggleLine}
            kpiLabel={activeKpi.label}
            avg={stats.avg}
          />
        )}
      </div>
    </div>
  );
        }
