import { useState, useEffect } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { getProblemTickets } from "../services/api.js";
import { Skeleton } from "./shared.jsx";

export default function ProblemTicketsModal({ isOpen, onClose, batchId, kpiName, area, sto }) {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && batchId && kpiName && area) {
      setIsLoading(true);
      setError(null);
      getProblemTickets(batchId, kpiName, area, sto)
        .then((res) => {
          if (res.success) {
            setTickets(res.data || []);
          } else {
            setError(res.error || "Gagal memuat data");
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, batchId, kpiName, area, sto]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayLocation = sto ? `STO ${sto} (${area})` : `Area ${area}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Clickable backdrop to close */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* Modal content */}
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col mx-4 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Problem Tickets: <span className="text-red-600">{kpiName}</span>
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Menampilkan {tickets.length > 0 ? `top ${tickets.length}` : "data"} tiket bermasalah (Not Comply) di {displayLocation}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 bg-white">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 text-red-500">
              <AlertCircle size={40} className="mb-3 opacity-50" />
              <p className="font-medium text-center">{error}</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <span className="text-5xl mb-4 opacity-50 grayscale">🎉</span>
              <h3 className="text-lg font-semibold text-gray-700">Tidak ada masalah</h3>
              <p className="text-sm mt-1 text-center max-w-sm">
                Tidak ditemukan tiket yang gagal/Not Comply pada metrik {kpiName} di {displayLocation}.
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-semibold border-b border-gray-200">Trouble No</th>
                    <th className="px-4 py-3 font-semibold border-b border-gray-200">STO</th>
                    <th className="px-4 py-3 font-semibold border-b border-gray-200">Waktu Open</th>
                    <th className="px-4 py-3 font-semibold border-b border-gray-200">Waktu Close</th>
                    
                    {/* Kolom Dinamis berdasarkan kpiName */}
                    {kpiName === "Service Availability" && (
                      <>
                        <th className="px-4 py-3 font-semibold border-b border-gray-200">Downtime (Jam)</th>
                        <th className="px-4 py-3 font-semibold border-b border-gray-200">Ket Exclude</th>
                      </>
                    )}
                    {kpiName === "Assurance Guarantee" && (
                      <th className="px-4 py-3 font-semibold border-b border-gray-200">Parent</th>
                    )}
                    {kpiName === "SQM Close" && (
                      <>
                        <th className="px-4 py-3 font-semibold border-b border-gray-200">Status</th>
                        <th className="px-4 py-3 font-semibold border-b border-gray-200">Mapping</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {tickets.map((t, idx) => (
                    <tr key={idx} className="hover:bg-red-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-blue-600">{t.trouble_no}</td>
                      <td className="px-4 py-3 text-gray-600">{t.sto}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {t.trouble_opentime ? new Date(t.trouble_opentime).toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {t.trouble_closetime ? new Date(t.trouble_closetime).toLocaleString('id-ID') : '-'}
                      </td>
                      
                      {/* Kolom Dinamis */}
                      {kpiName === "Service Availability" && (
                        <>
                          <td className="px-4 py-3 text-red-600 font-medium">
                            {typeof t.downtime_hours === 'number' ? t.downtime_hours.toFixed(2) : t.downtime_hours}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{t.ket_exclude || '-'}</td>
                        </>
                      )}
                      {kpiName === "Assurance Guarantee" && (
                        <td className="px-4 py-3 text-gray-500">{t.troubleno_parent || 'Gamas Mandiri'}</td>
                      )}
                      {kpiName === "SQM Close" && (
                        <>
                          <td className="px-4 py-3 text-gray-600">{t.status || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">{t.mapping || '-'}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
