export const TARGETS = { availability: 98.52, assurance: 91.71, ttr3: 95.25, ttr6Jam: 95, ttr12Jam: 83, ttr24Jam: 99.04, ttr3JamM: 94.79, sqm: 70 };

export const WITEL_DATA = [
  {
    witel: "Pekalongan",
    metrics: { availability: 99.8, assurance: 92.5, ttr3: 94.2, ttr6Jam: 97.1, ttr12Jam: 98.0, ttr24Jam: 99.1, ttr3JamM: 94.5, sqm: 76.1 },
    trend: { availability: "up", assurance: "up", ttr3: "down", sqm: "up" },
    stos: [
      { nama: "STO PKL", metrics: { availability: 99.9, assurance: 92.5, ttr3: 94.2, ttr6Jam: 97.8, ttr12Jam: 98.5, ttr24Jam: 99.4, ttr3JamM: 95.2, sqm: 76.1 }, trend: { availability: "up", assurance: "up", ttr3: "down", sqm: "up" } },
      { nama: "STO BTG", metrics: { availability: 99.8, assurance: 89.2, ttr3: 91.5, ttr6Jam: 95.3, ttr12Jam: 96.8, ttr24Jam: 98.2, ttr3JamM: 91.7, sqm: 74.2 }, trend: { availability: "up", assurance: "down", ttr3: "up", sqm: "down" } },
      { nama: "STO SBA", metrics: { availability: 99.5, assurance: 90.8, ttr3: 87.4, ttr6Jam: 96.1, ttr12Jam: 97.3, ttr24Jam: 98.7, ttr3JamM: 92.4, sqm: 78.9 }, trend: { availability: "up", assurance: "up", ttr3: "down", sqm: "up" } },
      { nama: "STO BDY", metrics: { availability: 99.7, assurance: 94.1, ttr3: 92.3, ttr6Jam: 98.2, ttr12Jam: 98.9, ttr24Jam: 99.6, ttr3JamM: 96.1, sqm: 80.1 }, trend: { availability: "up", assurance: "up", ttr3: "up", sqm: "up" } },
    ],
  },
  {
    witel: "Tegal",
    metrics: { availability: 99.4, assurance: 88.7, ttr3: 90.6, ttr6Jam: 95.8, ttr12Jam: 96.9, ttr24Jam: 98.3, ttr3JamM: 91.2, sqm: 73.8 },
    trend: { availability: "up", assurance: "down", ttr3: "up", sqm: "down" },
    stos: [
      { nama: "STO ADW", metrics: { availability: 99.6, assurance: 87.5, ttr3: 89.2, ttr6Jam: 95.0, ttr12Jam: 96.4, ttr24Jam: 97.8, ttr3JamM: 90.3, sqm: 72.1 }, trend: { availability: "up", assurance: "down", ttr3: "down", sqm: "down" } },
      { nama: "STO BLU", metrics: { availability: 99.1, assurance: 91.3, ttr3: 93.7, ttr6Jam: 97.2, ttr12Jam: 98.1, ttr24Jam: 99.0, ttr3JamM: 93.5, sqm: 75.6 }, trend: { availability: "down", assurance: "up", ttr3: "up", sqm: "up" } },
      { nama: "STO MGN", metrics: { availability: 99.5, assurance: 85.9, ttr3: 88.4, ttr6Jam: 95.4, ttr12Jam: 96.2, ttr24Jam: 97.5, ttr3JamM: 90.8, sqm: 70.9 }, trend: { availability: "up", assurance: "down", ttr3: "down", sqm: "down" } },
      { nama: "STO SLW", metrics: { availability: 99.3, assurance: 90.1, ttr3: 91.8, ttr6Jam: 96.5, ttr12Jam: 97.6, ttr24Jam: 98.9, ttr3JamM: 92.0, sqm: 76.3 }, trend: { availability: "up", assurance: "up", ttr3: "up", sqm: "up" } },
      { nama: "STO TEG", metrics: { availability: 99.7, assurance: 88.7, ttr3: 89.9, ttr6Jam: 95.9, ttr12Jam: 96.7, ttr24Jam: 98.1, ttr3JamM: 91.4, sqm: 74.0 }, trend: { availability: "up", assurance: "down", ttr3: "down", sqm: "up" } },
    ],
  },
  {
    witel: "Brebes",
    metrics: { availability: 99.2, assurance: 91.0, ttr3: 88.8, ttr6Jam: 96.3, ttr12Jam: 97.4, ttr24Jam: 98.6, ttr3JamM: 92.7, sqm: 77.6 },
    trend: { availability: "up", assurance: "up", ttr3: "down", sqm: "up" },
    stos: [
      { nama: "STO BKA", metrics: { availability: 99.4, assurance: 92.2, ttr3: 90.1, ttr6Jam: 97.0, ttr12Jam: 97.9, ttr24Jam: 99.2, ttr3JamM: 93.8, sqm: 79.0 }, trend: { availability: "up", assurance: "up", ttr3: "up", sqm: "up" } },
      { nama: "STO BRB", metrics: { availability: 99.0, assurance: 89.4, ttr3: 86.5, ttr6Jam: 95.2, ttr12Jam: 96.5, ttr24Jam: 97.6, ttr3JamM: 90.5, sqm: 75.2 }, trend: { availability: "down", assurance: "down", ttr3: "down", sqm: "down" } },
      { nama: "STO BMU", metrics: { availability: 99.3, assurance: 90.7, ttr3: 87.9, ttr6Jam: 96.0, ttr12Jam: 97.1, ttr24Jam: 98.4, ttr3JamM: 91.9, sqm: 78.1 }, trend: { availability: "up", assurance: "up", ttr3: "down", sqm: "up" } },
      { nama: "STO KTM", metrics: { availability: 99.1, assurance: 93.1, ttr3: 91.2, ttr6Jam: 97.5, ttr12Jam: 98.3, ttr24Jam: 99.3, ttr3JamM: 94.2, sqm: 76.8 }, trend: { availability: "up", assurance: "up", ttr3: "up", sqm: "up" } },
      { nama: "STO TTL", metrics: { availability: 99.2, assurance: 89.6, ttr3: 88.3, ttr6Jam: 95.7, ttr12Jam: 96.8, ttr24Jam: 97.9, ttr3JamM: 91.1, sqm: 78.9 }, trend: { availability: "down", assurance: "down", ttr3: "down", sqm: "up" } },
    ],
  },
  {
    witel: "Pemalang",
    metrics: { availability: 99.3, assurance: 89.5, ttr3: 91.2, ttr6Jam: 96.6, ttr12Jam: 97.7, ttr24Jam: 98.8, ttr3JamM: 93.1, sqm: 75.4 },
    trend: { availability: "up", assurance: "down", ttr3: "up", sqm: "up" },
    stos: [
      { nama: "STO CMA", metrics: { availability: 99.5, assurance: 90.9, ttr3: 92.6, ttr6Jam: 97.4, ttr12Jam: 98.2, ttr24Jam: 99.1, ttr3JamM: 94.0, sqm: 76.7 }, trend: { availability: "up", assurance: "up", ttr3: "up", sqm: "up" } },
      { nama: "STO KDW", metrics: { availability: 99.0, assurance: 87.3, ttr3: 88.1, ttr6Jam: 95.1, ttr12Jam: 96.3, ttr24Jam: 97.7, ttr3JamM: 90.1, sqm: 73.5 }, trend: { availability: "down", assurance: "down", ttr3: "down", sqm: "down" } },
      { nama: "STO KJE", metrics: { availability: 99.4, assurance: 91.8, ttr3: 93.4, ttr6Jam: 97.6, ttr12Jam: 98.4, ttr24Jam: 99.5, ttr3JamM: 95.8, sqm: 77.9 }, trend: { availability: "up", assurance: "up", ttr3: "up", sqm: "up" } },
      { nama: "STO PML", metrics: { availability: 99.2, assurance: 88.6, ttr3: 89.7, ttr6Jam: 95.6, ttr12Jam: 96.9, ttr24Jam: 98.0, ttr3JamM: 91.6, sqm: 74.6 }, trend: { availability: "up", assurance: "down", ttr3: "down", sqm: "up" } },
      { nama: "STO RDD", metrics: { availability: 99.1, assurance: 89.0, ttr3: 90.9, ttr6Jam: 96.7, ttr12Jam: 97.5, ttr24Jam: 98.5, ttr3JamM: 92.9, sqm: 74.2 }, trend: { availability: "down", assurance: "up", ttr3: "up", sqm: "down" } },
    ],
  },
];

