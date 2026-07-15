import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Search } from "lucide-react";
import { KpiCard, KpiCardSkeleton, FilterBarSkeleton, TableSkeleton, EmptyState } from "./shared.jsx";
import ExpandableRow from "./ExpandableRow.jsx";
import TrendMonitoring from "./TrendMonitoring.jsx";
import { WITEL_DATA, TARGETS } from "../data/mockData.js";

const ALL_AREAS = "All Service Areas";

export default function DashboardPage() {
  const [expanded, setExpanded] = useState({ Pekalongan: true });
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("2024");
  const [month, setMonth] = useState("Januari");
  const [area, setArea] = useState("All Service Areas");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);


  const toggle = useCallback((witel) => {
    setExpanded((prev) => ({ ...prev, [witel]: !prev[witel] }));
  }, []);

  // FIX: filter Area sekarang beneran jalan, digabung sama search box.
  // Filter Tahun/Bulan sengaja belum disambung — mockData.js belum punya dimensi
  // waktu per witel, jadi baru bisa aktif kalau datanya sudah dari backend
  // yang menyimpan histori bulanan.
  const filteredData = useMemo(() => {
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
  }, [search, area]);

  const overall = useMemo(() => {
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
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-10">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-8 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <KpiCardSkeleton key={i} />)
        ) : (
          <>
            <KpiCard label="SERVICE AVAILABILITY" value={overall.availability} target={TARGETS.availability} />
            <KpiCard label="ASSURANCE GUARANTEE" value={overall.assurance} target={TARGETS.assurance} />
            <KpiCard label="TTR 3 JAM D" value={overall.ttr3} target={TARGETS.ttr3} />
            <KpiCard label="TTR 6 JAM" value={overall.ttr6Jam} target={TARGETS.ttr6Jam} />
            <KpiCard label="TTR 12 JAM" value={overall.ttr12Jam} target={TARGETS.ttr12Jam} />
            <KpiCard label="TTR 24 JAM" value={overall.ttr24Jam} target={TARGETS.ttr24Jam} />
            <KpiCard label="TTR 3 JAM M" value={overall.ttr3JamM} target={TARGETS.ttr3JamM} />
            <KpiCard label="SQM" value={overall.sqm} target={TARGETS.sqm} />
          </>
        )}
      </div>

      {/* Filter bar */}
      {isLoading ? (
        <FilterBarSkeleton />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-wrap items-center gap-4 shadow-sm">
          <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full md:w-auto text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-red-500">
            <option>2024</option>
            <option>2023</option>
          </select>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full md:w-auto text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-red-500">
            {["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full md:w-auto text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-red-500">
            <option>All Service Areas</option>
            {WITEL_DATA.map((w) => <option key={w.witel}>{w.witel}</option>)}
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
          <button className="ml-auto px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98]">
            Apply
          </button>
        </div>
      )}


      {/* Data table */}
      {isLoading ? (
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
                <ExpandableRow key={row.witel} row={row} expanded={!!expanded[row.witel]} onToggle={() => toggle(row.witel)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Trend Monitoring Section */}
      <TrendMonitoring />
    </div>
  );
}
