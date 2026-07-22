import { useState, useCallback, useRef, useEffect } from "react";
import {
  UploadCloud, FileSpreadsheet, CheckCircle2, XCircle, Trash2,
  AlertTriangle, HelpCircle, X, Loader2, Eye, ShieldOff,
} from "lucide-react";
import StorageDonut from "./StorageDonut.jsx";
import { uploadCommit, getBatches, validateFile, deleteBatch } from "../services/api.js";

export default function UploadExcelPage({ onUploadSuccess, onUploadError, user }) {
  // Guard: Tampilkan halaman akses ditolak jika bukan admin
  if (!user || user.role !== "admin") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <ShieldOff size={32} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Akses Ditolak</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Anda tidak memiliki hak akses untuk menggunakan fitur Upload Data.
          Fitur ini hanya tersedia untuk Administrator.
        </p>
      </div>
    );
  }

  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null); // { valid_rows, total_rows }
  const [periodeAwal, setPeriodeAwal] = useState("");
  const [periodeAkhir, setPeriodeAkhir] = useState("");
  const [batches, setBatches] = useState([]);
  // Manual file type assignment: { filename: "tiket_close" | "sqm" | "" }
  const [fileTypes, setFileTypes] = useState({});
  const inputRef = useRef(null);

  // States for delete modal
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const loadBatches = async () => {
    try {
      const res = await getBatches();
      setBatches(res.data || []);
    } catch (err) {
      console.error("Gagal load batches:", err);
    }
  };

  const handleDeleteBatch = (id) => {
    setBatchToDelete(id);
    setDeleteError(null);
  };

  const confirmDeleteBatch = async () => {
    if (!batchToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteBatch(batchToDelete);
      setBatchToDelete(null);
      loadBatches();
    } catch (err) {
      setDeleteError(err.message || "Gagal menghapus batch.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList)
      .filter((f) => f.name.endsWith(".csv"))
      .map((f) => ({
        file: f,
        name: f.name,
        size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
        status: "pending",
        progress: 0,
        rows: 0,
      }));

    if (incoming.length === 0) {
      setError("Hanya file CSV (.csv) yang diizinkan.");
      return;
    }

    const tooLarge = incoming.find((f) => f.file.size / 1024 / 1024 > 25);
    if (tooLarge) {
      setError(`File "${tooLarge.name}" melebihi batas 25MB.`);
    }

    setFiles((prev) => [...incoming, ...prev]);
    // Auto-detect file type from name as a convenience default
    setFileTypes((prev) => {
      const updates = {};
      for (const f of incoming) {
        const nameLower = f.name.toLowerCase();
        if (nameLower.includes("tiket") || nameLower.includes("ttr") || nameLower.includes("close")) {
          updates[f.name] = "tiket_close";
        } else if (nameLower.includes("sqm") || nameLower.includes("quality")) {
          updates[f.name] = "sqm";
        } else {
          updates[f.name] = ""; // user must choose manually
        }
      }
      return { ...prev, ...updates };
    });
    setError(null);
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const removeFile = (name) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    setFileTypes((prev) => { const next = { ...prev }; delete next[name]; return next; });
  };

  const handleValidate = async () => {
    const unassigned = files.filter((f) => !fileTypes[f.name]);
    if (unassigned.length > 0) {
      setError(`Tentukan tipe file untuk: ${unassigned.map((f) => f.name).join(", ")}`);
      return;
    }
    setValidating(true);
    setError(null);
    setValidationResult(null);
    try {
      const results = await Promise.all(
        files.map(async (f) => {
          const type = fileTypes[f.name];
          if (!type) return null;
          const res = await validateFile(f.file, type);
          return { name: f.name, ...res.data };
        })
      );
      const combined = results.filter(Boolean).reduce(
        (acc, r) => ({ valid_rows: acc.valid_rows + (r.valid_rows || 0), total_rows: acc.total_rows + (r.total_rows || 0) }),
        { valid_rows: 0, total_rows: 0 }
      );
      setValidationResult(combined);
    } catch (err) {
      setError(err.message || "Validasi gagal.");
    } finally {
      setValidating(false);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Pilih file CSV terlebih dahulu.");
      return;
    }
    if (!periodeAwal || !periodeAkhir) {
      setError("Isi periode awal dan akhir terlebih dahulu.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const unassigned = files.filter((f) => !fileTypes[f.name]);
      if (unassigned.length > 0) {
        setError(`Tentukan tipe file untuk: ${unassigned.map((f) => f.name).join(", ")}`);
        setUploading(false);
        return;
      }

      const tiketFile = files.find((f) => fileTypes[f.name] === "tiket_close")?.file;
      const sqmFile = files.find((f) => fileTypes[f.name] === "sqm")?.file;

      if (!tiketFile && !sqmFile) {
        setError("Minimal satu file harus bertipe 'Tiket Close' atau 'SQM'.");
        setUploading(false);
        return;
      }

      setFiles((prev) => prev.map((f) => ({ ...f, status: "uploading", progress: 50 })));

      const result = await uploadCommit({
        tiketCloseFile: tiketFile,
        sqmFile: sqmFile,
        periodeAwal,
        periodeAkhir,
        sourceFilename: files.map((f) => f.name).join(", "),
      });

      const totalRows = (result.data?.ttrRowCount || 0) + (result.data?.sqmRowCount || 0);
      setFiles((prev) => prev.map((f) => ({
        ...f, status: "success", progress: 100, rows: totalRows,
      })));
      setValidationResult(null);
      loadBatches();
      onUploadSuccess?.(`Upload batch #${result.batchId} berhasil — ${totalRows} baris diproses`);
    } catch (err) {
      setError(err.message || "Upload gagal.");
      setFiles((prev) => prev.map((f) => ({ ...f, status: "error" })));
      onUploadError?.(err.message || "Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "TROUBLE_NO", "STO", "FLAG_HVC", "IS_KPI_TTR", "WSA_EXCLUDE", "KET_EXCLUDE",
      "IS_GAMAS", "TROUBLENO_PARENT", "TROUBLE_OPENTIME", "TROUBLE_CLOSETIME",
      "HOUR_ADJ", "COMPLY3", "COMPLY6", "COMPLY12", "COMPLY24", "COMPLY3_MANJA",
    ];
    const csv = headers.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_tiket_close.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Upload KPI Data</h2>
        <p className="text-sm text-gray-500">Import data KPI dari file CSV ke dashboard.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">Data Import</h3>
            <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">CSV FORMAT</span>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Periode Awal</label>
              <input
                type="date"
                value={periodeAwal}
                onChange={(e) => setPeriodeAwal(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Periode Akhir</label>
              <input
                type="date"
                value={periodeAkhir}
                onChange={(e) => setPeriodeAkhir(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-red-500"
              />
            </div>
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
            <p className="text-sm font-medium text-gray-700">Drag &amp; Drop file CSV di sini</p>
            <p className="text-xs text-gray-400">Format: CSV (.csv) — tiket_close dan/atau sqm</p>
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
              accept=".csv"
              multiple
              className="hidden"
              onChange={(e) => e.target.files?.length && addFiles(e.target.files)}
            />
          </div>

          {files.map((f) => (
            <div key={f.name} className="mt-4 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={22} className={`${f.status === "success" ? "text-emerald-600" : f.status === "error" ? "text-red-600" : "text-gray-400"} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">
                    {f.size} · {f.status === "success" ? "Berhasil diimport" : f.status === "error" ? "Gagal" : f.status === "uploading" ? "Mengupload..." : "Siap diupload"}
                  </p>
                </div>
                {/* Manual file type selector — shown only when pending */}
                {f.status === "pending" && (
                  <select
                    value={fileTypes[f.name] || ""}
                    onChange={(e) => setFileTypes((prev) => ({ ...prev, [f.name]: e.target.value }))}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-700 focus:outline-none focus:border-red-500 shrink-0"
                  >
                    <option value="">-- Pilih Tipe --</option>
                    <option value="tiket_close">Tiket Close</option>
                    <option value="sqm">SQM</option>
                  </select>
                )}
                <button onClick={() => removeFile(f.name)} className="text-gray-400 hover:text-red-600 shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
              {f.status === "uploading" && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${f.progress}%` }} />
                  </div>
                </div>
              )}
              {f.status === "success" && (
                <p className="mt-1 text-[11px] text-emerald-600 font-medium">
                  Berhasil: {f.rows} baris diproses
                </p>
              )}
            </div>
          ))}

          {error && (
            <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3">
              <AlertTriangle size={15} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-600 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 shrink-0"><X size={14} /></button>
            </div>
          )}

          {/* Validation preview */}
          {validationResult && (
            <div className="mt-3 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-emerald-800">Validasi berhasil</p>
                <p className="text-xs text-emerald-700">
                  {validationResult.valid_rows} dari {validationResult.total_rows} baris cocok dengan 19 STO target.
                </p>
              </div>
              <button onClick={() => setValidationResult(null)} className="text-emerald-400 hover:text-emerald-600">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleValidate}
              disabled={validating || uploading || files.length === 0}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {validating ? <><Loader2 size={16} className="animate-spin" /> Validasi...</> : <><Eye size={15} /> Validasi Dulu</>}
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || validating || files.length === 0}
              className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? <><Loader2 size={16} className="animate-spin" /> Mengupload...</> : "Import ke Dashboard"}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-slate-900 rounded-lg p-5 text-slate-200">
            <h4 className="text-sm font-bold mb-3 flex items-center gap-1.5">
              Import Guidelines <HelpCircle size={13} className="text-slate-500" />
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" /> Gunakan template CSV yang tersedia</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" /> Format tanggal: YYYY-MM-DD</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" /> Kolom STO harus sesuai 19 STO target</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" /> File harus berekstensi .csv</li>
            </ul>
            <button
              onClick={handleDownloadTemplate}
              className="mt-4 text-xs font-semibold text-red-400 hover:text-red-300"
            >
              DOWNLOAD TEMPLATE ↓
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm text-center">
            <h4 className="text-sm font-bold text-gray-800 mb-3 text-left">Storage Usage</h4>
            <StorageDonut usedPct={Math.min(batches.length * 5, 100)} />
            <p className="mt-3 text-xs text-gray-400">{batches.length} batch tersimpan.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Recent Uploads</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-gray-400 bg-gray-50">
              <th className="text-left font-semibold px-5 py-2.5">Upload Time</th>
              <th className="text-left font-semibold px-5 py-2.5">Filename</th>
              <th className="text-left font-semibold px-5 py-2.5">Periode</th>
              <th className="text-left font-semibold px-5 py-2.5">Status</th>
              <th className="text-center font-semibold px-5 py-2.5">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {batches.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-6 text-center text-sm text-gray-400">Belum ada upload.</td></tr>
            ) : (
              batches.map((b) => (
                <tr key={b.id} className="border-t border-gray-100 text-sm">
                  <td className="px-5 py-3 text-gray-500">{new Date(b.uploaded_at).toLocaleDateString("id-ID")}</td>
                  <td className="px-5 py-3 text-gray-800 font-medium">{b.source_filename}</td>
                  <td className="px-5 py-3 text-gray-500">{b.periode_awal} s/d {b.periode_akhir}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${b.status === "READY" ? "text-emerald-600" : b.status === "FAILED" ? "text-red-600" : "text-yellow-600"}`}>
                      {b.status === "READY" ? <CheckCircle2 size={13} /> : b.status === "FAILED" ? <XCircle size={13} /> : <Loader2 size={13} />}
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => handleDeleteBatch(b.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Hapus Batch"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* DELETE CONFIRMATION MODAL */}
      {batchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-50 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Hapus Batch?</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Tindakan ini akan menghapus batch secara permanen beserta <strong>semua data tiket dan ringkasan KPI</strong> yang terkait. Tindakan ini tidak dapat dibatalkan.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 flex items-start gap-2">
                <XCircle size={14} className="mt-0.5 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setBatchToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteBatch}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Hapus Permanen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