export const TREND_DATA = [
  { date: "01 Oct", Pekalongan: 91.2, Tegal: 93.5, Brebes: 88.1, Pemalang: 79.4, Target: 90 },
  { date: "07 Oct", Pekalongan: 92.6, Tegal: 94.0, Brebes: 87.4, Pemalang: 82.0, Target: 90 },
  { date: "13 Oct", Pekalongan: 93.1, Tegal: 95.2, Brebes: 89.0, Pemalang: 85.6, Target: 90 },
  { date: "18 Oct", Pekalongan: 93.9, Tegal: 96.0, Brebes: 88.6, Pemalang: 88.2, Target: 90 },
  { date: "23 Oct", Pekalongan: 94.2, Tegal: 96.4, Brebes: 87.9, Pemalang: 89.9, Target: 90 },
  { date: "27 Oct", Pekalongan: 94.0, Tegal: 96.9, Brebes: 89.3, Pemalang: 90.4, Target: 90 },
  { date: "31 Oct", Pekalongan: 94.4, Tegal: 97.1, Brebes: 90.1, Pemalang: 90.4, Target: 90 },
];

export const RECENT_UPLOADS = [
  { time: "14 Jul 2026, 09:45", file: "KPI_Regional_July_2026.csv", user: "Andi Prasetyo", status: "Success" },
  { time: "12 Jul 2026, 14:20", file: "Network_Log_B_Pekalongan.csv", user: "Andi Prasetyo", status: "Failed" },
  { time: "11 Jul 2026, 11:05", file: "Maintenance_Report_Q2.csv", user: "Siti Aminah", status: "Success" },
  { time: "09 Jul 2026, 16:30", file: "Regional_KPI_Draft_v2.csv", user: "Budi Santoso", status: "Success" },
];

