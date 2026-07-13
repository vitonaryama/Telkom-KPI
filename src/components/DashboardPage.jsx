import React, { useState, useMemo, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Search } from "lucide-react";
import { KpiCard } from "./shared.jsx";
import ExpandableRow from "./ExpandableRow.jsx";
import { WITEL_DATA, TREND_DATA, TARGETS, LINE_COLORS } from "../data/mockData.js";

export default function DashboardPage() {
  const [expanded, setExpanded] = useState({ Pekalongan: true });
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("2024");
  const [month, setMonth] = useState("Januari");
  const [area, setArea] = useState("All Service Areas");

  const toggle = useCallback((witel) => {
    setExpanded((prev) => ({ ...prev, [witel]: !prev[witel] }));
  }, []);

  const filteredData = useMemo(() => {
    if (!search.trim()) return WITEL_DATA;
    const q = search.toLowerCase();
    return WITEL_DATA.filter(
      (w) =>
        w.witel.toLowerCase().includes(q) ||
        w.stos.some((s) => s.nama.toLowerCase().includes(q))
    );
  }, [search]);

  const overall = useMemo(() => {
    const n = WITEL_DATA.length;
    const sum = WITEL_DATA.reduce(
      (acc, w) => ({
        availability: acc.availability + w.metrics.availability,
        assurance: acc.assurance + w.metrics.assurance,
        ttr3: acc.ttr3 + w.metrics.ttr3,
        sqm: acc.sqm + w.metrics.sqm,
      }),
      { availability: 0, assurance: 0, ttr3: 0, sqm: 0 }
    );
    return {
      availability: sum.availability / n,
      assurance: sum.assurance / n,
      ttr3: sum.ttr3 / n,
      sqm: sum.sqm / n,
    };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="SERVICE AVAILABILITY" value={overall.availability} target={TARGETS.availability} />
        <KpiCard label="ASSURANCE GUARANTEE" value={overall.assurance} target={TARGETS.assurance} />
        <KpiCard label="TTR 3 JAM" value={overall.ttr3} target={TARGETS.ttr3} />
        <KpiCard label="SQM" value={overall.sqm} target={TARGETS.sqm} />
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap items-center gap-3 shadow-sm">
        <select value={year} onChange={(e) => setYear(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-red-500">
          <option>2024</option>
          <option>2023</option>
        </select>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-red-500">
          {["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select value={area} onChange={(e) => setArea(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-red-500">
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
        <button className="ml-auto px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
          Apply
        </button>
      </div>

      {/* Data table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-900 text-slate-300 text-[11px] uppercase tracking-wide">
              <th className="text-left font-semibold px-4 py-3">Service Area / STO</th>
              <th className="text-left font-semibold px-4 py-3">Service Availability</th>
              <th className="text-left font-semibold px-4 py-3">Assurance Guarantee</th>
              <th className="text-left font-semibold px-4 py-3">TTR 3 Jam</th>
              <th className="text-left font-semibold px-4 py-3">SQM</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">Tidak ada data yang cocok.</td></tr>
            ) : (
              filteredData.map((row) => (
                <ExpandableRow key={row.witel} row={row} expanded={!!expanded[row.witel]} onToggle={() => toggle(row.witel)} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Trend chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800">Trend Monitoring — TTR 3 Jam</h3>
          <span className="text-xs text-gray-400">Oktober 2024</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={TREND_DATA} margin={{ top: 5, right: 20, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
            <YAxis domain={[75, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {Object.entries(LINE_COLORS).map(([key, color]) => (
              <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            ))}
            <Line type="monotone" dataKey="Target" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="Target 90%" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
