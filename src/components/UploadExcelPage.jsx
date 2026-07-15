import React, { useState, useCallback, useRef } from "react";
import {
  UploadCloud, FileSpreadsheet, CheckCircle2, XCircle, Trash2, Search,
  AlertTriangle, HelpCircle, X,
} from "lucide-react";
import StorageDonut from "./StorageDonut.jsx";
import { RECENT_UPLOADS } from "../data/mockData.js";

export default function UploadExcelPage() {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([
    { name: "KPI_Regional_July_2024.xlsx", size: "1.2 MB", status: "success", progress: 100, rows: 450 },
  ]);
  // FIX: sebelumnya di-hardcode jadi selalu muncul pesan error palsu pas halaman baru dibuka.
  // Error cuma boleh muncul kalau ADA validasi yang beneran gagal.
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList).map((f) => ({
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      status: f.size / 1024 / 1024 > 25 ? "error" : "success",
      progress: 100,
      rows: Math.floor(200 + Math.random() * 400),
    }));

    // FIX: kalau ada file yang kedeteksi > 25MB, baru munculin pesan error, bukan selalu ada.
    const tooLarge = incoming.find((f) => f.status === "error");
    if (tooLarge) {
      setError(`File "${tooLarge.name}" melebihi batas 25MB. Silakan kompres atau pecah filenya.`);
    }

    setFiles((prev) => [...incoming, ...prev]);
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const removeFile = (name) => setFiles((prev) => prev.filter((f) => f.name !== name));

  const handleFileInputChange = (e) => {
    if (e.target.files?.length) addFiles(e.target.files);
    // FIX: reset value biar user bisa pilih file yang SAMA dua kali berturut-turut.
    // Tanpa ini, browser gak nge-trigger onChange kalau file-nya identik dengan sebelumnya.
    e.target.value = "";
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Upload KPI Data</h2>
        <p className="text-sm text-gray-500">Import regional performance metrics from Excel workbooks into the dashboard.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Data import */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">Data Import</h3>
            <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">EXCEL FORMAT</span>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-10 flex flex-col items-center gap-3 text-center transition-colors ${
              dragOver ? "border-red-400 bg-red-50/50" : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <UploadCloud size={22} className="text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">Drag &amp; Drop your Excel file here</p>
            <p className="text-xs text-gray-400">Max file size 25MB, Supports .xlsx, .xls</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="mt-1 px-4 py-1.5 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Browse File
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />
          </div>

          {files.map((f) => (
            <div key={f.name} className="mt-4 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={22} className="text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">
                    {f.size} · {f.status === "success" ? "Ready to import" : "Failed"}
                  </p>
                </div>
                <button onClick={() => removeFile(f.name)} className="text-gray-400 hover:text-red-600 shrink-0" aria-label={`Hapus ${f.name}`}>
                  <Trash2 size={16} />
                </button>
              </div>
              {f.status === "success" && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${f.progress}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-600 font-medium">
                    Validation Successful: {f.rows} rows processed
                  </p>
                </div>
              )}
            </div>
          ))}

          {error && (
            <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3">
              <AlertTriangle size={15} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-600 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 shrink-0" aria-label="Tutup pesan error">
                <X size={14} />
              </button>
            </div>
          )}

          <button className="mt-4 w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
            Import Data to Dashboard
          </button>
        </div>

        {/* Sidebar cards */}
        <div className="space-y-5">
          <div className="bg-slate-900 rounded-lg p-5 text-slate-200">
            <h4 className="text-sm font-bold mb-3 flex items-center gap-1.5">
              Import Guidelines <HelpCircle size={13} className="text-slate-500" />
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" /> Use the standard KPI template</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" /> Date format: DD-MM-YYYY</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" /> No empty rows in the middle</li>
            </ul>
            <button className="mt-4 text-xs font-semibold text-red-400 hover:text-red-300">
              DOWNLOAD TEMPLATE ↓
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm text-center">
            <h4 className="text-sm font-bold text-gray-800 mb-3 text-left">Storage Usage</h4>
            <StorageDonut usedPct={75} />
            <p className="mt-3 text-xs text-gray-400">3.2GB of 5GB Regional Storage used.</p>
          </div>
        </div>
      </div>

      {/* Recent uploads */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Recent Uploads</h3>
          <button className="text-xs font-semibold text-red-600 hover:underline">View All History</button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-gray-400 bg-gray-50">
              <th className="text-left font-semibold px-5 py-2.5">Upload Time</th>
              <th className="text-left font-semibold px-5 py-2.5">Filename</th>
              <th className="text-left font-semibold px-5 py-2.5">User</th>
              <th className="text-left font-semibold px-5 py-2.5">Status</th>
              <th className="text-left font-semibold px-5 py-2.5">Action</th>
            </tr>
          </thead>
          <tbody>
            {RECENT_UPLOADS.map((u) => (
              <tr key={u.file} className="border-t border-gray-100 text-sm">
                <td className="px-5 py-3 text-gray-500">{u.time}</td>
                <td className="px-5 py-3 text-gray-800 font-medium">{u.file}</td>
                <td className="px-5 py-3 text-gray-500">{u.user}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${u.status === "Success" ? "text-emerald-600" : "text-red-600"}`}>
                    {u.status === "Success" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {u.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-400"><Search size={14} className="cursor-pointer hover:text-gray-600" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