export const LINE_COLORS = { Pekalongan: "#2563eb", Tegal: "#16a34a", Brebes: "#7c3aed", Pemalang: "#f59e0b" };

/* =========================================================================
   TREND MONITORING — Data untuk Trend Chart
   =========================================================================
   Property names dirancang untuk mudah dipetakan dari Excel:
     row["SERVICE AVAILABILITY"] -> serviceAvailability
     row["ASSURANCE GUARANTEE"]  -> assuranceGuarantee
     row["TTR 3 JAM D"]          -> ttr3JamD
     row["TTR 6 JAM"]            -> ttr6Jam
     row["TTR 12 JAM"]           -> ttr12Jam
     row["TTR 24 JAM"]           -> ttr24Jam
     row["TTR 3 JAM M"]          -> ttr3JamM
     row["SQM"]                  -> sqm
   ========================================================================= */

export const TREND_MONTHS = ["Oct 2024", "Nov 2024", "Dec 2024", "Jan 2025"];

/** Region -> daftar STO (untuk filter dropdown dependent) */
export const STO_MAP = {
  Pekalongan: ["STO PKL", "STO BTG", "STO SBA", "STO BDY"],
  Tegal:      ["STO ADW", "STO BLU", "STO MGN", "STO SLW", "STO TEG"],
  Brebes:     ["STO BKA", "STO BRB", "STO BMU", "STO KTM", "STO TTL"],
  Pemalang:   ["STO CMA", "STO KDW", "STO KJE", "STO PML", "STO RDD"],
};

