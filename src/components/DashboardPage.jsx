import { useState, useMemo, useCallback, useEffect } from "react";
import { Search } from "lucide-react";
import { KpiCard, KpiCardSkeleton, FilterBarSkeleton, TableSkeleton, EmptyState } from "./shared.jsx";
import ExpandableRow from "./ExpandableRow.jsx";
import TrendMonitoring from "./TrendMonitoring.jsx";
import { getKpiSummary, getKpiOverview, getBatches, getKpiSummaryBySto } from "../services/api.js";
import { WITEL_DATA, TARGETS } from "../data/mockData.js";

const ALL_AREAS = "All Service Areas";

const KPI_MAP = {
  "Service Availability": "availability",
  "Assurance Guarantee": "assurance",
  "TTR 3 Diamond": "ttr3",
  "TTR 6 Platinum": "ttr6Jam",
  "TTR 12 Gold": "ttr12Jam",
  "TTR 24 Non HVC": "ttr24Jam",
  "TTR 3 Manja": "ttr3JamM",
  "SQM Close": "sqm",
};

export default function DashboardPage() {
  const [expanded, setExpanded] = useState({ Pekalongan: true });
  const [stoData, setStoData] = useState({});        // lazy-loaded STO breakdown
  const [stoLoading, setStoLoading] = useState({});  // { areaKey: true/false }
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("All Service Areas");
  const [isLoading, setIsLoading] = useState(true);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [useRealData, setUseRealData] = useState(false);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [kpiData, setKpiData] = useState([]);
  const [overview, setOverview] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const loadBatches = async () => {
    try {
      const result = await getBatches(10, 0);
      const batchList = result.data || [];
      setBatches(batchList);
      if (batchList.length > 0) {
        setSelectedBatchId(batchList[0].id);
        setUseRealData(true);
      }
    } catch {
      setUseRealData(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadKpiData = async (batchId) => {
    try {
      setKpiLoading(true);
      setFetchError(null);
      const [summaryResult, overviewResult] = await Promise.all([
        getKpiSummary(batchId),
        getKpiOverview(batchId),
      ]);
      setKpiData(summaryResult.data || []);
      setOverview(overviewResult.data || null);
      // Reset STO data ketika batch berubah
      setStoData({});
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setKpiLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadKpiData(selectedBatchId);
    }
  }, [selectedBatchId]);

  const toggle = useCallback((witel) => {
    setExpanded((prev) => ({ ...prev, [witel]: !prev[witel] }));
  }, []);

  // Lazy-load STO data saat area row di-expand dalam mode real data
  const handleToggle = useCallback(async (areaKey) => {
    setExpanded((prev) => ({ ...prev, [areaKey]: !prev[areaKey] }));

    if (useRealData && selectedBatchId && !stoData[areaKey]) {
      setStoLoading((prev) => ({ ...prev, [areaKey]: true }));
      try {
        const result = await getKpiSummaryBySto(selectedBatchId, areaKey);
        setStoData((prev) => ({ ...prev, [areaKey]: result.data || [] }));
      } catch {
        // Gagal fetch STO, tampilkan pesan di row
        setStoData((prev) => ({ ...prev, [areaKey]: [] }));
      } finally {
        setStoLoading((prev) => ({ ...prev, [areaKey]: false }));
      }
    }
  }, [useRealData, selectedBatchId, stoData]);

  const witelData = useMemo(() => {
    if (useRealData && kpiData.length > 0) {
      const areaMap = {};
      for (const row of kpiData) {
        const shortKey = KPI_MAP[row.kpi_name];
        if (!shortKey) continue;

        if (!areaMap[row.area]) {
          areaMap[row.area] = {
            witel: row.area,
            area: row.area,
            metrics: {},
            trend: {},
            stos: stoData[row.area] || [],
          };
        }
        areaMap[row.area].metrics[shortKey] = row.achieved_pct;
        // Selalu sync stos dari stoData (bisa berubah setelah lazy load)
        areaMap[row.area].stos = stoData[row.area] || [];
      }
      return Object.values(areaMap);
    }
    return null;
  }, [useRealData, kpiData, stoData]);

  const filteredData = useMemo(() => {
    if (witelData) {
      let data = witelData;
      if (area !== ALL_AREAS) {
        // Compare case-insensitively since API returns uppercase area names
        data = data.filter((w) => (w.area || w.witel || "").toLowerCase() === area.toLowerCase());
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter((w) => (w.area || w.witel || "").toLowerCase().includes(q));
      }
      return data;
    }

    let data = WITEL_DATA;
    if (area !== ALL_AREAS) {
      data = data.filter((w) => w.witel === area);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (w) =>
          w.witel.toLowerCase().includes(q) ||
          w.stos.some((s) => s.nama.toLowerCase().includes(q))
      );
    }
    return data;
  }, [search, area, witelData]);

  const overall = useMemo(() => {
    if (useRealData && overview && overview.overall_kpis) {
      // Real data: gunakan overall_kpis dari API (average dari 4 area)
      const kpis = overview.overall_kpis;
      return {
        availability: kpis["Service Availability"] || 0,
        assurance: kpis["Assurance Guarantee"] || 0,
        ttr3: kpis["TTR 3 Diamond"] || 0,
        ttr6Jam: kpis["TTR 6 Platinum"] || 0,
        ttr12Jam: kpis["TTR 12 Gold"] || 0,
        ttr24Jam: kpis["TTR 24 Non HVC"] || 0,
        ttr3JamM: kpis["TTR 3 Manja"] || 0,
        sqm: kpis["SQM Close"] || 0,
      };
    }

    // Mock data: average dari 4 witel
    const n = WITEL_DATA.length;
    const sum = WITEL_DATA.reduce(
      (acc, w) => ({
        availability: acc.availability + w.metrics.availability,
        assurance: acc.assurance + w.metrics.assurance,
        ttr3: acc.ttr3 + w.metrics.ttr3,
        ttr6Jam: acc.ttr6Jam + w.metrics.ttr6Jam,
        ttr12Jam: acc.ttr12Jam + w.metrics.ttr12Jam,
        ttr24Jam: acc.ttr24Jam + w.metrics.ttr24Jam,
        ttr3JamM: acc.ttr3JamM + w.metrics.ttr3JamM,
        sqm: acc.sqm + w.metrics.sqm,
      }),
      { availability: 0, assurance: 0, ttr3: 0, ttr6Jam: 0, ttr12Jam: 0, ttr24Jam: 0, ttr3JamM: 0, sqm: 0 }
    );
    return {
      availability: sum.availability / n,
      assurance: sum.assurance / n,
      ttr3: sum.ttr3 / n,
      ttr6Jam: sum.ttr6Jam / n,
      ttr12Jam: sum.ttr12Jam / n,
      ttr24Jam: sum.ttr24Jam / n,
      ttr3JamM: sum.ttr3JamM / n,
      sqm: sum.sqm / n,
    };
  }, [useRealData, overview]);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-10">
      {useRealData && selectedBatch && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="text-sm text-blue-800">
            <span className="font-semibold">Mode: Real Data</span> — Batch #{selectedBatch.id}: {selectedBatch.source_filename} ({selectedBatch.periode_awal} s/d {selectedBatch.periode_akhir})
          </div>
          <select
            value={selectedBatchId || ""}
            onChange={(e) => setSelectedBatchId(parseInt(e.target.value))}
            className="text-sm border border-blue-300 rounded-lg px-3 py-1.5 text-blue-800 bg-white focus:outline-none"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                Batch #{b.id} — {b.source_filename}
              </option>
            ))}
          </select>
        </div>
      )}

      {!useRealData && !isLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          <span className="font-semibold">Mode: Mock Data</span> — Backend tidak tersedia atau belum ada data. Menampilkan data contoh.
        </div>
      )}

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          Error: {fetchError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-8 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard label="SERVICE AVAILABILITY" value={overall.availability || 0} target={TARGETS.availability} />
            <KpiCard label="ASSURANCE GUARANTEE" value={overall.assurance || 0} target={TARGETS.assurance} />
            <KpiCard label="TTR 3 JAM D" value={overall.ttr3 || 0} target={TARGETS.ttr3} />
            <KpiCard label="TTR 6 JAM" value={overall.ttr6Jam || 0} target={TARGETS.ttr6Jam} />
            <KpiCard label="TTR 12 JAM" value={overall.ttr12Jam || 0} target={TARGETS.ttr12Jam} />
            <KpiCard label="TTR 24 JAM" value={overall.ttr24Jam || 0} target={TARGETS.ttr24Jam} />
            <KpiCard label="TTR 3 JAM M" value={overall.ttr3JamM || 0} target={TARGETS.ttr3JamM} />
            <KpiCard label="SQM" value={overall.sqm || 0} target={TARGETS.sqm} />
          </>
        )}
      </div>

      {isLoading ? (
        <FilterBarSkeleton />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-wrap items-center gap-4 shadow-sm">
          <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full md:w-auto text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-red-500">
            <option>All Service Areas</option>
            {(witelData ? witelData.map((w) => w.area) : WITEL_DATA.map((w) => w.witel)).map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search STO or KPI..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <TableSkeleton />
      ) : kpiLoading ? (
        <TableSkeleton />
      ) : filteredData.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-slate-900 text-slate-300 text-[11px] uppercase tracking-wide">
                <th className="text-left font-semibold px-4 py-3">Service Area / STO</th>
                <th className="text-left font-semibold px-4 py-3">Service Availability</th>
                <th className="text-left font-semibold px-4 py-3">Assurance Guarantee</th>
                <th className="text-left font-semibold px-4 py-3">TTR 3 Jam D</th>
                <th className="text-left font-semibold px-4 py-3">TTR 6 Jam</th>
                <th className="text-left font-semibold px-4 py-3">TTR 12 Jam</th>
                <th className="text-left font-semibold px-4 py-3">TTR 24 Jam</th>
                <th className="text-left font-semibold px-4 py-3">TTR 3 Jam M</th>
                <th className="text-left font-semibold px-4 py-3">SQM</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <ExpandableRow
                  key={row.witel || row.area}
                  row={row}
                  expanded={!!expanded[row.witel || row.area]}
                  onToggle={() => handleToggle(row.witel || row.area)}
                  useRealData={useRealData}
                  stoLoading={stoLoading[row.witel || row.area]}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TrendMonitoring />
    </div>
  );
}