/** Warna garis chart per entity */
export const REGION_COLORS = {
  Pekalongan: "#2563eb", Tegal: "#16a34a", Brebes: "#7c3aed", Pemalang: "#f59e0b",
  "STO PKL":  "#3b82f6", "STO BTG": "#0ea5e9",  "STO SBA": "#06b6d4",  "STO BDY": "#0369a1",
  "STO ADW":  "#22c55e", "STO BLU": "#4ade80",  "STO MGN": "#86efac",  "STO SLW": "#15803d", "STO TEG": "#166534",
  "STO BKA":  "#a855f7", "STO BRB": "#c084fc",  "STO BMU": "#d946ef",  "STO KTM": "#6d28d9", "STO TTL": "#4c1d95",
  "STO CMA":  "#fbbf24", "STO KDW": "#fb923c",  "STO KJE": "#f97316",  "STO PML": "#d97706", "STO RDD": "#92400e",
};

/** Opsi KPI untuk filter dropdown */
export const KPI_OPTIONS = [
  { key: "serviceAvailability", label: "Service Availability", target: 99 },
  { key: "assuranceGuarantee",  label: "Assurance Guarantee",  target: 90 },
  { key: "ttr3JamD",            label: "TTR 3 JAM D",          target: 90 },
  { key: "ttr6Jam",             label: "TTR 6 JAM",            target: 95 },
  { key: "ttr12Jam",            label: "TTR 12 JAM",           target: 96 },
  { key: "ttr24Jam",            label: "TTR 24 JAM",           target: 97 },
  { key: "ttr3JamM",            label: "TTR 3 JAM M",          target: 90 },
  { key: "sqm",                 label: "SQM",                  target: 75 },
];

/* ─── Internal helpers ─────────────────────────────────────────────────────
   Fungsi deterministik: seed yang sama selalu menghasilkan nilai yang sama.
   Tidak menggunakan Math.random() agar data stabil lintas render. */
function _noise(a, b, c) {
  const x = Math.sin(a * 127.1 + b * 311.7 + c * 74.3) * 43758.5453;
  return x - Math.floor(x); // 0..1
}
function _gen(base, ei, ki, mi, amp = 0.5) {
  return Array.from({ length: 7 }, (_, i) => {
    const delta = (_noise(ei, ki + mi * 8, i) - 0.5) * 2 * amp;
    return Math.min(100, Math.max(50, +(base + delta).toFixed(1)));
  });
}

/* ─── Tanggal per bulan ─────────────────────────────────────────────────── */
const _MONTH_DATES = {
  "Oct 2024": ["01 Oct", "07 Oct", "13 Oct", "18 Oct", "23 Oct", "27 Oct", "31 Oct"],
  "Nov 2024": ["01 Nov", "06 Nov", "11 Nov", "16 Nov", "21 Nov", "25 Nov", "30 Nov"],
  "Dec 2024": ["01 Dec", "06 Dec", "11 Dec", "16 Dec", "21 Dec", "26 Dec", "31 Dec"],
  "Jan 2025": ["01 Jan", "07 Jan", "13 Jan", "18 Jan", "23 Jan", "27 Jan", "31 Jan"],
};

/* ─── Base value per entity per KPI: [Oct, Nov, Dec, Jan] ──────────────── */
const _B = {
  // Regions
  Pekalongan: { serviceAvailability:[99.1,99.3,99.5,99.6], assuranceGuarantee:[91.0,91.8,92.2,92.5], ttr3JamD:[92.8,93.5,94.2,94.8], ttr6Jam:[96.2,96.5,96.8,97.1], ttr12Jam:[97.3,97.6,97.8,98.0], ttr24Jam:[98.5,98.7,98.9,99.1], ttr3JamM:[93.0,93.5,94.0,94.5], sqm:[75.1,75.4,75.7,76.0] },
  Tegal:      { serviceAvailability:[99.0,99.2,99.3,99.4], assuranceGuarantee:[88.0,88.5,89.0,89.5], ttr3JamD:[94.6,95.2,95.8,96.2], ttr6Jam:[95.8,96.1,96.4,96.7], ttr12Jam:[96.9,97.1,97.3,97.5], ttr24Jam:[98.2,98.4,98.6,98.8], ttr3JamM:[91.0,91.4,91.8,92.2], sqm:[73.5,73.8,74.1,74.4] },
  Brebes:     { serviceAvailability:[99.0,99.1,99.2,99.3], assuranceGuarantee:[90.0,90.5,91.0,91.3], ttr3JamD:[88.6,89.2,89.8,90.4], ttr6Jam:[96.0,96.3,96.5,96.8], ttr12Jam:[97.1,97.4,97.6,97.8], ttr24Jam:[98.3,98.5,98.7,98.9], ttr3JamM:[91.8,92.2,92.6,93.0], sqm:[77.0,77.3,77.6,77.9] },
  Pemalang:   { serviceAvailability:[98.9,99.0,99.2,99.3], assuranceGuarantee:[88.0,88.5,89.2,89.8], ttr3JamD:[85.5,89.8,90.8,91.3], ttr6Jam:[95.5,96.0,96.3,96.6], ttr12Jam:[96.8,97.0,97.4,97.7], ttr24Jam:[97.9,98.2,98.5,98.8], ttr3JamM:[91.0,91.8,92.5,93.1], sqm:[74.5,74.8,75.1,75.4] },
  // STOs Pekalongan
  "STO PKL":  { serviceAvailability:[99.5,99.6,99.7,99.8], assuranceGuarantee:[91.5,92.0,92.3,92.5], ttr3JamD:[93.5,94.0,94.5,95.0], ttr6Jam:[97.0,97.3,97.5,97.8], ttr12Jam:[98.0,98.2,98.4,98.5], ttr24Jam:[99.0,99.1,99.2,99.4], ttr3JamM:[94.0,94.5,95.0,95.2], sqm:[75.5,75.8,76.0,76.1] },
  "STO BTG":  { serviceAvailability:[99.3,99.5,99.6,99.8], assuranceGuarantee:[88.0,88.5,89.0,89.2], ttr3JamD:[90.2,91.0,91.5,92.0], ttr6Jam:[94.5,95.0,95.3,95.5], ttr12Jam:[96.2,96.5,96.8,97.0], ttr24Jam:[97.8,98.0,98.2,98.3], ttr3JamM:[90.8,91.2,91.5,91.7], sqm:[73.5,73.8,74.0,74.2] },
  "STO SBA":  { serviceAvailability:[99.0,99.2,99.4,99.5], assuranceGuarantee:[89.5,90.0,90.5,90.8], ttr3JamD:[86.0,86.8,87.4,88.0], ttr6Jam:[95.2,95.6,96.1,96.3], ttr12Jam:[96.8,97.0,97.3,97.5], ttr24Jam:[98.2,98.4,98.7,98.9], ttr3JamM:[91.5,92.0,92.4,92.7], sqm:[78.0,78.3,78.6,78.9] },
  "STO BDY":  { serviceAvailability:[99.4,99.5,99.6,99.7], assuranceGuarantee:[93.0,93.5,94.0,94.1], ttr3JamD:[91.0,91.8,92.3,93.0], ttr6Jam:[97.5,97.8,98.0,98.2], ttr12Jam:[98.5,98.6,98.8,99.0], ttr24Jam:[99.2,99.3,99.5,99.6], ttr3JamM:[95.0,95.5,96.0,96.1], sqm:[79.5,79.7,80.0,80.1] },
  // STOs Tegal
  "STO ADW":  { serviceAvailability:[99.2,99.3,99.4,99.6], assuranceGuarantee:[86.5,87.0,87.3,87.5], ttr3JamD:[88.0,88.6,89.2,89.8], ttr6Jam:[94.2,94.5,94.8,95.0], ttr12Jam:[96.0,96.2,96.4,96.6], ttr24Jam:[97.5,97.6,97.8,98.0], ttr3JamM:[89.5,90.0,90.3,90.5], sqm:[71.5,71.8,72.0,72.2] },
  "STO BLU":  { serviceAvailability:[98.8,99.0,99.1,99.2], assuranceGuarantee:[90.0,90.5,91.0,91.3], ttr3JamD:[92.5,93.0,93.7,94.2], ttr6Jam:[96.5,96.8,97.2,97.5], ttr12Jam:[97.5,97.7,98.0,98.2], ttr24Jam:[98.5,98.7,99.0,99.2], ttr3JamM:[92.5,93.0,93.5,93.8], sqm:[74.8,75.2,75.6,76.0] },
  "STO MGN":  { serviceAvailability:[99.1,99.3,99.4,99.5], assuranceGuarantee:[84.5,85.0,85.5,85.9], ttr3JamD:[87.0,87.5,88.0,88.5], ttr6Jam:[94.5,94.8,95.2,95.4], ttr12Jam:[95.8,96.0,96.2,96.4], ttr24Jam:[97.2,97.3,97.5,97.7], ttr3JamM:[90.0,90.4,90.8,91.0], sqm:[70.2,70.5,70.7,71.0] },
  "STO SLW":  { serviceAvailability:[99.0,99.1,99.3,99.4], assuranceGuarantee:[89.0,89.5,90.0,90.2], ttr3JamD:[90.5,91.0,91.8,92.3], ttr6Jam:[95.8,96.1,96.5,96.8], ttr12Jam:[97.0,97.2,97.6,97.8], ttr24Jam:[98.5,98.6,98.9,99.0], ttr3JamM:[91.0,91.5,92.0,92.3], sqm:[75.5,75.8,76.1,76.4] },
  "STO TEG":  { serviceAvailability:[99.3,99.4,99.5,99.7], assuranceGuarantee:[87.5,88.0,88.5,88.7], ttr3JamD:[88.5,89.2,89.9,90.5], ttr6Jam:[95.0,95.3,95.9,96.2], ttr12Jam:[96.3,96.5,96.7,97.0], ttr24Jam:[97.8,97.9,98.1,98.3], ttr3JamM:[90.5,91.0,91.4,91.7], sqm:[73.2,73.5,73.8,74.1] },
  // STOs Brebes
  "STO BKA":  { serviceAvailability:[99.1,99.2,99.3,99.4], assuranceGuarantee:[91.0,91.5,92.0,92.2], ttr3JamD:[89.0,89.6,90.1,90.8], ttr6Jam:[96.3,96.6,97.0,97.2], ttr12Jam:[97.5,97.7,97.9,98.2], ttr24Jam:[98.8,98.9,99.2,99.3], ttr3JamM:[92.8,93.2,93.8,94.0], sqm:[78.2,78.5,78.8,79.0] },
  "STO BRB":  { serviceAvailability:[98.7,98.9,99.0,99.1], assuranceGuarantee:[88.0,88.5,89.0,89.4], ttr3JamD:[85.5,86.0,86.5,87.0], ttr6Jam:[94.5,94.8,95.2,95.5], ttr12Jam:[96.0,96.2,96.5,96.8], ttr24Jam:[97.2,97.4,97.6,97.8], ttr3JamM:[89.5,90.0,90.5,90.8], sqm:[74.5,74.8,75.0,75.2] },
  "STO BMU":  { serviceAvailability:[99.0,99.1,99.2,99.3], assuranceGuarantee:[89.5,90.0,90.5,90.7], ttr3JamD:[86.5,87.2,87.9,88.5], ttr6Jam:[95.2,95.5,96.0,96.2], ttr12Jam:[96.7,96.9,97.1,97.3], ttr24Jam:[98.0,98.2,98.4,98.6], ttr3JamM:[90.8,91.3,91.9,92.2], sqm:[77.5,77.7,78.0,78.2] },
  "STO KTM":  { serviceAvailability:[98.8,99.0,99.1,99.2], assuranceGuarantee:[92.0,92.5,93.0,93.2], ttr3JamD:[90.0,90.6,91.2,91.8], ttr6Jam:[96.8,97.1,97.5,97.7], ttr12Jam:[97.9,98.1,98.3,98.5], ttr24Jam:[98.9,99.0,99.3,99.4], ttr3JamM:[93.2,93.7,94.2,94.5], sqm:[76.2,76.5,76.8,77.0] },
  "STO TTL":  { serviceAvailability:[98.9,99.0,99.2,99.3], assuranceGuarantee:[88.5,89.0,89.6,90.0], ttr3JamD:[87.0,87.6,88.3,88.9], ttr6Jam:[94.8,95.2,95.7,96.0], ttr12Jam:[96.4,96.5,96.8,97.0], ttr24Jam:[97.6,97.7,97.9,98.1], ttr3JamM:[90.2,90.6,91.1,91.4], sqm:[78.2,78.4,78.7,78.9] },
  // STOs Pemalang
  "STO CMA":  { serviceAvailability:[99.2,99.3,99.4,99.5], assuranceGuarantee:[89.5,90.0,90.5,90.9], ttr3JamD:[91.0,91.8,92.6,93.2], ttr6Jam:[96.5,96.8,97.4,97.6], ttr12Jam:[97.7,97.9,98.2,98.4], ttr24Jam:[98.7,98.9,99.1,99.3], ttr3JamM:[92.8,93.4,94.0,94.3], sqm:[75.9,76.2,76.5,76.7] },
  "STO KDW":  { serviceAvailability:[98.6,98.7,98.9,99.0], assuranceGuarantee:[86.0,86.5,87.0,87.3], ttr3JamD:[86.8,87.5,88.1,88.8], ttr6Jam:[94.2,94.5,95.1,95.4], ttr12Jam:[96.0,96.1,96.3,96.5], ttr24Jam:[97.3,97.5,97.7,97.9], ttr3JamM:[89.0,89.5,90.1,90.4], sqm:[72.8,73.0,73.3,73.5] },
  "STO KJE":  { serviceAvailability:[99.0,99.2,99.4,99.5], assuranceGuarantee:[90.5,91.0,91.5,91.8], ttr3JamD:[92.0,92.7,93.4,94.0], ttr6Jam:[96.8,97.1,97.6,97.9], ttr12Jam:[98.0,98.1,98.4,98.6], ttr24Jam:[99.0,99.2,99.5,99.6], ttr3JamM:[94.5,95.0,95.8,96.1], sqm:[77.2,77.5,77.9,78.2] },
  "STO PML":  { serviceAvailability:[98.8,99.0,99.2,99.3], assuranceGuarantee:[87.5,88.0,88.5,88.8], ttr3JamD:[88.0,88.8,89.7,90.4], ttr6Jam:[94.8,95.2,95.6,95.9], ttr12Jam:[96.4,96.6,96.9,97.1], ttr24Jam:[97.7,97.8,98.0,98.2], ttr3JamM:[90.5,91.0,91.6,92.0], sqm:[73.8,74.2,74.6,74.9] },
  "STO RDD":  { serviceAvailability:[98.7,98.9,99.1,99.2], assuranceGuarantee:[88.0,88.5,89.0,89.3], ttr3JamD:[89.5,90.2,90.9,91.5], ttr6Jam:[95.8,96.2,96.7,97.0], ttr12Jam:[97.2,97.3,97.5,97.8], ttr24Jam:[98.1,98.3,98.5,98.8], ttr3JamM:[91.8,92.3,92.9,93.3], sqm:[73.5,73.8,74.2,74.5] },
};

const _KPI_KEYS = ["serviceAvailability","assuranceGuarantee","ttr3JamD","ttr6Jam","ttr12Jam","ttr24Jam","ttr3JamM","sqm"];

/**
 * TREND_RAW_DATA
 * Struktur nested untuk kemudahan maintenance dummy data.
 * Saat integrasi Excel, setiap Excel row dipetakan ke:
 *   { date, monthYear, entity, serviceAvailability, assuranceGuarantee, ttr3JamD, ... }
 */
export const TREND_RAW_DATA = (() => {
  const result = {};
  TREND_MONTHS.forEach((month, mIdx) => {
    result[month] = { dates: _MONTH_DATES[month], data: {} };
    Object.entries(_B).forEach(([entity, kpis], eIdx) => {
      result[month].data[entity] = {};
      _KPI_KEYS.forEach((kpi, kIdx) => {
        result[month].data[entity][kpi] = _gen(kpis[kpi][mIdx], eIdx, kIdx, mIdx);
      });
    });
  });
  return result;
})();
